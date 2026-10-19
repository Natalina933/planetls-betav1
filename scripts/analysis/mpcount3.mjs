import fs from 'node:fs';
const lines = fs.readFileSync('C:/Users/ADMIN/AppData/Local/Temp/mpdiff2.txt', 'utf8').split('\n');
const pl = lines.filter(l => l.startsWith('+') && !l.startsWith('+++') && !l.startsWith('|+'));
const mi = lines.filter(l => l.startsWith('-') && !l.startsWith('---') && !l.startsWith('|-'));
console.log('plus:', pl.length, 'minus:', mi.length);
console.log(JSON.stringify(pl.slice(0, 5)));
console.log(JSON.stringify(mi.slice(0, 5)));
