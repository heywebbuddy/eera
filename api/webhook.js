// POST /api/webhook — Cashfree server-to-server notifications (payments, subscription charges, cancellations).
// Add this URL in Cashfree dashboard → Developers → Webhooks for both Payments and Subscriptions.
// Events are verified and logged (Vercel → Logs); Cashfree's dashboard remains the record of truth.
import crypto from 'node:crypto';
import { json } from './_cashfree.js';

export async function POST(request) {
    const raw = await request.text();
    const timestamp = request.headers.get('x-webhook-timestamp') || '';
    const signature = request.headers.get('x-webhook-signature') || '';

    const expected = Buffer.from(crypto.createHmac('sha256', process.env.CASHFREE_SECRET_KEY || '')
        .update(timestamp + raw)
        .digest('base64'));
    const received = Buffer.from(signature);
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
        return json({ error: 'Invalid signature' }, 401);
    }

    let event;
    try { event = JSON.parse(raw); } catch { return json({ error: 'Invalid payload' }, 400); }
    const data = event.data || {};
    console.log('Cashfree webhook', event.type, JSON.stringify({
        order: data.order?.order_id,
        subscription: data.subscription_details?.subscription_id || data.subscription_id,
        amount: data.order?.order_amount ?? data.payment?.payment_amount,
        status: data.payment?.payment_status || data.subscription_details?.subscription_status,
    }));

    return json({ ok: true });
}
