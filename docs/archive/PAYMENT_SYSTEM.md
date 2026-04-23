# PAYMENT SYSTEM - Crypto Payments for Elite Platform

**Date:** 2026-03-18
**Architecture:** Option D + A Hybrid (Static wallet + unique reference amounts)
**Chain:** TRON (TRC-20 USDT)
**Status:** Implemented and build-verified

---

## Architecture Decision

**Chosen approach:** Static wallet address + unique reference amounts.

- One USDT wallet address (TRC-20/Tron)
- Each payment gets a unique total (base price + unique cents derived from payment ID)
- Blockchain monitoring matches incoming transfers by amount (within tolerance)
- No smart contracts, no unique addresses per user, no Stripe

**Why this approach:**
- Simplest to implement and maintain for a solo operator
- TRON has ~$0.50 fees, fastest USDT chain
- Crypto trader audience already has USDT on Tron
- Unique amounts solve the payment matching problem without memos

---

## Database Schema

### `payments` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK → profiles) | Who is paying |
| plan_duration | TEXT | 30_days, 90_days, 365_days |
| amount_expected | DECIMAL | Base price (49, 137, 497) |
| amount_received | DECIMAL | Actual amount received (nullable) |
| currency | TEXT | USDT |
| chain | TEXT | TRC-20 |
| wallet_address | TEXT | Destination wallet |
| tx_hash | TEXT | Blockchain transaction hash (nullable) |
| reference_amount | DECIMAL | Unique amount for matching (base + cents) |
| status | TEXT | pending → confirmed/expired/failed |
| created_at | TIMESTAMPTZ | When created |
| confirmed_at | TIMESTAMPTZ | When confirmed (nullable) |
| expires_at | TIMESTAMPTZ | Subscription expiry (nullable) |

### `subscriptions` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK → profiles) | Subscriber |
| payment_id | UUID (FK → payments) | Linked payment |
| tier | TEXT | Always "elite" |
| starts_at | TIMESTAMPTZ | Activation date |
| expires_at | TIMESTAMPTZ | Expiry date |
| status | TEXT | active → expired/cancelled |

RLS enabled on both tables. Users can read their own records only.

---

## API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/payments/create` | User session | Create payment request, get wallet + amount |
| GET | `/api/payments/status?id=X` | User session | Check payment status (polled by UI) |
| POST | `/api/payments/confirm` | Webhook secret | Confirm payment (internal/blockchain monitor) |
| GET | `/api/subscription/status` | User session | Get current subscription info |
| GET | `/api/admin/payments` | Admin role | List all payments + metrics |
| GET | `/api/cron/expire` | Cron secret | Expire old payments + subscriptions |

---

## Payment Flow

### User-Facing Flow
1. User visits `/upgrade` → sees plan options with prices
2. User clicks a plan → `POST /api/payments/create` with `plan_duration`
3. API returns: wallet address, unique amount (e.g. $49.37 USDT), chain info
4. User sees payment details with copy buttons for address and amount
5. UI polls `GET /api/payments/status?id=X` every 15 seconds
6. When confirmed → UI shows success, redirects to dashboard

### Backend Flow
1. Payment created with `status: pending`, unique `reference_amount`
2. Blockchain monitor detects USDT transfer to wallet matching amount
3. Monitor calls `POST /api/payments/confirm` with payment_id, tx_hash, amount
4. System: updates payment → creates subscription → updates profile to "elite"
5. Hourly cron (`GET /api/cron/expire`):
   - Marks pending payments older than 30 min as "expired"
   - Marks active subscriptions past expiry as "expired"
   - Downgrades user profiles from "elite" to "free"

---

## Security

- `POST /api/payments/confirm` secured by `PAYMENT_WEBHOOK_SECRET` header
- `GET /api/cron/expire` secured by `CRON_SECRET` bearer token
- Wallet private key is NOT stored in the application
- `PAYMENT_WALLET_ADDRESS` is the public receive address only
- All payment operations use service role client (bypasses RLS)
- User-facing APIs validate session via `supabase.auth.getUser()`
- Admin API verifies `profile.role === "admin"`

---

## Blockchain Monitoring (External)

The platform does NOT include a built-in blockchain poller. You need an external service to:

1. Monitor your TRON wallet for incoming USDT transfers
2. When a transfer arrives, match the amount against pending payments (±$0.02 tolerance)
3. Call `POST /api/payments/confirm` with the matched payment_id, tx_hash, and amount

**Options for monitoring:**
- **TronGrid API** (free): Poll `https://api.trongrid.io/v1/accounts/{address}/transactions/trc20` every 30-60 seconds
- **TronScan API**: Similar polling approach
- **Custom script**: Node.js/Python script running as a cron job or daemon
- **Telegram Bot**: Bot monitors wallet and calls the confirm endpoint

**Sample monitoring pseudocode:**
```
Every 60 seconds:
  1. Fetch recent TRC-20 transfers to PAYMENT_WALLET_ADDRESS
  2. For each new transfer:
     a. Check if amount matches any pending payment's reference_amount (±$0.02)
     b. If match: POST /api/payments/confirm { payment_id, tx_hash, amount_received }
  3. Track last processed transaction to avoid duplicates
```

---

## Admin Dashboard

`/admin/payments` provides:
- Active subscribers count
- Total revenue (sum of confirmed payments)
- Expiring soon count (within 7 days)
- Total payments count
- Filterable payment list (by status)
- Pagination

---

## Environment Variables (New)

```env
PAYMENT_WALLET_ADDRESS=TYour_Tron_USDT_Wallet_Address
PAYMENT_WEBHOOK_SECRET=a_random_secure_string_for_webhook_auth
CRON_SECRET=a_random_secure_string_for_cron_auth
```

---

## Pricing Plans

| Plan | Price | Duration | Unique Amount Example |
|------|-------|----------|----------------------|
| 30 Zile | $49 | 30 days | $49.37 USDT |
| 3 Luni | $137 | 90 days | $137.52 USDT |
| 12 Luni | $497 | 365 days | $497.14 USDT |

The unique cents are deterministically derived from the payment ID hash, ensuring each payment has a matchable amount.
