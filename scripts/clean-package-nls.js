// Remove generated localized package.nls.*.json files from repo root (keeps base package.nls.json).

const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, '..');

const files = fs
  .readdirSync(destDir)
  .filter(f => f.startsWith('package.nls.') && f.endsWith('.json') && f !== 'package.nls.json');

files.forEach(file => {
  fs.rmSync(path.join(destDir, file));
});

console.log(`[clean:nls] removed ${files.length} generated files`);
