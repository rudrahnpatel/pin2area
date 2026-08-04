const fs = require('fs');
const path = require('path');

// Bangalore pincodes range: 560001 to 560114, 562106, 562125, 562130, 562157, 562162
const pincodeList = [];
for (let i = 1; i <= 117; i++) {
  pincodeList.push(`560${i.toString().padStart(3, '0')}`);
}
pincodeList.push('562106', '562125', '562130', '562157', '562162');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeArea(areaName) {
  try {
    const cleanName = areaName.replace(/\(.*\)/g, '').replace(/S\.O|B\.O|H\.O/gi, '').trim();
    const query = encodeURIComponent(`${cleanName}, Bengaluru, Karnataka, India`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'Pin2Area-DataLoader/1.0' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(parseFloat(data[0].lat).toFixed(4)),
        lng: parseFloat(parseFloat(data[0].lon).toFixed(4))
      };
    }
  } catch (err) {
    console.error(`Geocode error for ${areaName}:`, err.message);
  }
  return null;
}

async function main() {
  console.log(`Starting fetch for ${pincodeList.length} pincodes...`);
  const validPincodes = [];

  for (let i = 0; i < pincodeList.length; i++) {
    const code = pincodeList[i];
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
      const data = await res.json();

      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
        const offices = data[0].PostOffice;
        // Filter for Bangalore district
        const blrOffices = offices.filter(po => 
          po.District && (po.District.toLowerCase().includes('bangalore') || po.District.toLowerCase().includes('bengaluru'))
        );

        if (blrOffices.length > 0) {
          // Find Sub Post Office or Head Post Office as main area
          const subPO = blrOffices.find(po => po.BranchType === 'Sub Post Office' || po.BranchType === 'Head Post Office') || blrOffices[0];
          
          const mainArea = subPO.Name.replace(/\(.*\)/g, '').replace(/ S\.O$| B\.O$| H\.O$/gi, '').trim();
          const subAreas = Array.from(new Set(blrOffices.map(po => po.Name.replace(/\(.*\)/g, '').replace(/ S\.O$| B\.O$| H\.O$/gi, '').trim()))).filter(name => name !== mainArea);

          console.log(`[${i+1}/${pincodeList.length}] Found ${code}: Main = "${mainArea}", Sub = [${subAreas.join(', ')}]`);

          validPincodes.push({
            pincode: code,
            area: mainArea,
            subAreas: subAreas,
            lat: null,
            lng: null
          });
        }
      }
    } catch (e) {
      console.error(`Error fetching ${code}:`, e.message);
    }
    await sleep(150); // slight delay
  }

  console.log(`\nSuccessfully retrieved ${validPincodes.length} Bangalore pincodes from India Post API.`);
  console.log(`Now geocoding coordinates for each area...`);

  // Fallback map for well-known Bangalore centers if geocoding fails
  const fallbackCoords = {
    '560001': { lat: 12.9766, lng: 77.5993 },
    '560002': { lat: 12.9653, lng: 77.5754 },
    '560003': { lat: 12.9965, lng: 77.5713 },
    '560004': { lat: 12.9425, lng: 77.5738 },
    '560034': { lat: 12.9352, lng: 77.6245 },
    '560038': { lat: 12.9784, lng: 77.6408 },
    '560066': { lat: 12.9843, lng: 77.7330 },
    '560092': { lat: 13.0590, lng: 77.5910 },
    '560093': { lat: 12.9860, lng: 77.6630 },
    '560095': { lat: 12.9385, lng: 77.6191 },
    '560100': { lat: 12.8390, lng: 77.6770 },
    '560102': { lat: 12.9121, lng: 77.6446 }
  };

  for (let j = 0; j < validPincodes.length; j++) {
    const item = validPincodes[j];
    console.log(`Geocoding (${j+1}/${validPincodes.length}): ${item.pincode} - ${item.area}`);
    
    let coords = await geocodeArea(item.area);
    if (!coords && fallbackCoords[item.pincode]) {
      coords = fallbackCoords[item.pincode];
    }
    if (!coords) {
      // try with first subArea
      if (item.subAreas.length > 0) {
        coords = await geocodeArea(item.subAreas[0]);
      }
    }
    if (!coords) {
      // Default to central Bengaluru
      coords = { lat: 12.9716, lng: 77.5946 };
    }

    item.lat = coords.lat;
    item.lng = coords.lng;

    await sleep(1100); // 1.1s for Nominatim rate limit
  }

  // Save to client/src/data/pincodes.js
  const jsContent = `const pincodes = ${JSON.stringify(validPincodes, null, 2)};

// Client-side search with scoring
export function searchPincodes(query) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  return pincodes
    .map(p => {
      let score = 0;
      const area = p.area.toLowerCase();
      const pin = p.pincode;
      const subs = p.subAreas.map(s => s.toLowerCase());

      if (pin === q) score = 100;
      else if (pin.startsWith(q)) score = 80;
      else if (area === q) score = 95;
      else if (area.startsWith(q)) score = 75;
      else if (area.includes(q)) score = 60;
      else {
        for (const sub of subs) {
          if (sub === q) { score = 90; break; }
          if (sub.startsWith(q)) { score = 70; break; }
          if (sub.includes(q)) { score = 55; break; }
        }
      }

      if (score === 0) {
        const allText = \`\${area} \${subs.join(' ')}\`;
        const words = allText.split(/\\s+/);
        for (const w of words) {
          if (w.startsWith(q)) { score = 40; break; }
          if (w.includes(q)) { score = 25; break; }
        }
      }

      return { ...p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

export default pincodes;
`;

  fs.writeFileSync(path.join(__dirname, '../client/src/data/pincodes.js'), jsContent);
  console.log('\nData rebuild complete! Verified against India Post API.');
}

main().catch(err => console.error('Fatal error:', err));
