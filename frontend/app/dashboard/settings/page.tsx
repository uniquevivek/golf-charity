'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { Settings, CreditCard, ShieldCheck, AlertCircle, Check } from 'lucide-react';

interface ActiveSubscription {
  id: string;
  plan: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  amount: number;
  endDate: string | null;
}

export default function UserSettingsPage() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const data = await api.get('/subscriptions/active');
      setSubscription(data.subscription || null);
    } catch (err: any) {
      console.error('Failed to load subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const activeSub = subscription?.status === 'ACTIVE';
  
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription billing? You will retain access until the end of your billing cycle.')) {
      return;
    }

    setCancelling(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/subscriptions/cancel');
      setSuccess(response.message || 'Subscription successfully cancelled.');
      await fetchSubscription();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to cancel subscription billing');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-primary text-sm flex items-start gap-2">
          <Check size={18} className="flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subscription billing details */}
        <div className="lg:col-span-2 glass p-8 rounded-3xl border border-border space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="text-primary" size={20} />
            Subscription Plan details
          </h2>

          {loading ? (
            <div className="py-12 flex justify-center">
              <span className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                  <p className="text-xl font-black text-white">
                    {activeSub
                      ? (subscription?.plan === 'MONTHLY' ? 'Monthly Golfer' : 'Annual Supporter')
                      : 'No Active Subscription'}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-xs text-muted-foreground">Pricing Tier</p>
                  <p className="text-xl font-black text-white">
                    {activeSub
                      ? `₹${subscription?.amount.toFixed(2)}`
                      : '—'}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-xs text-muted-foreground">Next Renewal / Expiry</p>
                  <p className="text-sm font-bold text-white">
                    {activeSub && subscription?.endDate
                      ? new Date(subscription.endDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={`text-sm font-bold ${activeSub ? 'text-primary' : 'text-red-400'}`}>
                    {activeSub
                      ? (subscription?.status === 'CANCELLED' ? 'Cancelled (Pending Expiry)' : 'Active (Auto-renew)')
                      : 'Inactive'}
                  </p>
                </div>
              </div>

              {activeSub && subscription?.status !== 'CANCELLED' && (
                <div className="pt-6 border-t border-border flex justify-end">
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {cancelling ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Informational sidebar */}
        <div className="glass p-6 rounded-2xl border border-border space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="text-primary" size={16} />
            Billing Policies
          </h3>
          <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <li>
              🔐 **Secure Transactions:** Payments are encrypted and processed by Razorpay. We do not store full card credentials.
            </li>
            <li>
              ⚡ **Grace Period:** If cancelled, your subscription remains active for score logging and draws until the end of the paid cycle.
            </li>
            <li>
              💌 **Refunds:** Subscriptions are non-refundable since 50% is instantly committed to selected charities.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
