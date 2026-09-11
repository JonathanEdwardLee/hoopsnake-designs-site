#!/usr/bin/env bash
set -euo pipefail

if git grep -E 'BEGIN (RSA )?PRIVATE KEY' -- ':!*.example.*' ':!.github/workflows/ci.yml' ':!scripts/check-no-secrets.sh'; then
  echo "Private key material found in tracked files." >&2
  exit 1
fi

if git grep -E 'HSD_SMTP_PASS=[^[:space:][:punct:]]+' -- ':!*.example.*' ':!scripts/check-no-secrets.sh'; then
  echo "SMTP password value found in tracked files." >&2
  exit 1
fi

echo "No secret values detected in tracked source files."
