// POST /api/create-order — creates a one-time donation order and returns its payment session.
import { cashfree, cashfreeMode, json, makeId, parseDonor, siteUrl } from './_cashfree.js';

export async function POST(request) {
    const input = await request.json().catch(() => ({}));
    const donor = parseDonor(input);
    if (donor.error) return json({ error: donor.error }, 400);

    const orderId = makeId('EERA');
    const site = siteUrl(request);

    try {
        const order = await cashfree('/orders', {
            method: 'POST',
            body: {
                order_id: orderId,
                order_amount: donor.amount,
                order_currency: 'INR',
                order_note: 'Donation to EERA Human Health Foundation',
                customer_details: {
                    customer_id: `donor_${donor.phone}`,
                    customer_name: donor.name,
                    customer_email: donor.email,
                    customer_phone: donor.phone,
                },
                order_meta: {
                    return_url: `${site}/?donation=order&id=${orderId}`,
                    notify_url: `${site}/api/webhook`,
                },
                order_tags: { type: 'one_time', ...(donor.pan && { pan: donor.pan }) },
            },
        });
        return json({ id: orderId, sessionId: order.payment_session_id, mode: cashfreeMode() });
    } catch (err) {
        return json({ error: 'Could not start the payment. Please try again.' }, 502);
    }
}
