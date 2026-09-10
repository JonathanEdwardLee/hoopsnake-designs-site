# Hostinger deployment topology

Hoopsnake Designs uses a static-first site with a small PHP form endpoint on Hostinger.

## Build output

`npm run build` produces a self-contained deploy artifact in `dist/`:

```text
dist/
  index.html
  _astro/
  images/
  api/
    project-review.php
    config.example.php
    vendor/                 # production Composer deps (PHPMailer + autoload)
  robots.txt
  sitemap.xml
  favicon.svg
```

The PHP entrypoint resolves runtime files relative to `dist/api/` only:

- autoload: `dist/api/vendor/autoload.php`
- config: `dist/api/config.php` (runtime only) or `dist/api/config.example.php`

## Hostinger GitHub auto-deploy expectation

Configure Hostinger to deploy the contents of `dist/` to the site document root after CI/build on accepted `main`.

Runtime steps on Hostinger (not performed in this repo):

1. Copy `dist/api/config.example.php` to `dist/api/config.php`
2. Set `mail_mode=smtp` and inject SMTP/Turnstile secrets via Hostinger environment or server-only config
3. Keep `projects@hoopsnakedesigns.com` as the recommended inbox without creating it in this mission

## Local / CI behavior

- Default packaged config uses `mail_mode=nosend`
- Production SMTP mode fails closed with HTTP 503 when required secrets are absent
- V1 intentionally omits cross-request burst throttling; Turnstile + honeypot + server validation provide the baseline protection layer

## Verification

CI runs:

- `npm run build` (includes Hostinger packaging step)
- `npm run test:php` including `DeploymentBootTest` for self-contained `dist/api/` layout
