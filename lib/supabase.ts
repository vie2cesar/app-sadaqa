import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Donation = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  provider: string;
  provider_checkout_id: string | null;
  provider_payment_id: string | null;
  donor_name: string | null;
  donor_email: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
};
