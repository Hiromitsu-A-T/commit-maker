// 生成した翻訳コピーを除去し、英語の編集元 package.nls.json は保持する。

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
