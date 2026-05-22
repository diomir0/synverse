#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Synverse Android — First-time setup ==="
echo ""

# 1. Install web app dependencies
echo "[1/5] Installing web app dependencies..."
cd "$PROJECT_ROOT"
npm install

# 2. Install Capacitor dependencies (idempotent — skips if already present)
echo "[2/5] Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli \
  @capacitor/android \
  @capacitor/preferences \
  @capacitor/network \
  @capacitor/haptics \
  @capacitor/status-bar

# 3. Build the web app
echo "[3/5] Building web app..."
npm run build

# 4. Add the Android platform (idempotent — skips if already present)
echo "[4/5] Adding Android platform..."
cd "$PROJECT_ROOT"
if [ ! -d "android" ]; then
  npx cap add android
else
  echo "  Android platform already exists — skipping."
fi

# 5. Sync web assets into the Android project
echo "[5/5] Syncing web assets..."
npx cap sync android

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Open the project in Android Studio:"
echo "     bash android-app/scripts/open-android.sh"
echo ""
echo "  2. Verify these AndroidManifest.xml settings:"
echo "     - android:usesCleartextTraffic=\"true\""
echo "     - android:networkSecurityConfig=\"@xml/network_security_config\""
echo "     - <uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\" />"
echo ""
echo "  3. Run on a connected device or emulator:"
echo "     npx cap run android"
