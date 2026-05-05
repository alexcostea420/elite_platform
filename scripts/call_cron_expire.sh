#!/bin/bash
# Posts to /api/cron/expire. Adds a timestamp + newline per call so the
# log file is human-readable instead of one concatenated blob.
ts=$(date "+%Y-%m-%d %H:%M:%S")
resp=$(curl -s -w "|HTTP_%{http_code}" -H "Authorization: Bearer 506086a4c7ae9795abfa1f838da1159a3def3321190254606167df9c26913452" \
  https://app.armatadetraderi.com/api/cron/expire)
echo "[$ts] ${resp:0:500}"
