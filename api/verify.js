// GET /api/verify?type=order|subscription&id=... — reports the real status straight from Cashfree,
// so the thank-you message never trusts what the browser claims.
import { cashfree, json } from './_cashfree.js';

export async function GET(request) {
    const params = new URL(request.url).searchParams;
    const type = params.get('type');
    const id = params.get('id') || '';
    if (!/^EERA_[\w-]{3,60}$/.test(id) || !['order', 'subscription'].includes(type)) {
        return json({ error: 'Invalid request' }, 400);
    }

    // Only the first name is returned, for the thank-you greeting.
    const firstName = details => String(details?.customer_name || '').trim().split(/\s+/)[0].slice(0, 40);

    try {
        if (type === 'order') {
            const order = await cashfree(`/orders/${encodeURIComponent(id)}`);
            return json({ status: order.order_status, amount: order.order_amount, name: firstName(order.customer_details), date: order.created_at });
        }
        const sub = await cashfree(`/subscriptions/${encodeURIComponent(id)}`);
        return json({ status: sub.subscription_status, amount: sub.plan_details?.plan_amount, name: firstName(sub.customer_details), date: sub.subscription_first_charge_time || null });
    } catch (err) {
        return json({ error: 'Could not verify the payment' }, err.status === 404 ? 404 : 502);
    }
}
