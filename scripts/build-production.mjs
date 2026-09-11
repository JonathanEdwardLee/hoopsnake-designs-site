#!/usr/bin/env node
import { execSync } from 'node:child_process';

const siteKey = process.env.HSD_TURNSTILE_SITE_KEY?.trim();
if (!siteKey) {
  console.error('HSD_TURNSTILE_SITE_KEY is required for production artifact builds.');
  process.exit(1);
}

execSync('npm run build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    PUBLIC_TURNSTILE_SITE_KEY: siteKey,
  },
});
