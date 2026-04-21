"""Whale Tracker configuration."""
import os

# Load env from elite_platform/.env.local
_env = {}
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env.local")
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                _env[k] = v

SUPABASE_URL = _env.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = _env.get("SUPABASE_SERVICE_ROLE_KEY", "")

HL_API_BASE = "https://api.hyperliquid.xyz/info"
HL_LEADERBOARD_URL = "https://stats-data.hyperliquid.xyz/Mainnet/leaderboard"

WALLET_COUNT = 20
MIN_NOTIONAL_USD = 25000  # Threshold for activity feed
RATE_LIMIT_DELAY = 0.4    # Seconds between wallet API calls
