#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$ROOT/release"
BRANCH="${HOSTINGER_DEPLOY_BRANCH:-hostinger-deploy}"
SOURCE_SHA="$(git -C "$ROOT" rev-parse HEAD)"

if [[ ! -f "$RELEASE/index.html" ]]; then
  echo "Missing release artifact at release/. Build before publishing." >&2
  exit 1
fi

WORKTREE="$(mktemp -d)"
cleanup_worktree() {
  if [[ -n "${WORKTREE:-}" && -d "$WORKTREE" ]]; then
    git -C "$ROOT" worktree remove --force "$WORKTREE" 2>/dev/null || rm -rf "$WORKTREE"
  fi
}
trap cleanup_worktree EXIT

git -C "$ROOT" fetch origin "$BRANCH" 2>/dev/null || true

if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git -C "$ROOT" worktree add --force "$WORKTREE" "$BRANCH"
elif git -C "$ROOT" show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  git -C "$ROOT" worktree add --force -B "$BRANCH" "$WORKTREE" "origin/$BRANCH"
else
  git -C "$ROOT" worktree add --force -B "$BRANCH" "$WORKTREE"
fi

# Sync release artifact into the worktree without removing the linked worktree's
# .git control file (release/ has no .git, so rsync --delete alone would break git).
rsync -a --delete --checksum --exclude='.git' "$RELEASE/" "$WORKTREE/"

if ! git -C "$WORKTREE" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Worktree is not a valid git repository after artifact sync." >&2
  exit 1
fi

git -C "$WORKTREE" add -A
if git -C "$WORKTREE" diff --cached --quiet; then
  echo "hostinger-deploy already matches release artifact for $SOURCE_SHA"
  exit 0
fi

git -C "$WORKTREE" \
  -c user.name="${GIT_AUTHOR_NAME:-github-actions[bot]}" \
  -c user.email="${GIT_AUTHOR_EMAIL:-41898282+github-actions[bot]@users.noreply.github.com}" \
  commit -m "deploy: $SOURCE_SHA"
git -C "$WORKTREE" push origin "$BRANCH" --force-with-lease

echo "Published hostinger-deploy at deploy: $SOURCE_SHA"
