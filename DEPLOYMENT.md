# Hostinger deployment topology

Hoopsnake Designs uses a static-first one-page site with a small PHP form endpoint on Hostinger.

## Release pattern

```text
main -> CI build/test -> clean document-root artifact -> hostinger-deploy -> Hostinger public_html
```

The `hostinger-deploy` branch contains only the runtime artifact. Copy its contents directly into the hosting document root (`public_html`). No `site/` wrapper or path-substitution rewrites are required.

```text
public_html/
  index.html
  _astro/
  images/
  favicon.svg
  images/brand/hoopsnake-icon-32-v004.png
  images/brand/hoopsnake-icon-192-v004.png
  images/brand/hoopsnake-apple-touch-180-v004.png
  robots.txt
  sitemap.xml
  .htaccess
  api/
    project-review.php
    src/
    vendor/

../hsd-private/
  project-review-config.php
  project-review-throttle.json
  project-review-throttle.json.lock
```

Production secrets and throttle state live outside `public_html` under `../hsd-private/`, resolved relative to `DOCUMENT_ROOT`. See `api/private-config.example.php` for the SMTP config template.

Public URLs map directly to filesystem paths:

| Public URL | Filesystem target |
|---|---|
| `/` | `index.html` |
| `/_astro/*` | `_astro/*` |
| `/images/*` | `images/*` |
| `/api/project-review.php` | `api/project-review.php` |

## Hostinger Advanced → Git

| Field | Value |
|---|---|
| Repository | `JonathanEdwardLee/hoopsnake-designs-site` |
| Branch | `hostinger-deploy` |
| Root directory (hosting destination) | `public_html` |

Do **not** use Hostinger Node/Web App build-command settings for this site.

## Developer / CI workflow

Source authoring:

- Astro source: `src/`
- PHP source of truth: `api/src/` (copied into `release/api/src/` during packaging)
- Static inputs: `public/`

Build:

```bash
npm ci
composer install
npm run build
```

Production artifact publication (main branch CI only):

- publishes verified `release/` contents to `hostinger-deploy`

CI verifies:

1. lint / typecheck / JS tests
2. `npm run build`
3. release artifact layout checks
4. no external verification-widget references in source or artifact
5. PHP unit tests + packaged autoload verification
6. real Apache 2.4 + PHP 8.x HTTP integration test
7. audit + secret-value hygiene check

PR CI builds and tests the artifact but does **not** update `hostinger-deploy`.

## Anti-abuse boundary

V1 uses honeypot, strict server-side validation/length limits, and a PHP-native global throttle:

- throttle state: `../hsd-private/project-review-throttle.json` (timestamps only) with sibling lock file for atomic updates
- rolling window: 10 minutes
- cap: 20 POST attempts
- stores timestamps only; no visitor identifiers
- fails open if throttle storage is unavailable
