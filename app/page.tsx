'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2, Shield, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function Home() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; count: number } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from('donations')
        .select('amount_cents')
        .eq('status', 'paid');

      if (data) {
        const totalCents = data.reduce((sum, d) => sum + d.amount_cents, 0);
        setStats({ total: totalCents / 100, count: data.length });
      }
    }
    fetchStats();
  }, []);

  async function handlePayment() {
    setError('');

    const numericAmount = parseFloat(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < 10) {
      setError('Le montant minimum est de 10 €.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numericAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.');
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError('Réponse invalide du service de paiement.');
      }
    } catch {
      setError('Impossible de contacter le service de paiement.');
    } finally {
      setLoading(false);
    }
  }

  function handlePreset(value: number) {
    setAmount(String(value));
    setError('');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center py-6 px-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Sadaqa
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-fade-up">
          {/* Donation counter */}
          {stats && stats.count > 0 && (
            <div className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-5 py-3 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground">{stats.count}</span> dons —{' '}
                <span className="font-bold text-primary">{stats.total.toLocaleString('fr-FR')} €</span> collectés
              </span>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-8 shadow-xl shadow-emerald-900/5 sm:p-10">
            <div className="mb-2 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <Heart className="h-7 w-7 text-primary" />
              </div>
            </div>

            <h1 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Choisissez le montant
              <br />
              de votre Sadaqa
            </h1>

            <p className="mt-3 text-center text-sm text-muted-foreground">
              Votre contribution soutient ceux qui en ont besoin.
            </p>

            {/* Preset amounts */}
            <div className="mt-8 grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePreset(value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    amount === String(value)
                      ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent/50'
                  }`}
                >
                  {value} €
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            <div className="mt-4">
              <label
                htmlFor="amount"
                className="mb-1.5 block text-sm font-medium text-muted-foreground"
              >
                Montant personnalisé
              </label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min={10}
                  step="1"
                  placeholder="25"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePayment();
                  }}
                  className="h-12 text-lg font-semibold pr-10"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                  €
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 animate-scale-in rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Pay button */}
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="mt-6 h-12 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-5 w-5" />
                  Payer {amount && parseFloat(amount) >= 10 ? `${amount} €` : ''}
                </>
              )}
            </Button>

            {/* Trust indicators */}
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Paiement sécurisé
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                100% de votre don reversé
              </span>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Montant minimum : 10 €
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sadaqa — Tous droits réservés
      </footer>
    </main>
  );
}
