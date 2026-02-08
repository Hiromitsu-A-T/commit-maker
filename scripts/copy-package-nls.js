// Copy localized package.nls.*.json files from source directory to repo root for packaging.
// Keeps the repository root tidy by generating localized NLS files only when needed.

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'i18n', 'package-nls');
const destDir = path.join(__dirname, '..');

fs.mkdirSync(srcDir, { recursive: true });

const files = fs
  .readdirSync(srcDir)
  .filter(f => f.startsWith('package.nls.') && f.endsWith('.json'));

files.forEach(file => {
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
});

console.log(`[build:nls] copied ${files.length} files from ${path.relative(process.cwd(), srcDir)} to repo root`);
