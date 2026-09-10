# Hostinger deployment topology

Hoopsnake Designs uses a static-first one-page site with a small PHP form endpoint on Hostinger.

## Publishable artifact on `main`

This repository keeps a **directly deployable** publish tree at `site/`. It is generated locally/CI by `npm run build` and committed to `main` so Hostinger does not need to run Node/Astro.

```text
site/
  index.html
  _astro/
  images/
  api/
    project-review.php
    config.example.php
    composer.json
    src/                     # HSD runtime PHP classes
    vendor/                  # production Composer deps + autoload
  robots.txt
  sitemap.xml
  favicon.svg
```

The PHP entrypoint resolves runtime files only relative to `site/api/`:

- autoload: `site/api/vendor/autoload.php`
- classes: `site/api/src/` via deploy-local Composer autoload
- config: `site/api/config.php` (runtime only) or `site/api/config.example.php`

## Hostinger Advanced → Git expectation

Jonathan's selected low-touch pattern is **GitHub branch auto-deploy without a Hostinger build step**.

Recommended Hostinger configuration:

1. hPanel → **Advanced → Git**
2. Connect repository `JonathanEdwardLee/hoopsnake-designs-site`
3. Branch: `main`
4. Deploy/install directory: **`site`** (repository subdirectory becomes the website document root)
5. Do **not** rely on Node build-command/output-directory settings for this site

After merge to `main`, Hostinger pulls the committed `site/` tree and serves it as the public site. PHP executes `site/api/project-review.php` on Hostinger's PHP runtime.

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

CI order:

1. lint / typecheck / JS tests
2. `npm run build` (Astro static output + self-contained `site/api/` packaging)
3. PHP tests, including autoload boot tests against `site/api/vendor/autoload.php`
4. audit + secret-value hygiene check

## V1 protection boundary

Cross-request burst throttling is intentionally omitted in V1. Turnstile + honeypot + server validation provide the baseline protection layer.
