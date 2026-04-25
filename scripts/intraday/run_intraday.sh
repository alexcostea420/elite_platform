#!/bin/bash
# Intraday Signal - runs every 5 minutes
cd /Users/server/elite_platform
python3 scripts/intraday/intraday_signal.py >> logs/intraday_signal.log 2>&1
python3 scripts/intraday/sync_intraday.py >> logs/intraday_signal.log 2>&1
