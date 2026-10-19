import fs from 'node:fs';
const path = process.argv[2];
const lines = fs.readFileSync(path, 'utf8').split('\n');
let plus_tables = 0, plus_nontables = 0, minus_tables = 0, minus_nontables = 0;
let plus_sad = 0, minus_sad = 0;
const added = [], removed = [];
for (const l of lines) {
  if (l.startsWith('@@')) continue;
  if (l.startsWith('+') && !l.startsWith('+++') && !l.startsWith('|+')) {
    if (l.startsWith('|')) plus_tables++; else plus_nontables++;
    if (l.includes('PLS-SEC-006')) plus_sad++;
    added.push(l.slice(1));
  }
  if (l.startsWith('-') && !l.startsWith('---') && !l.startsWith('|-')) {
    if (l.startsWith('|')) minus_tables++; else minus_nontables++;
    if (l.includes('PLS-SEC-006')) minus_sad++;
    removed.push(l.slice(1));
  }
}
console.log(JSON.stringify({ plus_tables, plus_nontables, minus_tables, minus_nontables, plus_sad, minus_sad }));
console.log('--- added (first 30) ---');
added.slice(0, 30).forEach(l => console.log(l));
console.log('--- removed (first 30) ---');
removed.slice(0, 30).forEach(l => console.log(l));
