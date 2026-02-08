#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const VSIX_DIR = path.join(ROOT, 'vsix');
const KEEP = 5;

function removeRootVsix() {
  const rootFiles = fs.readdirSync(ROOT);
  for (const file of rootFiles) {
    if (file.endsWith('.vsix')) {
      const target = path.join(ROOT, file);
      fs.rmSync(target);
      console.log(`Removed stray VSIX: ${file}`);
    }
  }
}

function pruneVsixDir() {
  if (!fs.existsSync(VSIX_DIR)) return;
  const entries = fs.readdirSync(VSIX_DIR)
    .filter(f => f.endsWith('.vsix'))
    .map(name => {
      const full = path.join(VSIX_DIR, name);
      const stat = fs.statSync(full);
      return { name, full, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  const toDelete = entries.slice(KEEP);
  for (const file of toDelete) {
    fs.rmSync(file.full);
    console.log(`Removed old VSIX: ${file.name}`);
  }
}

removeRootVsix();
pruneVsixDir();
