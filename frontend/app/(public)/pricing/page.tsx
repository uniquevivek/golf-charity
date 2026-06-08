'use client';

import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/api';
import { Check, ShieldCheck, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PricingPage() {
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: 'MONTHLY' | 'YEARLY') => {
    if (!isAuthenticated) {
      router.push('/register?redirect=pricing');
      return;
    }

    setLoadingPlan(plan);
    setError(null);

    try {
      const data = await api.post('/subscriptions/checkout', { plan });
      
      // If Stripe priceId was a mock placeholder or Stripe was not set up, it returns sandbox: true
      if (data.sandbox) {
        alert(`Sandbox Mode: Mock ${plan} subscription activated successfully in local DB!`);
        router.push('/dashboard');
      } else if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start Stripe checkout session');
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    'Log up to 5 golf scores per cycle',
    'Automatic entry in all monthly prize draws',
    'Select a custom charity for your donations',
    'Allocate custom contribution percentages (min 10%)',
    'Vetted proof validation workflows',
    'Secure payouts with full audit trail',
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16 space-y-12 flex flex-col items-center">
      {/* Title */}
      <div className="text-center space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Unlock the golf score entry system, select your vetted non-profit, and enter the cash draw pool. Choose the subscription that fits you.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-md p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-6">
        {/* Monthly Card */}
        <div className="glass-card p-8 rounded-3xl border border-border flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="text-xs font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit mb-4">
              Flexible Plan
            </div>
            <h3 className="text-2xl font-bold text-white">Monthly Golfer</h3>
            <p className="text-sm text-muted-foreground mt-2">Billed monthly. Cancel at any time.</p>
            
            <div className="my-8 flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">$29</span>
              <span className="text-muted-foreground text-sm font-semibold">/ month</span>
            </div>

            <div className="h-[1px] bg-border my-6"></div>

            <ul className="space-y-4">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('MONTHLY')}
            disabled={loadingPlan !== null}
            className="w-full py-4 rounded-xl mt-8 bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/5 flex items-center justify-center gap-2"
          >
            {loadingPlan === 'MONTHLY' ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
            ) : (
              <>
                <CreditCard size={18} />
                Get Monthly Plan
              </>
            )}
          </button>
        </div>

        {/* Yearly Card (Featured) */}
        <div className="glass p-8 rounded-3xl border border-primary/30 flex flex-col justify-between relative overflow-hidden group shadow-[0_0_30px_rgba(16,185,129,0.08)] bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="absolute top-0 right-0 p-3 bg-primary text-black font-black text-[10px] uppercase tracking-widest rounded-bl-xl">
            Save 15%
          </div>

          <div>
            <div className="text-xs font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit mb-4">
              Best Value
            </div>
            <h3 className="text-2xl font-bold text-white">Annual Supporter</h3>
            <p className="text-sm text-muted-foreground mt-2">Billed annually. 2 months free included.</p>
            
            <div className="my-8 flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">$290</span>
              <span className="text-muted-foreground text-sm font-semibold">/ year</span>
            </div>

            <div className="h-[1px] bg-border my-6"></div>

            <ul className="space-y-4">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('YEARLY')}
            disabled={loadingPlan !== null}
            className="w-full py-4 rounded-xl mt-8 bg-primary text-black font-bold hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
          >
            {loadingPlan === 'YEARLY' ? (
              <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin"></span>
            ) : (
              <>
                <CreditCard size={18} />
                Get Yearly Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 w-full max-w-xl text-center justify-center mt-6">
        <ShieldCheck className="text-primary flex-shrink-0" size={18} />
        <p className="text-xs text-muted-foreground leading-relaxed">
          We use Stripe for secure tokenized payments. We never store credit card numbers on our server. Cancel your subscription billing at any time from your account settings.
        </p>
      </div>
    </div>
  );
}
