import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const QIST_API_URL = 'https://pay.qistdigital.com/api/v1/checkout/init';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount < 10) {
      return NextResponse.json(
        { error: 'Le montant minimum est de 10 €.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.QIST_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Configuration de paiement manquante.' },
        { status: 500 }
      );
    }

    const baseUrl = getBaseUrl();

    const qistResponse = await fetch(QIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount_cents: Math.round(amount * 100),
        currency: 'EUR',
        product_name: 'Sadaqa',
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}`,
      }),
    });

    if (!qistResponse.ok) {
      const errorText = await qistResponse.text();
      console.error('Qist API error:', qistResponse.status, errorText);
      return NextResponse.json(
        { error: 'Le service de paiement est indisponible. Veuillez réessayer.' },
        { status: 502 }
      );
    }

    const data = await qistResponse.json();
    const checkoutUrl = data.checkout_url || data.url || data.redirect_url;
    const checkoutId = data.id || data.checkout_id || data.session_id || null;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Réponse invalide du service de paiement.' },
        { status: 502 }
      );
    }

    // Save pending donation to database
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error: dbError } = await supabase.from('donations').insert({
        amount_cents: Math.round(amount * 100),
        currency: 'EUR',
        status: 'pending',
        provider: 'qist',
        provider_checkout_id: checkoutId,
      });

      if (dbError) {
        console.error('Failed to save donation:', dbError.message);
      }
    }

    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch {
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
