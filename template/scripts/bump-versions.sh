#!/usr/bin/env bash
# Update all dependencies to latest, verify the template still builds.
# Run from template/ root. Commit the result on a branch and PR it.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Updating dependencies"
npx --yes npm-check-updates -u

echo "→ Installing"
npm install

echo "→ Typechecking"
npx tsc --noEmit

echo "→ Linting"
npm run lint

echo "→ Running unit tests"
npm test

echo "→ Building"
npm run build

echo "✓ All green. Update docs/VERSIONS.md with today's date and commit."
