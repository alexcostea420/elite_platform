#!/usr/bin/env python3
"""
Arbitrum Payment Monitor — watches for USDT/USDC payments on Arbitrum One.

Scans Arbiscan for ERC-20 transfers to payment wallet.
Matches by unique reference amount → confirms in Supabase → activates subscription.

Runs every 30 seconds as daemon.
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
STATE_FILE = BASE_DIR / "data" / "arb_monitor_state.json"

# Arbitrum One token contracts
TOKENS = {
    "USDT": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    "USDC": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",  # native USDC
    "USDC.e": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",  # bridged
}

# Arbiscan API (free, 5 calls/sec)
ARBISCAN_API = "https://api.etherscan.io/v2/api"
ARBISCAN_CHAIN_ID = "42161"  # Arbitrum One
CHECK_INTERVAL = 30
AMOUNT_TOLERANCE = 0.50  # $0.50 tolerance (CEX fees + USDT/USDC stablecoin drift)


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k] = v
    # Also load trading bot env for Telegram
    tb_env = Path(os.path.expanduser("~/trading-bot/.env"))
    if tb_env.exists():
        for line in tb_env.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                env.setdefault(k, v)
    return env


def log(msg, level="INFO"):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def notify_telegram(msg, env):
    try:
        token = env.get("TELEGRAM_BOT_TOKEN", "")
        chat_id = env.get("TELEGRAM_CHAT_ID", "5684771081")
        if token:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            data = urllib.parse.urlencode({
                "chat_id": chat_id, "text": msg, "parse_mode": "HTML"
            }).encode()
            urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=10)
    except Exception as e:
        log(f"Telegram error: {e}", "WARN")


def get_token_transfers(wallet, token_contract, start_block=0, api_key=""):
    """Get ERC-20 token transfers TO wallet from Arbiscan."""
    transfers = []
    try:
        params = {
            "module": "account",
            "action": "tokentx",
            "contractaddress": token_contract,
            "address": wallet,
            "startblock": start_block,
            "endblock": 99999999,
            "sort": "desc",
            "page": 1,
            "offset": 50,
        }
        params["chainid"] = ARBISCAN_CHAIN_ID
        if api_key:
            params["apikey"] = api_key

        url = f"{ARBISCAN_API}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"accept": "application/json"})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())

        if data.get("status") != "1":
            return transfers

        for tx in data.get("result", []):
            if tx.get("to", "").lower() == wallet.lower():
                decimals = int(tx.get("tokenDecimal", 6))
                amount = float(tx.get("value", 0)) / (10 ** decimals)
                token_name = tx.get("tokenSymbol", "?")
                transfers.append({
                    "tx_hash": tx.get("hash", ""),
                    "from": tx.get("from", ""),
                    "amount": amount,
                    "token": token_name,
                    "block": int(tx.get("blockNumber", 0)),
                    "timestamp": int(tx.get("timeStamp", 0)),
                })
    except Exception as e:
        log(f"Arbiscan API error: {e}", "ERROR")

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


def confirm_payment(payment_id, tx_hash, amount_received, token, env):
    """Confirm payment in Supabase."""
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
            "currency": token,
            "chain": "arbitrum",
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
        log(f"Supabase confirm error: {e}", "ERROR")
        return False


def activate_subscription(payment, env):
    """Create subscription after payment confirmed."""
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
        log(f"Subscription error: {e}", "ERROR")
        return False


def upgrade_profile(payment, env):
    """Upgrade user profile to elite after payment confirmed."""
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        return False

    user_id = payment.get("user_id", "")
    if not user_id:
        return False

    duration_days = {"30_days": 30, "90_days": 90, "365_days": 365}.get(
        payment.get("plan_duration", ""), 30
    )
    now = datetime.now(timezone.utc)

    try:
        # Get current profile to check existing expiry
        url = f"{supabase_url}/rest/v1/profiles?id=eq.{user_id}&select=subscription_expires_at"
        req = urllib.request.Request(url, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        })
        resp = urllib.request.urlopen(req, timeout=10)
        profiles = json.loads(resp.read())
        current_expiry = now
        if profiles and profiles[0].get("subscription_expires_at"):
            ce = datetime.fromisoformat(profiles[0]["subscription_expires_at"].replace("Z", "+00:00"))
            if ce > now:
                current_expiry = ce

        new_expiry = current_expiry + timedelta(days=duration_days)

        url = f"{supabase_url}/rest/v1/profiles?id=eq.{user_id}"
        data = json.dumps({
            "subscription_tier": "elite",
            "subscription_status": "active",
            "subscription_expires_at": new_expiry.isoformat(),
        }).encode()
        req = urllib.request.Request(url, data=data, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }, method="PATCH")
        urllib.request.urlopen(req, timeout=10)
        log(f"Profile upgraded to elite for user {user_id[:8]}..., expires {new_expiry.isoformat()}")
        return True
    except Exception as e:
        log(f"Profile upgrade error: {e}", "ERROR")
        return False


ROLE_QUEUE = BASE_DIR / "data" / "role_queue.json"

def queue_discord_role(payment, env):
    """Add role assignment to queue for Discord bot to process."""
    try:
        queue = json.loads(ROLE_QUEUE.read_text()) if ROLE_QUEUE.exists() else []
    except Exception:
        queue = []
    queue.append({
        "action": "assign",
        "discord_username": payment.get("discord_username", ""),
        "discord_id": payment.get("discord_id", ""),
        "plan": payment.get("plan_duration", "Elite"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    ROLE_QUEUE.parent.mkdir(parents=True, exist_ok=True)
    ROLE_QUEUE.write_text(json.dumps(queue, indent=2))
    log(f"Queued Discord role for: {payment.get('discord_username', payment.get('user_id', '?')[:8])}")


def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"last_block": 0, "confirmed_tx_hashes": []}


def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


def main():
    env = load_env()
    wallet = env.get("PAYMENT_WALLET_ADDRESS", "")
    api_key = env.get("ARBISCAN_API_KEY", "")  # optional, higher rate limit

    if not wallet:
        log("PAYMENT_WALLET_ADDRESS not set", "ERROR")
        return

    log("=" * 50)
    log("ARBITRUM PAYMENT MONITOR STARTED")
    log(f"Wallet: {wallet[:8]}...{wallet[-4:]}")
    log(f"Tokens: USDT, USDC, USDC.e")
    log(f"Check interval: {CHECK_INTERVAL}s")
    log("=" * 50)

    notify_telegram("<b>Payment Monitor ONLINE</b>\nWatching Arbitrum for USDT/USDC payments.", env)

    state = load_state()

    while True:
        try:
            env = load_env()
            all_transfers = []

            # Scan all token contracts
            for token_name, contract in TOKENS.items():
                transfers = get_token_transfers(wallet, contract, state["last_block"], api_key)
                for t in transfers:
                    t["token"] = token_name
                all_transfers.extend(transfers)
                time.sleep(0.3)  # rate limit

            # Filter new transfers
            new_transfers = [
                t for t in all_transfers
                if t["tx_hash"] not in state["confirmed_tx_hashes"]
                and t["amount"] > 1  # ignore dust
            ]

            if new_transfers:
                log(f"Found {len(new_transfers)} new transfer(s)")
                pending = get_pending_payments(env)

                for transfer in new_transfers:
                    matched = False
                    for payment in pending:
                        ref_amount = float(payment.get("reference_amount", 0))
                        if abs(transfer["amount"] - ref_amount) <= AMOUNT_TOLERANCE:
                            log(f"MATCH: {transfer['token']} ${transfer['amount']:.2f} → payment {payment['id'][:8]}")

                            if confirm_payment(payment["id"], transfer["tx_hash"], transfer["amount"], transfer["token"], env):
                                activate_subscription(payment, env)
                                upgrade_profile(payment, env)
                                # Queue Discord role assignment
                                queue_discord_role(payment, env)
                                notify_telegram(
                                    f"💰 <b>PAYMENT CONFIRMED</b>\n"
                                    f"${transfer['amount']:.2f} {transfer['token']} (Arbitrum)\n"
                                    f"Plan: {payment.get('plan_duration', '?')}\n"
                                    f"TX: {transfer['tx_hash'][:16]}...",
                                    env
                                )
                            state["confirmed_tx_hashes"].append(transfer["tx_hash"])
                            matched = True
                            break

                    if not matched and transfer["amount"] > 5:
                        log(f"Unmatched: ${transfer['amount']:.2f} {transfer['token']} from {transfer['from'][:10]}...")
                        notify_telegram(
                            f"💸 <b>Unmatched transfer</b>\n"
                            f"${transfer['amount']:.2f} {transfer['token']}\n"
                            f"From: {transfer['from'][:12]}...\n"
                            f"Check manually",
                            env
                        )

            # Update last block
            if all_transfers:
                max_block = max(t["block"] for t in all_transfers)
                if max_block > state["last_block"]:
                    state["last_block"] = max_block

            # Keep confirmed list bounded
            state["confirmed_tx_hashes"] = state["confirmed_tx_hashes"][-500:]
            save_state(state)

        except KeyboardInterrupt:
            log("Monitor stopped")
            break
        except Exception as e:
            log(f"Error: {e}", "ERROR")

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
