import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const jsr = JSON.parse(readFileSync('jsr.json', 'utf8'));

if (jsr.version !== pkg.version) {
  jsr.version = pkg.version;
  writeFileSync('jsr.json', JSON.stringify(jsr, null, 2) + '\n');
}
