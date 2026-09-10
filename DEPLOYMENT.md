# Hostinger deployment topology

Hoopsnake Designs uses a static-first one-page site with a small PHP form endpoint on Hostinger.

## Publishable artifact on `main`

This repository keeps a committed publish tree at `site/`, plus a repository-root `.htaccess` that maps public URLs to that tree after Hostinger deploys the branch.

```text
public_html/                     # Hostinger hosting destination (default)
  .htaccess                      # maps / -> site/, blocks source/admin paths
  site/
    index.html
    _astro/
    images/
    api/
      project-review.php
      config.example.php
      src/
      vendor/
    robots.txt
    sitemap.xml
    favicon.svg
  src/                           # blocked from HTTP by .htaccess
  api/                           # source only; blocked from HTTP
  package.json                   # blocked from HTTP
  ...
```

Public URLs after deploy:

| Public URL | Filesystem target |
|---|---|
| `/` | `site/index.html` |
| `/_astro/*` | `site/_astro/*` |
| `/images/*` | `site/images/*` |
| `/api/project-review.php` | `site/api/project-review.php` |

The PHP entrypoint resolves runtime files only relative to `site/api/`:

- autoload: `site/api/vendor/autoload.php`
- classes: `site/api/src/`
- config: `site/api/config.php` (runtime only) or `site/api/config.example.php`

## Hostinger Advanced → Git (accurate field mapping)

Jonathan's selected low-touch pattern is **GitHub branch auto-deploy without a Hostinger build step**.

Configure in hPanel → **Advanced → Git**:

| Field | Value |
|---|---|
| Repository | `JonathanEdwardLee/hoopsnake-designs-site` |
| Branch | `main` |
| Root directory (hosting destination) | `public_html` (Hostinger default) |

Important:

- Hostinger's Git **Root directory** is the hosting-account destination where repository files are copied. It is **not** a repository source subdirectory selector.
- The repository branch contents deploy into `public_html/` as-is.
- The committed root `.htaccess` uses a **default-deny public boundary**: only `/`, `/_astro/*`, `/images/*`, `/favicon.svg`, `/robots.txt`, `/sitemap.xml`, and `/api/project-review.php` are allowed. Direct requests to `/site/*`, `/public/*`, source/dev/config files, and all other repository paths return forbidden.
- Do **not** use Hostinger Node/Web App build-command settings for this site.

After merge to `main`, Hostinger pulls the branch into `public_html/`. Apache applies `.htaccess`, serves the funnel from `site/`, and executes PHP at `site/api/project-review.php`.

Runtime steps on Hostinger (not performed in this repo):

1. Copy `site/api/config.example.php` to `site/api/config.php`
2. Set `mail_mode=smtp` and inject SMTP/Turnstile secrets via server-only config
3. Recommended eventual inbox: `projects@hoopsnakedesigns.com` (do not create in this mission)

## Developer / CI workflow

Source authoring:

- Astro source: `src/`
- PHP source of truth: `api/src/` (copied into `site/api/src/` during build packaging)
- Static inputs: `public/`

Build:

```bash
npm ci
composer install
npm run build
```

CI verifies:

1. lint / typecheck / JS tests
2. `npm run build`
3. PHP tests + packaged autoload verification
4. repository-root deploy mapping simulation (`scripts/verify-deploy-mapping.sh`)
5. audit + secret-value hygiene check

## V1 protection boundary

Cross-request burst throttling is intentionally omitted in V1. Turnstile + honeypot + server validation provide the baseline protection layer.
