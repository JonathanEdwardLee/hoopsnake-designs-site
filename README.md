# Hoopsnake Designs Site

Authoritative implementation repository for the Hoopsnake Designs premium-services website.

Product implementation is performed by CloudDev through bounded branch/PR work and independently reviewed by HSD Primary. This repository does not contain PIM control/governance material or secrets.

## Stack

- Astro + TypeScript static site
- Minimal client JavaScript for Project Fit and the qualified project review form
- PHP endpoint for authenticated SMTP delivery on Hostinger with honeypot, server validation, and a PHP-native global throttle

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
npm run test:apache
npm run lint
npm run check
```

## Runtime configuration

Copy production SMTP settings to `../hsd-private/project-review-config.php` outside the hosting document root (see `api/private-config.example.php` and [DEPLOYMENT.md](./DEPLOYMENT.md)).

`npm run build` packages a document-root-ready `release/` artifact. Main-branch CI publishes verified runtime files to the `hostinger-deploy` branch.

- `mail_mode=nosend` for local/test environments via `HSD_TEST_CONFIG_PATH`
- `mail_mode=smtp` for production once Hostinger SMTP credentials are configured in the private server config
- Visitor email is sent in SMTP `Reply-To`, never authenticated `From`

## Deployment boundary

This repository intentionally does not deploy production, change DNS, or create mailboxes. Release decisions are made separately by HSD Primary.
