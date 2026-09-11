#!/usr/bin/env bash
set -euo pipefail

unset HSD_TURNSTILE_SITE_KEY
unset PUBLIC_TURNSTILE_SITE_KEY

if npm run build:production >/tmp/hsd-build-production.log 2>&1; then
  echo "build:production succeeded without HSD_TURNSTILE_SITE_KEY" >&2
  cat /tmp/hsd-build-production.log >&2
  exit 1
fi

if ! grep -Fq 'HSD_TURNSTILE_SITE_KEY is required' /tmp/hsd-build-production.log; then
  echo "build:production failed for an unexpected reason" >&2
  cat /tmp/hsd-build-production.log >&2
  exit 1
fi

echo "Production build correctly refuses missing HSD_TURNSTILE_SITE_KEY."
