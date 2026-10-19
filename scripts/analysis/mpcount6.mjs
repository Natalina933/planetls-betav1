import fs from 'node:fs';
const raw = fs.readFileSync('C:/Users/ADMIN/AppData/Local/Temp/mpdiff2.txt');
const txt = raw.toString('utf16le').replace(/^\ufeff/, '');
const lines = txt.split('\n');
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith('|') && !l.startsWith('|+')) {
    console.log(i + ': [' + l.substring(0, 30) + ']');
  }
  if (l.startsWith('+') && l.length > 2 && l.startsWith('+|')) {
    console.log('ROW-PLUS @' + i + ': [' + l.substring(0, 40) + ']');
  }
}
console.log('total lines:', lines.length);
console.log('lines starting with +|: ' + lines.filter(l => l.startsWith('+|')).length);
console.log('lines starting with -|: ' + lines.filter(l => l.startsWith('-|')).length);
console.log('sample around index 13:');
lines.slice(12, 16).forEach((l, i) => console.log((i + 12) + ': [' + l + ']'));
