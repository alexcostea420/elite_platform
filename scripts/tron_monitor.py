#!/usr/bin/env python3
"""
TRON Blockchain Monitor — watches for incoming USDT (TRC-20) payments.

Scans the TRON network for transfers to the payment wallet.
Matches incoming amounts to pending payments in Supabase.
Confirms matched payments and activates subscriptions.

Runs every 60 seconds as a daemon.

Setup:
  1. Set PAYMENT_WALLET_ADDRESS_TRC20 in .env.local
  2. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
  3. Run: python scripts/tron_monitor.py

Launchd: com.trading.tron-monitor
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env.local"
STATE_FILE = BASE_DIR / "data" / "tron_monitor_state.json"

# TRON API (TronGrid)
TRON_API = "https://api.trongrid.io"
USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"  # USDT TRC-20

CHECK_INTERVAL = 60  # seconds
AMOUNT_TOLERANCE = 0.02  # $0.02 tolerance for matching


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k] = v
    return env


def log(msg, level="INFO"):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def notify_telegram(msg, env):
    """Send Telegram notification for payment events."""
    # Use trading bot's token
    try:
        token = env.get("TELEGRAM_BOT_TOKEN", "")
        if not token:
            # Try trading bot .env
            tb_env = Path(os.path.expanduser("~/trading-bot/.env"))
            if tb_env.exists():
                for line in tb_env.read_text().splitlines():
                    if line.startswith("TELEGRAM_BOT_TOKEN="):
                        token = line.split("=", 1)[1]
        chat_id = "5684771081"
        if token:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            data = urllib.parse.urlencode({
                "chat_id": chat_id, "text": msg, "parse_mode": "HTML"
            }).encode()
            urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=10)
    except Exception as e:
        log(f"Telegram error: {e}", "WARN")


def get_trc20_transfers(wallet, min_timestamp=0):
    """Get recent TRC-20 USDT transfers to wallet from TronGrid API."""
    transfers = []
    try:
        url = (f"{TRON_API}/v1/accounts/{wallet}/transactions/trc20"
               f"?only_to=true&limit=50&contract_address={USDT_CONTRACT}"
               f"&min_timestamp={min_timestamp}")
        req = urllib.request.Request(url, headers={"accept": "application/json"})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())

        for tx in data.get("data", []):
            if tx.get("to", "").lower() == wallet.lower():
                amount = float(tx.get("value", 0)) / 1e6  # USDT has 6 decimals
                transfers.append({
                    "tx_hash": tx.get("transaction_id", ""),
                    "from": tx.get("from", ""),
                    "amount": amount,
                    "timestamp": tx.get("block_timestamp", 0),
                })
    except Exception as e:
        log(f"TronGrid API error: {e}", "ERROR")

    return transfers


def get_pending_payments(env):
    """Get pending payments from Supabase."""
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        return []

    try:
        url = f"{supabase_url}/rest/v1/payments?status=eq.pending&select=*"
        req = urllib.request.Request(url, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
        })
        resp = urllib.request.urlopen(req, timeout=10)
        return json.loads(resp.read())
    except Exception as e:
        log(f"Supabase fetch error: {e}", "ERROR")
        return []


def confirm_payment(payment_id, tx_hash, amount_received, env):
    """Confirm a payment in Supabase."""
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        return False

    try:
        url = f"{supabase_url}/rest/v1/payments?id=eq.{payment_id}"
        data = json.dumps({
            "status": "confirmed",
            "tx_hash": tx_hash,
            "amount_received": amount_received,
            "confirmed_at": datetime.now(timezone.utc).isoformat(),
        }).encode()
        req = urllib.request.Request(url, data=data, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }, method="PATCH")
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        log(f"Supabase update error: {e}", "ERROR")
        return False


def activate_subscription(payment, env):
    """Create/update subscription after payment confirmed."""
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        return False

    duration_days = {"30_days": 30, "90_days": 90, "365_days": 365}.get(
        payment.get("plan_duration", ""), 30
    )
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=duration_days)

    try:
        url = f"{supabase_url}/rest/v1/subscriptions"
        data = json.dumps({
            "user_id": payment["user_id"],
            "payment_id": payment["id"],
            "tier": "elite",
            "starts_at": now.isoformat(),
            "expires_at": expires.isoformat(),
            "status": "active",
        }).encode()
        req = urllib.request.Request(url, data=data, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        })
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        log(f"Subscription creation error: {e}", "ERROR")
        return False


def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"last_check_ts": 0, "confirmed_tx_hashes": []}


def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


def main():
    env = load_env()
    wallet = env.get("PAYMENT_WALLET_ADDRESS_TRC20", "")

    if not wallet:
        log("PAYMENT_WALLET_ADDRESS_TRC20 not set in .env.local — waiting for config", "WARN")
        log("Set it and restart the service")
        # Still run but just check periodically
        while True:
            env = load_env()
            wallet = env.get("PAYMENT_WALLET_ADDRESS_TRC20", "")
            if wallet:
                log(f"Wallet configured: {wallet[:8]}...{wallet[-4:]}")
                break
            time.sleep(300)

    log("=" * 50)
    log("TRON PAYMENT MONITOR STARTED")
    log(f"Wallet: {wallet[:8]}...{wallet[-4:]}")
    log(f"Check interval: {CHECK_INTERVAL}s")
    log(f"Amount tolerance: ${AMOUNT_TOLERANCE}")
    log("=" * 50)

    state = load_state()

    while True:
        try:
            env = load_env()
            now_ms = int(time.time() * 1000)

            # Look back max 24h
            min_ts = max(state["last_check_ts"], now_ms - 86400000)

            # Get new transfers
            transfers = get_trc20_transfers(wallet, min_ts)
            new_transfers = [
                t for t in transfers
                if t["tx_hash"] not in state["confirmed_tx_hashes"]
            ]

            if new_transfers:
                log(f"Found {len(new_transfers)} new transfer(s)")

                # Get pending payments
                pending = get_pending_payments(env)

                for transfer in new_transfers:
                    matched = False
                    for payment in pending:
                        ref_amount = float(payment.get("reference_amount", 0))
                        if abs(transfer["amount"] - ref_amount) <= AMOUNT_TOLERANCE:
                            # MATCH!
                            log(f"MATCH: tx={transfer['tx_hash'][:16]}... amount=${transfer['amount']:.2f} → payment {payment['id'][:8]}...")

                            if confirm_payment(payment["id"], transfer["tx_hash"], transfer["amount"], env):
                                activate_subscription(payment, env)
                                notify_telegram(
                                    f"<b>PAYMENT CONFIRMED</b>\n"
                                    f"Amount: ${transfer['amount']:.2f} USDT\n"
                                    f"Plan: {payment.get('plan_duration', '?')}\n"
                                    f"User: {payment.get('user_id', '?')[:8]}...\n"
                                    f"TX: {transfer['tx_hash'][:16]}...",
                                    env
                                )
                                state["confirmed_tx_hashes"].append(transfer["tx_hash"])
                                matched = True
                                break

                    if not matched:
                        log(f"Unmatched transfer: ${transfer['amount']:.2f} from {transfer['from'][:8]}...")

            state["last_check_ts"] = now_ms
            save_state(state)

        except KeyboardInterrupt:
            log("Monitor stopped")
            break
        except Exception as e:
            log(f"Error: {e}", "ERROR")

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
