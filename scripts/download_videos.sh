#!/bin/bash
# Download all YouTube videos for R2 migration
# Uses 720p to save storage while maintaining good quality

OUTPUT_DIR="/Users/server/elite_platform/data/videos"
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# All video IDs from database
VIDEOS=(
  "0yfbo0Zk0ms" "pnA8YScNbMQ" "Gpz_TpMLu2I" "LkcxGG3-u64" "HA0gEb_E0-k"
  "7HGINiJHrt8" "GhHK8l5EkkA" "WhGsApPkhiI" "BnhpKB0F2e4" "Yg2iQ3Rqn0w"
  "BPDSg6DcKSo" "j1-HsMaZOlc" "0711iBp0Xzc" "Uz-Hpu4UEk8" "OUHJi2JPdng"
  "xnXauHrA3JQ" "toS2UzxqmEs" "9i6jWMqBWFc" "lavTV2PR298" "MXuQmpHfmfY"
  "8FCGGtdglrc" "9XER-vUeEvo" "AZFBsC7RWcc" "dvXSqPGnpnE" "m7KVprO5pX0"
  "FGmKyeX9ST0" "jKFh2FvMlLY" "yKzwV_-kmjo" "pa7FR68zxH0" "N4wVzt3BRoA"
  "tLRXvcq7nDQ" "pE6V0zwvX48" "3qEWI2f7iEg" "g2TwAOFOrGE" "Zn30TDSdKQs"
  "YcagNr78Pis" "kE0_Bq_Om-Q" "UDSDO9FLjME" "VjYhx9D8Q1s" "Hb-s8WkI3dQ"
  "RAt6LapX-Z4" "1Lc8lTFfZfM" "EVLL9R0jRlI" "EVC0-b8zqPU" "BpMT6MkByeE"
  "ovck9n_yBmw" "CB6CSpei2uA" "nYZyiFBslmg" "6qHTzSwTX-8" "3hHzSLyQhO4"
  "6NWQh4OUkCA" "nIQ5EPb8Y1M" "rt_pb7feO50" "q_53ruQKXsc" "7KNdTc3WSR8"
  "4our1Sasjxc" "MIR0M95H3u4" "cX2_1D35bR8"
)

TOTAL=${#VIDEOS[@]}
COUNT=0
FAILED=0

echo "Starting download of $TOTAL videos..."
echo "Output: $OUTPUT_DIR"
echo "---"

for VID in "${VIDEOS[@]}"; do
  COUNT=$((COUNT + 1))

  # Skip if already downloaded
  if [ -f "$VID.mp4" ]; then
    echo "[$COUNT/$TOTAL] SKIP $VID (already exists)"
    continue
  fi

  echo "[$COUNT/$TOTAL] Downloading $VID..."
  python3 -m yt_dlp \
    -f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]" \
    --merge-output-format mp4 \
    --no-playlist \
    --postprocessor-args "ffmpeg:-movflags +faststart" \
    -o "${VID}.mp4" \
    "https://www.youtube.com/watch?v=${VID}" 2>&1 | tail -3

  if [ $? -ne 0 ]; then
    echo "  FAILED: $VID"
    FAILED=$((FAILED + 1))
  else
    SIZE=$(du -h "${VID}.mp4" 2>/dev/null | cut -f1)
    echo "  OK: $VID ($SIZE)"
  fi

  # Small delay to avoid rate limiting
  sleep 2
done

echo "---"
echo "Done! Downloaded: $((COUNT - FAILED))/$TOTAL, Failed: $FAILED"
echo "Total size:"
du -sh "$OUTPUT_DIR"
