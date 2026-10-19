import re, json

lines = open(r'C:\Users\ADMIN\AppData\Local\Temp\mp_u0.txt', encoding='utf-8').read().split('\n')
st = {'plus_tables': 0, 'plus_nontables': 0, 'minus_tables': 0, 'minus_nontables': 0,
      'plus_sad': 0, 'minus_sad': 0}

for l in lines:
    if l.startswith('@@'):
        continue
    if l.startswith('+') and not l.startswith('+++') and not l.startswith('|+'):
        st['plus_nontables'] += 1
        if 'PLS-SEC-006' in l:
            st['plus_sad'] += 1
    if l.startswith('-') and not l.startswith('---') and not l.startswith('|-'):
        st['minus_nontables'] += 1
        if 'PLS-SEC-006' in l:
            st['minus_sad'] += 1

print(json.dumps(st, indent=1))
