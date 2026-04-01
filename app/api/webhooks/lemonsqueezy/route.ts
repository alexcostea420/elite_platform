import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || ''

function verifySignature(payload: string, signature: string): boolean {
  if (!webhookSecret) return true // Skip verification if no secret set
  const hmac = crypto.createHmac('sha256', webhookSecret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-signature') || ''

  // Verify webhook signature
  if (webhookSecret && !verifySignature(body, signature)) {
    console.error('Invalid webhook signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const eventName = event.meta?.event_name
  const data = event.data?.attributes

  console.log(`[LemonSqueezy] Event: ${eventName}`)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (eventName === 'order_created') {
    // Payment successful
    const email = data?.user_email
    const productName = data?.first_order_item?.product_name || ''
    const total = parseFloat(data?.total || '0') / 100 // cents to dollars
    const orderId = event.data?.id

    console.log(`[LemonSqueezy] Order: ${email} paid $${total} for ${productName}`)

    // Determine plan duration from product name or variant
    let planDuration = '30_days'
    let daysToAdd = 30
    if (productName.toLowerCase().includes('annual') || productName.toLowerCase().includes('12')) {
      planDuration = '365_days'
      daysToAdd = 365
    } else if (productName.toLowerCase().includes('3 month') || productName.toLowerCase().includes('quarter')) {
      planDuration = '90_days'
      daysToAdd = 90
    }

    // Find or create user by email
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    let userId = existingUser?.id

    if (!userId) {
      // Create auth user + profile
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      })
      if (error) {
        console.error(`[LemonSqueezy] User creation failed: ${error.message}`)
        return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
      }
      userId = newUser.user.id
    }

    // Record payment
    const now = new Date()
    const expiresAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)

    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: userId,
      plan_duration: planDuration,
      amount_expected: total,
      amount_received: total,
      currency: 'USD',
      chain: 'lemonsqueezy',
      wallet_address: 'lemonsqueezy',
      reference_amount: total,
      tx_hash: `ls_${orderId}`,
      status: 'confirmed',
      confirmed_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })

    if (paymentError) {
      console.error(`[LemonSqueezy] Payment record failed: ${paymentError.message}`)
    }

    // Activate subscription
    const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      tier: 'elite',
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })

    if (subError) {
      console.error(`[LemonSqueezy] Subscription failed: ${subError.message}`)
    }

    console.log(`[LemonSqueezy] Activated: ${email} → Elite ${planDuration} until ${expiresAt.toISOString()}`)

    // Telegram notification
    try {
      const tgToken = process.env.TELEGRAM_BOT_TOKEN || ''
      if (tgToken) {
        const msg = `💰 <b>NEW PAYMENT</b>\n${email}\n$${total} — ${planDuration}\nvia LemonSqueezy`
        const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`
        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: '5684771081', text: msg, parse_mode: 'HTML' }),
        })
      }
    } catch {}
  }

  if (eventName === 'subscription_expired' || eventName === 'subscription_cancelled') {
    const email = data?.user_email
    console.log(`[LemonSqueezy] Subscription ended: ${email}`)

    // Deactivate subscription
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (user) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .eq('status', 'active')
    }
  }

  return NextResponse.json({ received: true })
}
