// Fix ONLY coordinates using Nominatim geocoding - keep existing area names
const fs = require('fs');
const path = require('path');

// Manually curated corrections for known wrong entries
// Source: cross-referencing India Post delivery areas with Google Maps, housing.com, mapsofindia.com
const CORRECTIONS = {
  '560095': { area: 'Koramangala 6th Block', subAreas: ['Koramangala 5th Block', 'ST Bed Layout', 'Ejipura'] },
  '560093': { area: 'Kaggadasapura', subAreas: ['BEML 5th Stage', 'Channasandra'] },
  '560014': { area: 'Benson Town', subAreas: ['Davis Road', 'Richards Park'] },
  '560015': { area: 'Malleswaram West', subAreas: ['Margosa Road', '18th Cross'] },
  '560032': { area: 'Tippasandra', subAreas: ['HAL 3rd Stage', 'New Tippasandra'] },
};

// Read current data
const currentFile = fs.readFileSync(path.join(__dirname, '../client/src/data/pincodes.js'), 'utf8');
const match = currentFile.match(/const pincodes = (\[[\s\S]*?\]);/);
const pincodes = eval(match[1]);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function geocode(areaName) {
  try {
    const query = encodeURIComponent(`${areaName}, Bengaluru, Karnataka, India`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'Pin2Area-GeoFix/1.0' }
    });
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(parseFloat(data[0].lat).toFixed(4)), lng: parseFloat(parseFloat(data[0].lon).toFixed(4)) };
    }
  } catch (e) {
    console.error(`  Geocode failed: ${e.message}`);
  }
  return null;
}

async function main() {
  const results = [];
  let updated = 0;

  for (let i = 0; i < pincodes.length; i++) {
    let p = { ...pincodes[i] };

    // Apply manual corrections first
    if (CORRECTIONS[p.pincode]) {
      const fix = CORRECTIONS[p.pincode];
      console.log(`[${i+1}/${pincodes.length}] CORRECTING ${p.pincode}: "${p.area}" -> "${fix.area}"`);
      p.area = fix.area;
      p.subAreas = fix.subAreas;
    } else {
      console.log(`[${i+1}/${pincodes.length}] Geocoding ${p.pincode} (${p.area})...`);
    }

    // Geocode for accurate coordinates
    const coords = await geocode(p.area);
    await sleep(1100);

    if (coords) {
      const latDiff = Math.abs(coords.lat - p.lat);
      const lngDiff = Math.abs(coords.lng - p.lng);
      if (latDiff > 0.005 || lngDiff > 0.005) {
        console.log(`  -> Moved: [${p.lat}, ${p.lng}] -> [${coords.lat}, ${coords.lng}] (delta: ${latDiff.toFixed(4)}, ${lngDiff.toFixed(4)})`);
        p.lat = coords.lat;
        p.lng = coords.lng;
        updated++;
      } else {
        console.log(`  -> OK (within tolerance)`);
      }
    } else {
      console.log(`  -> Geocode failed, keeping original coords`);
    }

    results.push(p);
  }

  // Write updated data
  const output = `const pincodes = ${JSON.stringify(results, null, 2)};

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

  fs.writeFileSync(path.join(__dirname, '../client/src/data/pincodes.js'), output);
  console.log(\`\\nDone! Updated coordinates for \${updated} out of \${pincodes.length} pincodes.\`);
}

main().catch(console.error);
