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

    try {
        if (type === 'order') {
            const order = await cashfree(`/orders/${encodeURIComponent(id)}`);
            return json({ status: order.order_status, amount: order.order_amount });
        }
        const sub = await cashfree(`/subscriptions/${encodeURIComponent(id)}`);
        return json({ status: sub.subscription_status, amount: sub.plan_details?.plan_amount });
    } catch (err) {
        return json({ error: 'Could not verify the payment' }, err.status === 404 ? 404 : 502);
    }
}
