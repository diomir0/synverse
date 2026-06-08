#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Building web app, syncing, and assembling APK ==="

# 1. Build the web app
echo "[1/3] Building web app..."
cd "$PROJECT_ROOT"
npm run build

# 2. Sync web assets into the Android project
echo "[2/3] Syncing to Android..."
npx cap sync android

# 3. Compile the debug APK via Gradle
echo "[3/3] Assembling debug APK..."
cd "$PROJECT_ROOT/android"
./gradlew assembleDebug

APK="$PROJECT_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "=== Done! ==="
echo "APK: $APK"
echo "Install with:  adb install -r \"$APK\""
echo "Or open in Android Studio with:  bash android-app/scripts/open-android.sh"
