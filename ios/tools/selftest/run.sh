#!/bin/bash
# Compiles the app's real Core networking code for macOS and runs tools/selftest/main.swift.
#   SWIPEPHOTOS_BASE_URL=http://localhost:3123 TEST_EMAIL=... TEST_CODE=... ./ios/tools/selftest/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=$(mktemp -d)
trap 'kill $MOCK 2>/dev/null || true; rm -rf "$OUT"' EXIT
python3 tools/selftest/mock_stream_server.py 18765 & MOCK=$!
swiftc -swift-version 5 -D DEBUG -o "$OUT/selftest" \
  SwipePhotos/Core/Config.swift SwipePhotos/Core/Models.swift SwipePhotos/Core/APIClient.swift \
  SwipePhotos/Core/Keychain.swift SwipePhotos/Core/Session.swift SwipePhotos/Core/OrderService.swift tools/selftest/main.swift 2>&1 | grep -v "^$" || true
sleep 0.5
# 1) streaming against the mock NDJSON server   2) live API against $SWIPEPHOTOS_BASE_URL
MODE=stream SWIPEPHOTOS_BASE_URL=http://127.0.0.1:18765 "$OUT/selftest"
if [ -n "${SWIPEPHOTOS_BASE_URL:-}" ]; then MODE=live "$OUT/selftest"; else echo "(set SWIPEPHOTOS_BASE_URL to also run the live API checks)"; fi
