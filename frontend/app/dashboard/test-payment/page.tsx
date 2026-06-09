'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/api';
import Script from 'next/script';
import {
  CreditCard,
  Coins,
  ShieldCheck,
  AlertCircle,
  Check,
  Activity,
  Sparkles,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface ActiveSubscription {
  id: string;
  plan: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  amount: number;
  stripeSubscriptionId: string | null;
  startDate: string | null;
  endDate: string | null;
}

export default function TestPaymentPage() {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedAmount, setSelectedAmount] = useState<number>(1);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [fetchingSub, setFetchingSub] = useState<boolean>(true);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current active subscription from database
  const fetchActiveSubscription = useCallback(async () => {
    setFetchingSub(true);
    setErrorMessage(null);
    try {
      const data = await api.get('/subscriptions/active');
      setActiveSub(data.subscription || null);
    } catch (err: any) {
      console.error('Error fetching subscription status:', err);
      setErrorMessage(err.message || 'Failed to check subscription status from server.');
    } finally {
      setFetchingSub(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSubscription();
  }, [fetchActiveSubscription]);

  // Handle Order creation and Razorpay checkout
  const handlePayTestAmount = async () => {
    setProcessingPayment(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Request backend to create Razorpay order (or use sandbox mode)
      const orderData = await api.post('/subscriptions/checkout', {
        plan: selectedPlan,
        customAmount: selectedAmount,
      });

      if (orderData.sandbox) {
        // Sandbox bypass triggered
        setSuccessMessage(`Sandbox Mode: Subscription auto-activated in database (Razorpay credentials not configured).`);
        await fetchActiveSubscription();
        return;
      }

      // 2. Open standard Razorpay payment gateway
      if (!(window as any).Razorpay) {
        throw new Error('Razorpay Checkout SDK is not loaded. Please try again in a moment.');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Golf Charity Platform',
        description: `${selectedPlan} Test Subscription`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setProcessingPayment(true);
          try {
            // 3. Verify payment signature on backend
            const verifyData = await api.post('/subscriptions/verify-payment', {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              plan: selectedPlan,
              amount: selectedAmount,
            });

            setSuccessMessage(verifyData.message || 'Payment verified & subscription activated successfully!');
            await fetchActiveSubscription();
          } catch (err: any) {
            setErrorMessage(err.message || 'Payment verification failed.');
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#10b981', // Premium emerald green matching layout
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Razorpay test checkout error:', err);
      setErrorMessage(err.message || 'Failed to initialize payment checkout.');
      setProcessingPayment(false);
    }
  };

  // Mock Cancellation for Test Subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your active subscription?')) {
      return;
    }

    setProcessingPayment(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await api.post('/subscriptions/cancel');
      setSuccessMessage(response.message || 'Subscription cancelled successfully.');
      await fetchActiveSubscription();
    } catch (err: any) {
      console.error('Cancel subscription error:', err);
      setErrorMessage(err.message || 'Failed to cancel subscription.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const testAmounts = [
    { value: 1, label: '₹1.00', desc: 'Minimal transaction charge' },
    { value: 2, label: '₹2.00', desc: 'Standard test transaction' },
    { value: 3, label: '₹3.00', desc: 'Pro test transaction' },
  ];

  return (
    <div className="space-y-8">
      {/* Script block to load Razorpay in client browser */}
      <Script
        id="razorpay-checkout-sdk"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-8 rounded-3xl border border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <Coins className="text-primary" size={28} />
            Razorpay Subscription Testing
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
            Test the end-to-end checkout functionality after deployment using small amounts (₹1, ₹2, or ₹3). This verifies database updates, user authorization, and payment signature verification at minimal cost.
          </p>
        </div>
        <button
          onClick={fetchActiveSubscription}
          disabled={fetchingSub}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-white hover:bg-white/10 transition-all font-semibold disabled:opacity-50 h-fit"
        >
          <RefreshCw size={14} className={fetchingSub ? 'animate-spin' : ''} />
          Sync Status
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-primary text-sm flex items-start gap-2">
          <Check size={18} className="flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Test Control Panel */}
        <div className="lg:col-span-2 glass p-8 rounded-3xl border border-border space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            Configure Transaction
          </h3>

          {/* Plan selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Choose Plan Tier</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedPlan('MONTHLY')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedPlan === 'MONTHLY'
                    ? 'border-primary bg-primary/5 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                    : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-extrabold text-sm">Monthly Golfer</div>
                <div className="text-[10px] opacity-80 mt-1">Normal Price: $29/mo</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('YEARLY')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedPlan === 'YEARLY'
                    ? 'border-primary bg-primary/5 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                    : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-extrabold text-sm">Annual Supporter</div>
                <div className="text-[10px] opacity-80 mt-1">Normal Price: $290/yr</div>
              </button>
            </div>
          </div>

          {/* Test Amount options */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Select Charity Test Amount</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testAmounts.map((amt) => (
                <button
                  key={amt.value}
                  type="button"
                  onClick={() => setSelectedAmount(amt.value)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedAmount === amt.value
                      ? 'border-primary bg-primary/5 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                      : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="text-lg font-black text-primary">{amt.label}</div>
                  <div className="text-[10px] mt-1 leading-relaxed">{amt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end">
            <button
              onClick={handlePayTestAmount}
              disabled={processingPayment}
              className="px-8 py-4 rounded-2xl bg-primary text-black font-extrabold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
            >
              {processingPayment ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin mr-1"></span>
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay {selectedAmount} Rupee with Razorpay
                </>
              )}
            </button>
          </div>
        </div>

        {/* Database Status Sidebar */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-border space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="text-primary" size={16} />
              Active Database Subscription
            </h3>

            {fetchingSub ? (
              <div className="py-6 flex justify-center">
                <span className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></span>
              </div>
            ) : activeSub ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Plan Tier</p>
                    <p className="text-lg font-extrabold text-white">
                      {activeSub.plan === 'MONTHLY' ? 'Monthly Golfer' : 'Annual Supporter'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Test Amount Paid</p>
                    <p className="text-sm font-bold text-white">₹{activeSub.amount.toFixed(2)}</p>
                  </div>
                  {activeSub.endDate && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">End Date (Next Renewal)</p>
                      <p className="text-xs font-semibold text-white">
                        {new Date(activeSub.endDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Payment Reference ID</p>
                    <p className="text-[10px] font-mono text-muted-foreground break-all bg-black/30 p-2 rounded border border-white/5 mt-0.5">
                      {activeSub.stripeSubscriptionId}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCancelSubscription}
                  disabled={processingPayment}
                  className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                  Cancel Subscription
                </button>
              </div>
            ) : (
              <div className="p-6 text-center space-y-2 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs font-bold text-white">No Active Subscription Found</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your account currently does not have an active subscription in the database. Perform a test payment to activate.
                </p>
              </div>
            )}
          </div>

          {/* Test Guidelines sidebar */}
          <div className="glass p-6 rounded-3xl border border-border space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-primary" size={16} />
              Testing Guide
            </h3>
            <ul className="space-y-3 text-[11px] text-muted-foreground leading-relaxed">
              <li>
                🔒 **Razorpay Sandbox**: If no environment keys exist, clicking checkout activates a mock sandbox payment automatically.
              </li>
              <li>
                💳 **Razorpay Test Cards**: In interactive test mode, you can complete the payment using Razorpay's test credentials (e.g. Netbanking / standard dummy cards).
              </li>
              <li>
                ⚡ **Instant Access**: Upon successful transaction, database updates take place immediately and scores entry is enabled.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
