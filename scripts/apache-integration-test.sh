#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$ROOT/release"
IMAGE="hsd-apache-integration:test"
CONTAINER="hsd-apache-integration"
BASE_URL="http://127.0.0.1:18080"

if [[ ! -f "$RELEASE/index.html" ]]; then
  echo "Missing release artifact. Run npm run build first." >&2
  exit 1
fi

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    sudo docker "$@"
  fi
}

docker_cmd build -t "$IMAGE" "$ROOT/docker/apache-test"

docker_cmd rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker_cmd run -d --name "$CONTAINER" \
  -p 18080:80 \
  -v "$RELEASE:/var/www/html:ro" \
  "$IMAGE" >/dev/null

cleanup() {
  docker_cmd rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -fsS "$BASE_URL/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local extra_args=()
  if [[ -n "$data" ]]; then
    extra_args+=(-H 'Content-Type: application/json' -d "$data")
  fi
  curl -sS -o /tmp/hsd-body.txt -w '%{http_code}' -X "$method" "${extra_args[@]}" "$BASE_URL$path"
}

assert_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL: $label expected HTTP $expected, got $actual" >&2
    cat /tmp/hsd-body.txt >&2 || true
    exit 1
  fi
  echo "PASS: $label -> $actual"
}

assert_body_contains() {
  local label="$1"
  local needle="$2"
  if ! grep -Fq "$needle" /tmp/hsd-body.txt; then
    echo "FAIL: $label missing expected body marker: $needle" >&2
    head -c 500 /tmp/hsd-body.txt >&2 || true
    exit 1
  fi
  echo "PASS: $label contains $needle"
}

assert_body_not_contains() {
  local label="$1"
  local needle="$2"
  if grep -Fq "$needle" /tmp/hsd-body.txt; then
    echo "FAIL: $label unexpectedly contained: $needle" >&2
    exit 1
  fi
  echo "PASS: $label does not expose $needle"
}

status="$(request GET /)"
assert_status "GET /" 200 "$status"
assert_body_contains "GET /" "Hoopsnake Launch System"

css_asset="$(find "$RELEASE/_astro" -maxdepth 1 -type f -name '*.css' | head -1)"
if [[ -z "$css_asset" ]]; then
  echo "Missing built CSS asset under release/_astro" >&2
  exit 1
fi
css_path="/${css_asset#$RELEASE/}"
status="$(request GET "$css_path")"
assert_status "GET $css_path" 200 "$status"

portfolio_asset="$(find "$RELEASE/images/portfolio" -maxdepth 1 -type f -name '*.webp' | head -1)"
if [[ -z "$portfolio_asset" ]]; then
  echo "Missing portfolio asset under release/images/portfolio" >&2
  exit 1
fi
portfolio_path="/${portfolio_asset#$RELEASE/}"
status="$(request GET "$portfolio_path")"
assert_status "GET $portfolio_path" 200 "$status"

status="$(request GET /robots.txt)"
assert_status "GET /robots.txt" 200 "$status"

status="$(request GET /sitemap.xml)"
assert_status "GET /sitemap.xml" 200 "$status"

status="$(request GET /api/project-review.php)"
assert_status "GET /api/project-review.php" 405 "$status"
assert_body_contains "GET /api/project-review.php" '"code":"method_not_allowed"'

post_payload='{"name":"Test User","business_name":"Test Co","email":"test@example.com","project_type":"Website","problem":"Need a site","budget_band":"$3,500 – $7,500","timing":"1–3 months","must_have":"Form","decision_path":"Owner decides","ongoing_support":"Light updates","turnstile_token":"test-token"}'
status="$(request POST /api/project-review.php "$post_payload")"
assert_status "POST /api/project-review.php without private config" 503 "$status"
assert_body_contains "POST unavailable" '"code":"unavailable"'

status="$(request GET /api/src/FormValidator.php)"
assert_status "GET /api/src/FormValidator.php" 403 "$status"

status="$(request GET /api/vendor/autoload.php)"
assert_status "GET /api/vendor/autoload.php" 403 "$status"

for denied_config in config.example.php config.php composer.json composer.lock; do
  if [[ -f "$RELEASE/api/$denied_config" ]]; then
    status="$(request GET "/api/$denied_config")"
    assert_status "GET /api/$denied_config" 403 "$status"
  fi
done

for absent_path in /site/index.html /src/pages/index.astro /package.json; do
  status="$(request GET "$absent_path")"
  if [[ "$status" == "200" ]]; then
    echo "FAIL: $absent_path should not be publicly served (got 200)" >&2
    exit 1
  fi
  echo "PASS: $absent_path not served (HTTP $status)"
done

status="$(request GET /api/project-review.php)"
assert_body_not_contains "PHP source not returned" '<?php'
assert_body_contains "JSON response from PHP" '"code":"method_not_allowed"'

echo "Apache + PHP integration test passed."
