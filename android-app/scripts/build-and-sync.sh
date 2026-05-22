#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Building web app and syncing to Android ==="

# 1. Build the web app
echo "[1/2] Building web app..."
cd "$PROJECT_ROOT"
npm run build

# 2. Sync web assets into the Android project
echo "[2/2] Syncing to Android..."
npx cap sync android

echo ""
echo "=== Done! ==="
echo "Run 'bash android-app/scripts/open-android.sh' to open in Android Studio,"
echo "or 'npx cap run android' to deploy to a connected device."
