#!/bin/bash
cd /Users/server/elite_platform
# Source env vars
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.* ]] && continue
  [[ -z "$key" ]] && continue
  export "$key"="$value"
done < .env.local
export SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
export SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
/usr/bin/python3 scripts/discord_drip_sender.py
