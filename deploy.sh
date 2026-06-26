#!/usr/bin/env bash
# VisualBook AI — one-command deploy to GitHub Pages.
# Usage:  npm run deploy   (or)   ./deploy.sh
set -euo pipefail

REPO="https://github.com/kwelchvisualsLLC/visualbook-ai.git"
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "▶ 1/4  Building production bundle…"
npm run build

echo "▶ 2/4  Preparing dist/ for GitHub Pages…"
cd dist
touch .nojekyll                      # stop Pages from running Jekyll on the assets
if [ ! -d .git ]; then               # first run: make dist its own gh-pages repo
  git init -q
  git checkout -q -b gh-pages
fi

echo "▶ 3/4  Committing the build…"
git add -A
if git diff --cached --quiet; then
  echo "   Nothing changed since last deploy — skipping push."
  exit 0
fi
git -c user.email="kwelchvisuals@gmail.com" -c user.name="KWelchVisuals" \
    commit -q -m "Deploy: $(date '+%Y-%m-%d %H:%M')"

echo "▶ 4/4  Pushing to gh-pages…"
GIT_TERMINAL_PROMPT=0 git push -q "$REPO" gh-pages:gh-pages --force

echo ""
echo "✅ Deployed → https://kwelchvisualsllc.github.io/visualbook-ai/"
echo "   (GitHub Pages takes ~30–60s to refresh; hard-reload if you don't see it.)"
