#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$ROOT/release"
BRANCH="hostinger-deploy"
SOURCE_SHA="$(git -C "$ROOT" rev-parse HEAD)"

if [[ ! -f "$RELEASE/index.html" ]]; then
  echo "Missing release artifact at release/. Build before publishing." >&2
  exit 1
fi

WORKTREE="$(mktemp -d)"
trap 'rm -rf "$WORKTREE"' EXIT

git -C "$ROOT" fetch origin "$BRANCH" 2>/dev/null || true

if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git -C "$ROOT" worktree add --force "$WORKTREE" "$BRANCH"
elif git -C "$ROOT" show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  git -C "$ROOT" worktree add --force -B "$BRANCH" "$WORKTREE" "origin/$BRANCH"
else
  git -C "$ROOT" worktree add --force -B "$BRANCH" "$WORKTREE"
fi

find "$WORKTREE" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
rsync -a --delete "$RELEASE/" "$WORKTREE/"

git -C "$WORKTREE" add -A
if git -C "$WORKTREE" diff --cached --quiet; then
  echo "hostinger-deploy already matches release artifact for $SOURCE_SHA"
  exit 0
fi

git -C "$WORKTREE" commit -m "deploy: $SOURCE_SHA"
git -C "$WORKTREE" push origin "$BRANCH" --force-with-lease

echo "Published hostinger-deploy at deploy: $SOURCE_SHA"
