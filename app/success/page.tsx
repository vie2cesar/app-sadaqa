'use client';

import { useEffect, useState } from 'react';
import { Heart, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function SuccessPage() {
  const [status, setStatus] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    async function markDonationPaid() {
      // Look for the most recent pending donation and mark it as paid
      const { data } = await supabase
        .from('donations')
        .select('id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        await supabase
          .from('donations')
          .update({ status: 'paid' })
          .eq('id', data[0].id);
      }

      setStatus('done');
    }
    markDonationPaid();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up text-center">
        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Confirmation en cours...</p>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Check className="h-10 w-10" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Merci pour votre Sadaqa
            </h1>

            <p className="mt-3 text-muted-foreground">
              Votre don a bien été traité. Qu&apos;Allah accepte votre contribution
              et vous récompense.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-primary" />
              Votre générosité fait la différence
            </div>

            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="mt-8 h-11 px-8"
            >
              Retour à l&apos;accueil
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
