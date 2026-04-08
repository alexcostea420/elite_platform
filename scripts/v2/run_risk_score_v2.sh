#!/bin/bash
# Risk Score V2 - runs every 8 hours
cd /Users/server/elite_platform
python3 scripts/v2/risk_score_v2.py >> logs/risk_score_v2.log 2>&1
python3 scripts/v2/sync_v2.py >> logs/risk_score_v2.log 2>&1
