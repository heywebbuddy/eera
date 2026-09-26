// Shared Cashfree helpers. Files prefixed with "_" are not exposed as Vercel routes.
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   CASHFREE_APP_ID      – App ID from Cashfree dashboard → Developers → API Keys
//   CASHFREE_SECRET_KEY  – Secret key from the same page (never expose to the browser)
//   CASHFREE_ENV         – "production" or "sandbox" (defaults to sandbox)
//   SITE_URL             – optional, e.g. https://eerafoundation.org (defaults to the request origin)

import crypto from 'node:crypto';

const API_VERSION = '2026-01-01';

export const MIN_AMOUNT = 10;
export const MAX_AMOUNT = 500000;

export function cashfreeMode() {
    return process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
}

function baseUrl() {
    return cashfreeMode() === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
}

export async function cashfree(path, { method = 'GET', body } = {}) {
    const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY } = process.env;
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) throw new Error('Cashfree keys are not configured');

    const res = await fetch(baseUrl() + path, {
        method,
        headers: {
            'content-type': 'application/json',
            'x-api-version': API_VERSION,
            'x-client-id': CASHFREE_APP_ID,
            'x-client-secret': CASHFREE_SECRET_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error('Cashfree error', res.status, path, data);
        const err = new Error(data.message || 'Payment provider error');
        err.status = res.status;
        throw err;
    }
    return data;
}

export function siteUrl(request) {
    return (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
}

export function makeId(prefix) {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

export function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
}

// Validates and normalises donor input shared by one-time and monthly donations.
export function parseDonor(input) {
    const amount = Math.round(Number(input.amount) * 100) / 100;
    const name = String(input.name || '').trim().slice(0, 100);
    const email = String(input.email || '').trim().slice(0, 100);
    const phone = String(input.phone || '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
    const pan = String(input.pan || '').trim().toUpperCase();

    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
        return { error: `Please enter an amount between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString('en-IN')}.` };
    }
    if (!name) return { error: 'Please enter your name.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email address.' };
    if (!/^[6-9]\d{9}$/.test(phone)) return { error: 'Please enter a valid 10-digit Indian mobile number.' };
    if (pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) return { error: 'PAN should look like ABCDE1234F.' };

    return { amount, name, email, phone, pan };
}
