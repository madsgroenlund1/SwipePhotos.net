#!/bin/bash
# Type-checks the iOS sources against the iOS API surface (via the Mac Catalyst
# target) when full Xcode isn't available. Not a replacement for a real build,
# but catches nearly all compile errors.
set -euo pipefail
cd "$(dirname "$0")/.."
SDK=$(xcrun --sdk macosx --show-sdk-path)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# Rewrite @State -> @StateShim (line numbers are preserved).
find SwipePhotos -name '*.swift' | while read -r f; do
  mkdir -p "$TMP/$(dirname "$f")"
  sed -E 's/@State([^A-Za-z]|$)/@StateShim\1/g' "$f" > "$TMP/$f"
done
cp tools/TypecheckShims.swift "$TMP/TypecheckShims.swift"
cd "$TMP"
FILES=$(find SwipePhotos -name '*.swift' | sort)
swiftc -typecheck -swift-version 5 \
  -sdk "$SDK" -target arm64-apple-ios17.0-macabi \
  -F "$SDK/System/iOSSupport/System/Library/Frameworks" \
  TypecheckShims.swift $FILES
echo "✓ type-check passed ($(echo "$FILES" | wc -l | tr -d ' ') files)"
