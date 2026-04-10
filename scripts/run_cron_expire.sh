#!/bin/bash
# Local cron: trigger subscription expiry check every hour
cd /Users/server/elite_platform
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d= -f2)
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://app.armatadetraderi.com/api/cron/expire" >> /Users/server/elite_platform/logs/cron-expire.log 2>&1
echo " $(date)" >> /Users/server/elite_platform/logs/cron-expire.log
