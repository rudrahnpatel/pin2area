import fs from 'fs';
import path from 'path';
import pincodes from '../client/src/data/pincodes.js';

const sqlLines = [
  '-- Pin2Area MySQL Seed Data Dump',
  'USE pin2area_db;\n',
];

pincodes.forEach((item, index) => {
  const pin = item.pincode.replace(/'/g, "\\'");
  const area = item.area.replace(/'/g, "\\'");
  const lat = item.lat;
  const lng = item.lng;

  sqlLines.push(
    `INSERT INTO pincodes (id, pincode, area_name, latitude, longitude) VALUES (${index + 1}, '${pin}', '${area}', ${lat}, ${lng}) ON DUPLICATE KEY UPDATE area_name='${area}';`
  );

  if (item.subAreas && item.subAreas.length > 0) {
    item.subAreas.forEach((sub) => {
      const cleanSub = sub.replace(/'/g, "\\'");
      sqlLines.push(
        `INSERT INTO sub_localities (pincode_id, sub_area_name) VALUES (${index + 1}, '${cleanSub}');`
      );
    });
  }
});

const outputPath = path.resolve('database/seed.sql');
fs.writeFileSync(outputPath, sqlLines.join('\n'), 'utf-8');
console.log(`Successfully generated database/seed.sql with ${pincodes.length} pincodes!`);
