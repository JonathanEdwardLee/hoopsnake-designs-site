#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const siteApi = path.join(root, 'site', 'api');

mkdirSync(siteApi, { recursive: true });
rmSync(path.join(siteApi, 'vendor'), { recursive: true, force: true });
rmSync(path.join(siteApi, 'src'), { recursive: true, force: true });

cpSync(path.join(root, 'api', 'src'), path.join(siteApi, 'src'), { recursive: true });
cpSync(path.join(root, 'api', 'config.example.php'), path.join(siteApi, 'config.example.php'));
cpSync(path.join(root, 'public', 'api', 'project-review.php'), path.join(siteApi, 'project-review.php'));
cpSync(path.join(root, 'api', 'deploy', 'composer.json'), path.join(siteApi, 'composer.json'));

execSync('composer install --no-dev --optimize-autoloader --no-interaction', {
  cwd: siteApi,
  stdio: 'inherit',
});

writeFileSync(
  path.join(siteApi, '.htaccess'),
  '# Allow PHP execution for the project review endpoint only.\n<Files "project-review.php">\n  Require all granted\n</Files>\n',
);

console.log('Packaged self-contained Hostinger API artifact at site/api/');
