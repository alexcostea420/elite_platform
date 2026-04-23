#!/usr/bin/env bash
# Rotate logs across all elite_platform log directories.
# Keeps one .old backup of each file, then truncates the original.
# Triggered by cron daily; rotates files > 500KB.
#
# Safe to run while tailing processes write — truncate-in-place keeps
# their file descriptors valid (they continue writing at offset 0).

set -u

THRESHOLD_BYTES=512000  # 500KB

LOG_DIRS=(
  "/Users/server/elite_platform/logs"
  "/Users/server/elite_platform/scripts/whale_tracker/logs"
  "/Users/server/elite_platform/scripts/youtube-countertrade/logs"
)

rotated=0
skipped=0

for dir in "${LOG_DIRS[@]}"; do
  [ -d "$dir" ] || continue
  while IFS= read -r -d '' f; do
    size=$(stat -f%z "$f" 2>/dev/null || echo 0)
    if [ "$size" -gt "$THRESHOLD_BYTES" ]; then
      cp "$f" "$f.old" 2>/dev/null || true
      : > "$f"
      rotated=$((rotated + 1))
    else
      skipped=$((skipped + 1))
    fi
  done < <(find "$dir" \( -name '*.log' -o -name '*.err' \) -type f -print0)
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')] rotate_logs: rotated=$rotated skipped=$skipped"
