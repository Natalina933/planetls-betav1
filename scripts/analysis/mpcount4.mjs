import fs from 'node:fs';
const p = 'C:/Users/ADMIN/AppData/Local/Temp/mpdiff2.txt';
const buf = fs.readFileSync(p);
console.log('size:', buf.length);
const txt = buf.toString('utf8');
console.log('first 300 chars:');
console.log(txt.slice(0, 300));
console.log('lines starts with +:', txt.split('\n').filter(l => l.startsWith('+')).length);
console.log('lines starts with + (cr):', txt.split('\r\n').filter(l => l.startsWith('+')).length);
