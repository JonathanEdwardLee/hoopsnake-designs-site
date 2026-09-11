#!/usr/bin/env bash
# Deterministic CI-safe test for publish-hostinger-deploy.sh.
# Uses a temporary bare remote; never touches the real hostinger-deploy branch.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLISH_SCRIPT="$ROOT/scripts/publish-hostinger-deploy.sh"
TEST_BRANCH="hostinger-deploy-ci-test"
TMP=""

cleanup() {
  if [[ -n "$TMP" && -d "$TMP" ]]; then
    rm -rf "$TMP"
  fi
}
trap cleanup EXIT

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command git
require_command rsync
require_command grep

if [[ ! -x "$PUBLISH_SCRIPT" ]]; then
  echo "Publisher script not executable: $PUBLISH_SCRIPT" >&2
  exit 1
fi

# Lease-safe updates only (no unconditional --force push).
if ! grep -q -- '--force-with-lease' "$PUBLISH_SCRIPT"; then
  echo "Publisher must use --force-with-lease." >&2
  exit 1
fi
if grep -Eq 'git push .*--force([^-]|$)' "$PUBLISH_SCRIPT"; then
  echo "Publisher must not use unconditional git push --force." >&2
  exit 1
fi

write_minimal_release() {
  local release_dir="$1"
  local marker="$2"
  rm -rf "$release_dir"
  mkdir -p "$release_dir/api" "$release_dir/assets"
  cat >"$release_dir/index.html" <<EOF
<!doctype html>
<html><body>release-$marker</body></html>
EOF
  cat >"$release_dir/api/.htaccess" <<'EOF'
<FilesMatch "\.php$">
  Require all denied
</FilesMatch>
EOF
  echo "asset-$marker" >"$release_dir/assets/app.css"
}

setup_source_repo() {
  local bare="$1"
  local src="$2"

  git init --bare "$bare"
  git clone "$bare" "$src"
  cd "$src"

  write_minimal_release "$src/release" "v1"

  mkdir -p "$src/scripts"
  cp "$ROOT/scripts/publish-hostinger-deploy.sh" "$src/scripts/publish-hostinger-deploy.sh"
  chmod +x "$src/scripts/publish-hostinger-deploy.sh"

  git add -A
  git -c user.name='ci-test' -c user.email='ci-test@example.com' commit -m "test: minimal release fixture"
  git branch -M main
  git push -u origin main
}

assert_artifact_tree() {
  local bare="$1"
  local branch="$2"
  local expected_marker="$3"

  git --git-dir="$bare" rev-parse --verify "refs/heads/$branch" >/dev/null

  local tree
  tree="$(git --git-dir="$bare" ls-tree -r --name-only "$branch")"

  echo "$tree" | grep -qx 'index.html'
  echo "$tree" | grep -qx 'api/.htaccess'
  echo "$tree" | grep -qx 'assets/app.css'

  if echo "$tree" | grep -Eq '^(src/|scripts/|package\.json$|composer\.json$|\.github/)'; then
    echo "Artifact branch must not contain source/dev/test files." >&2
    echo "$tree" >&2
    exit 1
  fi

  local html
  html="$(git --git-dir="$bare" show "$branch:index.html")"
  if ! grep -q "release-$expected_marker" <<<"$html"; then
    echo "Expected release marker $expected_marker in artifact index.html." >&2
    exit 1
  fi
}

run_publish() {
  local src="$1"
  cd "$src"
  export HOSTINGER_DEPLOY_BRANCH="$TEST_BRANCH"
  unset GIT_TOKEN
  bash "$src/scripts/publish-hostinger-deploy.sh"
}

TMP="$(mktemp -d)"
BARE="$TMP/remote.git"
SRC="$TMP/source"

setup_source_repo "$BARE" "$SRC"

# 1) First publication when remote artifact branch does not exist.
run_publish "$SRC"
assert_artifact_tree "$BARE" "$TEST_BRANCH" "v1"

FIRST_SHA="$(git --git-dir="$BARE" rev-parse "$TEST_BRANCH")"
FIRST_MSG="$(git --git-dir="$BARE" log -1 --format=%s "$TEST_BRANCH")"
SOURCE_SHA="$(git -C "$SRC" rev-parse HEAD)"
if [[ "$FIRST_MSG" != "deploy: $SOURCE_SHA" ]]; then
  echo "Expected deploy commit message deploy: $SOURCE_SHA, got: $FIRST_MSG" >&2
  exit 1
fi

# 2) Worktree validity is enforced inside the publisher after artifact sync.
if ! grep -q 'rev-parse --is-inside-work-tree' "$PUBLISH_SCRIPT"; then
  echo "Publisher must verify worktree validity after artifact sync." >&2
  exit 1
fi

# 3) Artifact tree contents validated above via assert_artifact_tree.

# 4) Second publication against an existing artifact branch.
write_minimal_release "$SRC/release" "v2"
cd "$SRC"
git add release
git -c user.name='ci-test' -c user.email='ci-test@example.com' commit -m "test: release v2"
SOURCE_SHA="$(git -C "$SRC" rev-parse HEAD)"
run_publish "$SRC"
assert_artifact_tree "$BARE" "$TEST_BRANCH" "v2"

SECOND_SHA="$(git --git-dir="$BARE" rev-parse "$TEST_BRANCH")"
SECOND_MSG="$(git --git-dir="$BARE" log -1 --format=%s "$TEST_BRANCH")"
if [[ "$SECOND_SHA" == "$FIRST_SHA" ]]; then
  echo "Second publication must create a new artifact commit." >&2
  exit 1
fi
if [[ "$SECOND_MSG" != "deploy: $SOURCE_SHA" ]]; then
  echo "Expected deploy commit message deploy: $SOURCE_SHA, got: $SECOND_MSG" >&2
  exit 1
fi

# 5) Lease-safe behavior: stale lease must reject rather than unconditional force.
WORKTREE="$SRC/.publish-worktree"
rm -rf "$WORKTREE"
git -C "$SRC" worktree add -B "$TEST_BRANCH" "$WORKTREE" "$TEST_BRANCH"
write_minimal_release "$SRC/release" "v3"
rsync -a --delete --checksum --exclude='.git' "$SRC/release/" "$WORKTREE/"
git -C "$WORKTREE" add -A
git -C "$WORKTREE" -c user.name='ci-test' -c user.email='ci-test@example.com' \
  commit -m "deploy: $(git -C "$SRC" rev-parse HEAD)"

ORPHAN="$TMP/orphan"
git clone "$BARE" "$ORPHAN"
cd "$ORPHAN"
git checkout "$TEST_BRANCH"
echo "orphan" >index.html
git add index.html
git -c user.name='ci-test' -c user.email='ci-test@example.com' commit -m "orphan: concurrent update"
git push origin "$TEST_BRANCH"

set +e
LEASE_OUTPUT="$(git -C "$WORKTREE" push --force-with-lease origin "$TEST_BRANCH" 2>&1)"
LEASE_STATUS=$?
set -e
if [[ "$LEASE_STATUS" -eq 0 ]]; then
  echo "Expected --force-with-lease push to fail when remote moved unexpectedly." >&2
  exit 1
fi
if ! grep -Eiq 'stale|fetch first|forced update|non-fast-forward|rejected' <<<"$LEASE_OUTPUT"; then
  echo "Expected lease-safe push rejection message, got: $LEASE_OUTPUT" >&2
  exit 1
fi

echo "publish-hostinger-deploy tests passed"
