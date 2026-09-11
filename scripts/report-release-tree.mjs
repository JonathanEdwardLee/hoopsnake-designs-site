#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const releaseDir = path.join(process.cwd(), 'release');

function walk(dir, prefix = '') {
  const entries = readdirSync(dir).sort();
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const relPath = prefix ? `${prefix}/${entry}` : entry;
    const stat = statSync(fullPath);
    console.log(stat.isDirectory() ? `${relPath}/` : relPath);
    if (stat.isDirectory()) {
      walk(fullPath, relPath);
    }
  }
}

if (!statSync(releaseDir).isDirectory()) {
  console.error('Missing release/ artifact. Run npm run build first.');
  process.exit(1);
}

console.log('release/');
walk(releaseDir);
