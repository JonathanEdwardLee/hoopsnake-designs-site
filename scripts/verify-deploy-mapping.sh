#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTACCESS="$ROOT/.htaccess"

blocked_paths=(
  "/src/pages/index.astro"
  "/api/src/FormValidator.php"
  "/api/deploy/composer.json"
  "/package.json"
  "/composer.json"
  "/DEPLOYMENT.md"
  "/README.md"
  "/docs/evidence/desktop_1440_full_page.png"
  "/site/api/src/FormValidator.php"
  "/site/api/vendor/autoload.php"
  "/site/api/config.php"
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
  'src|node_modules|scripts|docs|vendor|\.github|tests' \
  'composer\.json|DEPLOYMENT\.md|README\.md|\.env|\.gitignore' \
  'api/\(' \
  'site/api/\('; do
  if ! grep -E "$pattern" "$HTACCESS" >/dev/null; then
    echo "Deploy mapper missing block rule for: $pattern" >&2
    exit 1
  fi
done

if ! grep -q 'site/index.html' "$HTACCESS"; then
  echo "Deploy mapper missing homepage mapping" >&2
  exit 1
fi

is_blocked() {
  local request_path="$1"
  case "$request_path" in
    /src/*|/node_modules/*|/scripts/*|/docs/*|/vendor/*|/.github/*|/tests/*) return 0 ;;
    /composer.json|/composer.lock|/package.json|/package-lock.json|/phpunit.xml|/DEPLOYMENT.md|/README.md|/.env|/.gitignore) return 0 ;;
    /api/src/*|/api/deploy/*|/api/tests/*|/api/config.example.php) return 0 ;;
    /site/api/src/*|/site/api/vendor/*|/site/api/config.php|/site/api/composer.json|/site/api/composer.lock) return 0 ;;
  esac
  return 1
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
