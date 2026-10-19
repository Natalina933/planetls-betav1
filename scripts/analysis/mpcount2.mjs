import fs from 'node:fs';
const diff = fs.readFileSync('C:/Users/ADMIN/AppData/Local/Temp/mpdiff2.txt', 'utf8');
const lines = diff.split('\n');
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
fs.writeFileSync('C:/Users/ADMIN/Desktop/planetls-beta/scripts/analysis/mpstats.json', JSON.stringify({ plusTables, plusNT, minusTables, minusNT, addedCount: added.length, removedCount: removed.length }, null, 1));
console.log(JSON.stringify({ plusTables, plusNT, minusTables, minusNT }));
