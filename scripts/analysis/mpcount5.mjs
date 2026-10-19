import fs from 'node:fs';
const raw = fs.readFileSync('C:/Users/ADMIN/AppData/Local/Temp/mpdiff2.txt');
const txt = raw.toString('utf16le').replace(/^\ufeff/, '');
const lines = txt.split('\n');
let plusTables = 0, plusNT = 0, minusTables = 0, minusNT = 0;
const added = [], removed = [];
for (let l of lines) {
  if (l.startsWith('@@')) continue;
  if (l.startsWith('+') && !l.startsWith('+++') && !l.startsWith('|+')) {
    if (l.startsWith('|')) plusTables++; else plusNT++;
    added.push(l.slice(1));
  }
  if (l.startsWith('-') && !l.startsWith('---') && !l.startsWith('|-')) {
    if (l.startsWith('|')) minusTables++; else minusNT++;
    removed.push(l.slice(1));
  }
}
console.log(JSON.stringify({ plusTables, plusNT, minusTables, minusNT }));
console.log('--- added (first 60) ---');
added.slice(0, 60).forEach((l, i) => console.log(i + ': ' + l));
console.log('--- removed (first 60) ---');
removed.slice(0, 60).forEach((l, i) => console.log(i + ': ' + l));
