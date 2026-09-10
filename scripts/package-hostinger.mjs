#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const distApi = path.join(root, 'dist', 'api');
const buildVendor = path.join(root, '.build-vendor');

mkdirSync(distApi, { recursive: true });
rmSync(buildVendor, { recursive: true, force: true });

execSync('composer install --no-dev --optimize-autoloader --no-interaction', {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    COMPOSER_VENDOR_DIR: buildVendor,
  },
});

rmSync(path.join(distApi, 'vendor'), { recursive: true, force: true });
cpSync(buildVendor, path.join(distApi, 'vendor'), { recursive: true });
cpSync(path.join(root, 'api', 'config.example.php'), path.join(distApi, 'config.example.php'));
rmSync(buildVendor, { recursive: true, force: true });

console.log('Packaged self-contained Hostinger API artifact at dist/api/');
