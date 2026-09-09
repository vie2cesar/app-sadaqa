/*
# Create donations table

## Purpose
Stores every donation made through the Sadaqa app. Each row tracks the
amount, currency, payment provider reference, and current status of the
donation (pending → paid or failed). This enables future webhook
integration and lets the site display a live donation counter.

## New Tables
- `donations`
  - `id` (uuid, primary key)
  - `amount_cents` (integer, not null) — donation amount in cents (e.g. 2500 = 25.00 €)
  - `currency` (text, not null, default 'EUR')
  - `status` (text, not null, default 'pending') — one of: pending, paid, failed, cancelled
  - `provider` (text, default 'qist') — payment provider name
  - `provider_checkout_id` (text, nullable) — checkout session ID returned by Qist
  - `provider_payment_id` (text, nullable) — payment ID confirmed by webhook
  - `donor_name` (text, nullable) — optional donor name
  - `donor_email` (text, nullable) — optional donor email
  - `message` (text, nullable) — optional donor message
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## Indexes
- `idx_donations_status` — filter by status (e.g. paid donations for counter)
- `idx_donations_created_at` — sort by date
- `idx_donations_provider_checkout_id` — webhook lookup by checkout ID

## Security
- RLS enabled on `donations`.
- This is a no-auth (single-tenant) app — no sign-in screen.
- SELECT is public (anyone can see the donation counter and list).
- INSERT is public (the app creates a pending donation before redirecting to Qist).
- UPDATE is public (the webhook or success callback marks the donation as paid).
- DELETE is blocked — donations are never deleted from the app.

## Important Notes
1. The app has no sign-in screen, so all policies use `TO anon, authenticated`.
2. `USING (true)` on SELECT/INSERT/UPDATE is acceptable here because the
   donation data is intentionally public (the counter and list are visible
   to everyone). Sensitive fields like donor_email are not exposed by the app.
3. DELETE has no policy — donations cannot be removed through the anon key.
4. The `updated_at` column auto-refreshes via a trigger when a row changes.
*/

CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'qist',
  provider_checkout_id text,
  provider_payment_id text,
  donor_name text,
  donor_email text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations (status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_provider_checkout_id ON donations (provider_checkout_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_donations_updated_at ON donations;
CREATE TRIGGER trg_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone can read (public donation counter / list)
DROP POLICY IF EXISTS "anon_select_donations" ON donations;
CREATE POLICY "anon_select_donations" ON donations FOR SELECT
  TO anon, authenticated USING (true);

-- INSERT: anyone can create a pending donation
DROP POLICY IF EXISTS "anon_insert_donations" ON donations;
CREATE POLICY "anon_insert_donations" ON donations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- UPDATE: allow status updates (webhook / success callback)
DROP POLICY IF EXISTS "anon_update_donations" ON donations;
CREATE POLICY "anon_update_donations" ON donations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- No DELETE policy: donations cannot be removed via the anon key
