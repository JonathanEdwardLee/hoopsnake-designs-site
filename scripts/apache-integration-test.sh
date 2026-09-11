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

start_container() {
  docker_cmd rm -f "$CONTAINER" >/dev/null 2>&1 || true

  local -a run_args=(
    run -d --name "$CONTAINER"
    -p 18080:80
    -v "$RELEASE:/var/www/html:ro"
  )

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --mount)
        run_args+=(-v "$2")
        shift 2
        ;;
      --apache-conf)
        run_args+=(-v "$2:/etc/apache2/conf-enabled/hsd-test-env.conf:ro")
        shift 2
        ;;
      *)
        echo "Unknown start_container argument: $1" >&2
        exit 1
        ;;
    esac
  done

  docker_cmd "${run_args[@]}" "$IMAGE" >/dev/null
}

wait_for_server() {
  for _ in $(seq 1 30); do
    if curl -fsS "$BASE_URL/" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "Apache container did not become ready" >&2
  exit 1
}

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

post_payload='{"name":"Test User","business_name":"Test Co","email":"test@example.com","project_type":"Website","problem":"Need a site","budget_band":"$3,500 – $7,500","timing":"1–3 months","must_have":"Form","decision_path":"Owner decides","ongoing_support":"Light updates"}'

docker_cmd build -t "$IMAGE" "$ROOT/docker/apache-test"

cleanup() {
  docker_cmd rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf "${PRIVATE_CONFIG_DIR:-}" "${TEST_CONFIG_DIR:-}" "${THROTTLE_DIR:-}" "${APACHE_ENV_DIR:-}"
}
trap cleanup EXIT

start_container
wait_for_server

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

status="$(request POST /api/project-review.php "$post_payload")"
assert_status "POST /api/project-review.php without private config" 503 "$status"
assert_body_contains "POST unavailable" '"code":"unavailable"'

status="$(request GET /api/src/FormValidator.php)"
assert_status "GET /api/src/FormValidator.php" 403 "$status"

status="$(request GET /api/vendor/autoload.php)"
assert_status "GET /api/vendor/autoload.php" 403 "$status"

for config_path in /api/config.php /api/config.example.php; do
  status="$(request GET "$config_path")"
  assert_status "GET $config_path" 403 "$status"
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

PRIVATE_CONFIG_DIR="$(mktemp -d)"
chmod a+rX "$PRIVATE_CONFIG_DIR"
cat > "$PRIVATE_CONFIG_DIR/project-review-config.php" <<'PHP'
<?php

declare(strict_types=1);

return [
    'mail_mode' => 'nosend',
];
PHP

start_container --mount "$PRIVATE_CONFIG_DIR:/var/www/hsd-private:ro"
wait_for_server

status="$(request POST /api/project-review.php "$post_payload")"
assert_status "POST with production-shaped nosend private config" 503 "$status"
assert_body_contains "production nosend unavailable" '"code":"unavailable"'
assert_body_not_contains "production nosend must not succeed" '"code":"received"'

TEST_CONFIG_DIR="$(mktemp -d)"
chmod -R a+rX "$TEST_CONFIG_DIR"
cat > "$TEST_CONFIG_DIR/project-review-test.php" <<'PHP'
<?php

declare(strict_types=1);

return [
    'mail_mode' => 'nosend',
];
PHP

APACHE_ENV_DIR="$(mktemp -d)"
cat > "$APACHE_ENV_DIR/hsd-test-env.conf" <<'CONF'
SetEnv HSD_TEST_CONFIG_PATH /var/www/hsd-test-config/project-review-test.php
CONF

start_container \
  --mount "$TEST_CONFIG_DIR:/var/www/hsd-test-config:ro" \
  --apache-conf "$APACHE_ENV_DIR/hsd-test-env.conf"
wait_for_server

status="$(request POST /api/project-review.php "$post_payload")"
assert_status "POST with test-mode nosend config" 200 "$status"
assert_body_contains "test-mode received" '"code":"received"'

THROTTLE_DIR="$(mktemp -d)"
chmod a+rwx "$THROTTLE_DIR"
cat > "$APACHE_ENV_DIR/hsd-test-env.conf" <<'CONF'
SetEnv HSD_TEST_CONFIG_PATH /var/www/hsd-test-config/project-review-test.php
SetEnv HSD_THROTTLE_PATH /var/www/hsd-private/project-review-throttle.json
CONF

start_container \
  --mount "$TEST_CONFIG_DIR:/var/www/hsd-test-config:ro" \
  --mount "$THROTTLE_DIR:/var/www/hsd-private" \
  --apache-conf "$APACHE_ENV_DIR/hsd-test-env.conf"
wait_for_server

status="$(request POST /api/project-review.php "$post_payload")"
assert_status "POST below global throttle cap" 200 "$status"
assert_body_contains "below throttle cap received" '"code":"received"'

if [[ ! -f "$THROTTLE_DIR/project-review-throttle.json" ]]; then
  echo "FAIL: throttle state file was not created outside document root" >&2
  exit 1
fi

if ! docker_cmd exec "$CONTAINER" php -r '
$payload = json_decode(file_get_contents("/var/www/hsd-private/project-review-throttle.json"), true);
if (!is_array($payload) || array_keys($payload) !== ["timestamps"] || !is_array($payload["timestamps"])) {
    exit(1);
}
'; then
  echo "FAIL: throttle state must contain timestamps only" >&2
  exit 1
fi
echo "PASS: throttle state contains timestamps only outside document root"

now="$(date +%s)"
docker_cmd exec "$CONTAINER" php -r "
file_put_contents(
    '/var/www/hsd-private/project-review-throttle.json',
    json_encode(['timestamps' => array_fill(0, 20, $now - 30)], JSON_THROW_ON_ERROR),
);
"

status="$(request POST /api/project-review.php "$post_payload")"
assert_status "POST at global throttle cap" 429 "$status"
assert_body_contains "throttle cap rate_limited" '"code":"rate_limited"'

echo "Apache + PHP integration test passed."
