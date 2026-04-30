#!/bin/bash
# PFA reminders sent via Telegram bot directly (independent of Claude session).
# Usage: pfa_reminder.sh <path/to/message.txt>
# Crontab schedules these against scripts/pfa-reminders/messages/*.txt
#
# Year guard: PFA setup is for 2026 only. Future-year cron fires silently exit.

set -euo pipefail

[ "$(date +%Y)" = "2026" ] || exit 0

TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="5684771081"

if [ -z "$TOKEN" ]; then
  echo "TELEGRAM_BOT_TOKEN not set" >&2
  exit 1
fi

MSG_FILE="${1:-}"
if [ -z "$MSG_FILE" ] || [ ! -f "$MSG_FILE" ]; then
  echo "usage: $0 <path/to/message.txt>" >&2
  exit 1
fi

MSG="$(cat "$MSG_FILE")"

curl -sS "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  --data-urlencode "text=${MSG}" \
  -d "disable_web_page_preview=true" \
  > /dev/null
