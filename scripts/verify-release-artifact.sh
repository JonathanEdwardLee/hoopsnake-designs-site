#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$ROOT/release"

forbidden=(
  "site"
  "src"
  "node_modules"
  "package.json"
  "package-lock.json"
  "composer.json"
  "composer.lock"
  "phpunit.xml"
  "astro.config.mjs"
  "tsconfig.json"
  "eslint.config.js"
  "vitest.config.ts"
  ".git"
)

required=(
  "index.html"
  ".htaccess"
  "favicon.svg"
  "images/brand/hoopsnake-icon-32-v004.png"
  "images/brand/hoopsnake-icon-192-v004.png"
  "images/brand/hoopsnake-apple-touch-180-v004.png"
  "robots.txt"
  "sitemap.xml"
  "api/project-review.php"
  "api/vendor/autoload.php"
  "api/src/FormValidator.php"
)

for path in "${required[@]}"; do
  if [[ ! -e "$RELEASE/$path" ]]; then
    echo "Missing required release artifact path: $path" >&2
    exit 1
  fi
done

for path in "${forbidden[@]}"; do
  if [[ -e "$RELEASE/$path" ]]; then
    echo "Forbidden path present in release artifact: $path" >&2
    exit 1
  fi
done

for forbidden_api_file in config.example.php config.php composer.json composer.lock; do
  if [[ -e "$RELEASE/api/$forbidden_api_file" ]]; then
    echo "Forbidden API file present in release artifact: api/$forbidden_api_file" >&2
    exit 1
  fi
done

echo "Release artifact layout verification passed."
