#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const releaseDir = path.join(root, 'release');
const releaseApi = path.join(releaseDir, 'api');

if (!existsSync(distDir)) {
  console.error('Missing Astro build output at dist/. Run astro build first.');
  process.exit(1);
}

rmSync(releaseDir, { recursive: true, force: true });
mkdirSync(releaseApi, { recursive: true });

cpSync(distDir, releaseDir, { recursive: true });
cpSync(path.join(root, 'api', 'src'), path.join(releaseApi, 'src'), { recursive: true });
cpSync(path.join(root, 'public', 'api', 'project-review.php'), path.join(releaseApi, 'project-review.php'));
cpSync(path.join(root, 'api', 'deploy', 'composer.json'), path.join(releaseApi, 'composer.json'));
cpSync(path.join(root, 'deploy', '.htaccess'), path.join(releaseDir, '.htaccess'));
cpSync(path.join(root, 'deploy', 'api.htaccess'), path.join(releaseApi, '.htaccess'));

execSync('composer install --no-dev --optimize-autoloader --no-interaction', {
  cwd: releaseApi,
  stdio: 'inherit',
});

for (const file of ['composer.json', 'composer.lock']) {
  unlinkSync(path.join(releaseApi, file));
}

console.log('Packaged document-root release artifact at release/');
