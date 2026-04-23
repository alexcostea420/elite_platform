# CHANGELOG 002 — Payment System Fixes

## Phase 0: Reconnaissance
- Payment types (PaymentRow) already match DB schema
- API routes already use reference_amount, chain, wallet_address
- **Needs fix**: reference amount uses 2 decimal places (should be 3)
- **Needs fix**: getPaymentConfig() reads single PAYMENT_WALLET_ADDRESS (needs multi-chain)
- **Needs fix**: No collision check before insert
- **Needs fix**: No CSV export or manual confirm in admin
- **Needs fix**: UI hardcodes "TRC-20" in some places

## Phase 1: Types & Config
- Updated PaymentChain to support all 4 chains
- Added CHAIN_CONFIG with per-chain wallet env vars
- Changed generateReferenceAmount to 3 decimal places (999 unique values)
- getPaymentConfig now accepts chain parameter

## Phase 2: Collision Check
- Added retry logic (up to 3 attempts) on reference amount collision
- DB unique partial index is the safety net

## Phase 3: Multi-chain API
- /api/payments/create accepts chain parameter (default TRC-20)
- Validates chain is enabled and wallet is configured

## Phase 4: UI Updates
- Chain selector shows only when 2+ chains are enabled
- Amount displays with 3 decimal places
- Dynamic chain label in payment instructions

## Phase 5: Admin Improvements
- CSV export via ?format=csv on /api/admin/payments
- Manual confirm endpoint: POST /api/admin/payments/confirm
- Admin UI: Export CSV button + Manual confirm button on pending payments

## Phase 6: ENV vars
- PAYMENT_WALLET_ADDRESS → PAYMENT_WALLET_ADDRESS_TRC20
- Generated PAYMENT_WEBHOOK_SECRET and CRON_SECRET
