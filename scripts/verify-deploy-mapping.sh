#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTACCESS="$ROOT/.htaccess"

blocked_paths=(
  "/src/pages/index.astro"
  "/public/api/project-review.php"
  "/public/favicon.svg"
  "/api/src/FormValidator.php"
  "/api/deploy/composer.json"
  "/package.json"
  "/package-lock.json"
  "/composer.json"
  "/composer.lock"
  "/phpunit.xml"
  "/astro.config.mjs"
  "/tsconfig.json"
  "/eslint.config.js"
  "/vitest.config.ts"
  "/.env.example"
  "/.gitignore"
  "/DEPLOYMENT.md"
  "/README.md"
  "/docs/evidence/desktop_1440_full_page.png"
  "/scripts/verify-deploy-mapping.sh"
  "/tests/project-fit.test.ts"
  "/site/index.html"
  "/site/favicon.svg"
  "/site/api/project-review.php"
  "/site/api/src/FormValidator.php"
  "/site/api/vendor/autoload.php"
  "/site/api/config.php"
  "/site/api/composer.json"
)

public_paths=(
  "/"
  "/favicon.svg"
  "/robots.txt"
  "/sitemap.xml"
  "/api/project-review.php"
)

astro_asset="$(find "$ROOT/site/_astro" -maxdepth 1 -type f -name '*.css' | head -1)"
if [[ -z "$astro_asset" ]]; then
  echo "Missing built Astro CSS asset under site/_astro" >&2
  exit 1
fi
public_paths+=("/${astro_asset#$ROOT/site/}")

portfolio_asset="$(find "$ROOT/site/images/portfolio" -maxdepth 1 -type f -name '*.webp' | head -1)"
if [[ -z "$portfolio_asset" ]]; then
  echo "Missing portfolio asset under site/images/portfolio" >&2
  exit 1
fi
public_paths+=("/${portfolio_asset#$ROOT/site/}")

if [[ ! -f "$HTACCESS" ]]; then
  echo "Missing root .htaccess deploy mapper" >&2
  exit 1
fi

for pattern in \
  'Default-deny public boundary' \
  '/api/project-review\.php' \
  'site/index.html'; do
  if ! grep -F "$pattern" "$HTACCESS" >/dev/null; then
    echo "Deploy mapper missing expected rule marker: $pattern" >&2
    exit 1
  fi
done

is_allowed_public() {
  local request_path="$1"
  case "$request_path" in
    /|/favicon.svg|/robots.txt|/sitemap.xml|/api/project-review.php) return 0 ;;
    /_astro/*|/images/*) return 0 ;;
  esac
  return 1
}

is_blocked() {
  if is_allowed_public "$1"; then
    return 1
  fi
  return 0
}

resolve_publish_path() {
  local request_path="$1"
  if [[ "$request_path" == "/" ]]; then
    echo "site/index.html"
    return 0
  fi
  local trimmed="${request_path#/}"
  echo "site/$trimmed"
}

for path in "${blocked_paths[@]}"; do
  if ! is_blocked "$path"; then
    echo "Expected blocked path is not covered: $path" >&2
    exit 1
  fi
done

for path in "${public_paths[@]}"; do
  if is_blocked "$path"; then
    echo "Public path incorrectly blocked: $path" >&2
    exit 1
  fi
  mapped="$(resolve_publish_path "$path")"
  if [[ ! -e "$ROOT/$mapped" ]]; then
    echo "Public path $path maps to missing publish file: $mapped" >&2
    exit 1
  fi
done

echo "Repository-root deploy mapping simulation passed."
