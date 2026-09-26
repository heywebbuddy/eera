// POST /api/create-subscription — creates a monthly donation mandate (UPI Autopay / card / e-NACH).
import { cashfree, cashfreeMode, json, makeId, parseDonor, siteUrl } from './_cashfree.js';

export async function POST(request) {
    const input = await request.json().catch(() => ({}));
    const donor = parseDonor(input);
    if (donor.error) return json({ error: donor.error }, 400);

    const subscriptionId = makeId('EERA_M');
    const site = siteUrl(request);

    try {
        const subscription = await cashfree('/subscriptions', {
            method: 'POST',
            body: {
                subscription_id: subscriptionId,
                customer_details: {
                    customer_name: donor.name,
                    customer_email: donor.email,
                    customer_phone: donor.phone,
                },
                plan_details: {
                    plan_name: 'EERA Monthly Donation',
                    plan_type: 'PERIODIC',
                    plan_currency: 'INR',
                    plan_amount: donor.amount,
                    plan_max_amount: donor.amount,
                    plan_intervals: 1,
                    plan_interval_type: 'MONTH',
                    plan_note: 'Monthly donation to EERA Human Health Foundation',
                },
                authorization_details: {
                    authorization_amount: 1,
                    authorization_amount_refund: true,
                },
                subscription_meta: {
                    return_url: `${site}/?donation=subscription&id=${subscriptionId}`,
                },
                subscription_tags: { type: 'monthly', ...(donor.pan && { pan: donor.pan }) },
            },
        });
        return json({ id: subscriptionId, sessionId: subscription.subscription_session_id, mode: cashfreeMode() });
    } catch (err) {
        return json({ error: 'Could not start the monthly donation. Please try again.' }, 502);
    }
}
