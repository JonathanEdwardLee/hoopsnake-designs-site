#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATTERN='(cloudflare|turnstile|HSD_TURNSTILE_SITE_KEY|PUBLIC_TURNSTILE_SITE_KEY|siteverify)'
SCAN_PATHS=(src public api deploy release scripts)

for scan_path in "${SCAN_PATHS[@]}"; do
  target="$ROOT/$scan_path"
  if [[ ! -e "$target" ]]; then
    continue
  fi

  if grep -E -R -i "$PATTERN" "$target" --exclude=verify-no-cloudflare.sh; then
    echo "Forbidden external verification reference found under $scan_path." >&2
    exit 1
  fi
done

echo "No external verification-widget references found in implementation source or release artifact."
