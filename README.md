# Hoopsnake Designs Site

Authoritative implementation repository for the Hoopsnake Designs premium-services website.

Product implementation is performed by CloudDev through bounded branch/PR work and independently reviewed by HSD Primary. This repository does not contain PIM control/governance material or secrets.

## Stack

- Astro + TypeScript static site
- Minimal client JavaScript for Project Fit and the qualified project review form
- PHP endpoint for Cloudflare Turnstile verification and authenticated SMTP delivery on Hostinger

## Local development

```bash
npm ci
composer install
npm run dev
```

Preview the static build:

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
npm run test:php
npm run lint
npm run check
```

## Runtime configuration

Copy `.env.example` values into Hostinger runtime configuration or a server-only `api/config.php` derived from `api/config.example.php`.

- `mail_mode=nosend` for local/test environments
- `mail_mode=smtp` for production once Hostinger SMTP credentials and Turnstile secrets are configured
- Visitor email is sent in SMTP `Reply-To`, never authenticated `From`

## Deployment boundary

This repository intentionally does not deploy production, change DNS, or create mailboxes. Release decisions are made separately by HSD Primary.
