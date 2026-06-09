'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import Script from 'next/script';
import {
  Search,
  Globe,
  Award,
  Sparkles,
  Calendar,
  Heart,
  X,
  CreditCard,
  Check,
  AlertCircle
} from 'lucide-react';

interface Charity {
  id: string;
  name: string;
  description: string;
  image: string;
  website: string | null;
  featured: boolean;
  events: string[];
}

export default function CharitiesPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Standalone Donation Modal States
  const [donateCharity, setDonateCharity] = useState<Charity | null>(null);
  const [donateAmount, setDonateAmount] = useState<string>('50'); // Default option ₹50
  const [customAmount, setCustomAmount] = useState<string>('');
  const [processingDonation, setProcessingDonation] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationSuccess, setDonationSuccess] = useState<string | null>(null);

  const fetchCharities = async () => {
    setLoading(true);
    setError(null);
    try {
      let path = '/charities';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (featuredOnly) params.append('featured', 'true');
      
      if (params.toString()) {
        path += `?${params.toString()}`;
      }

      const data = await api.get(path);
      setCharities(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load charities. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input
    const delayDebounce = setTimeout(() => {
      fetchCharities();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, featuredOnly]);

  const handleOpenDonateModal = (charity: Charity) => {
    if (!isAuthenticated) {
      alert('Please sign in or register to make a direct donation.');
      return;
    }
    setDonateCharity(charity);
    setDonateAmount('50');
    setCustomAmount('');
    setDonationError(null);
    setDonationSuccess(null);
  };

  const handleCloseDonateModal = () => {
    setDonateCharity(null);
    setProcessingDonation(false);
  };

  const handleConfirmDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donateCharity) return;

    const finalAmount = parseFloat(donateAmount === 'CUSTOM' ? customAmount : donateAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setDonationError('Please enter a valid donation amount.');
      return;
    }

    setProcessingDonation(true);
    setDonationError(null);
    setDonationSuccess(null);

    try {
      // 1. Create donation checkout order on backend
      const checkoutData = await api.post('/donations/checkout', {
        charityId: donateCharity.id,
        amount: finalAmount,
      });

      if (checkoutData.sandbox) {
        // Mock Sandbox Mode triggered
        setDonationSuccess(`Mock Sandbox Mode: Donation of ₹${finalAmount.toFixed(2)} to ${donateCharity.name} processed successfully!`);
        setProcessingDonation(false);
        setTimeout(() => {
          handleCloseDonateModal();
        }, 3000);
        return;
      }

      // 2. Open standard Razorpay gateway
      if (!(window as any).Razorpay) {
        throw new Error('Razorpay Checkout SDK is not loaded. Please wait a moment.');
      }

      const options = {
        key: checkoutData.keyId,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        name: 'Golf Charity Platform',
        description: `Direct donation to ${donateCharity.name}`,
        order_id: checkoutData.orderId,
        handler: async function (response: any) {
          setProcessingDonation(true);
          try {
            // 3. Verify payment signature on backend
            const verifyData = await api.post('/donations/verify', {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              charityId: donateCharity.id,
              amount: finalAmount,
            });

            setDonationSuccess(verifyData.message || 'Direct donation payment verified successfully!');
            setTimeout(() => {
              handleCloseDonateModal();
            }, 3000);
          } catch (err: any) {
            setDonationError(err.message || 'Payment verification failed.');
          } finally {
            setProcessingDonation(false);
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#10b981',
        },
        modal: {
          ondismiss: function () {
            setProcessingDonation(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Donation checkout error:', err);
      setDonationError(err.message || 'Failed to initialize payment checkout.');
      setProcessingDonation(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16 space-y-8">
      {/* Script block to load Razorpay in client browser */}
      <Script
        id="razorpay-checkout-sdk"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Title */}
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-black text-white">Vetted Non-Profits</h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Select which charity receives your platform donations. Propose custom donation amounts and support vetted initiatives.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full glass p-4 rounded-2xl border border-border">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3.5 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search charities by name or cause..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827]/60 border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Featured Filter */}
        <button
          onClick={() => setFeaturedOnly(!featuredOnly)}
          className={`px-5 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 w-full sm:w-auto justify-center transition-all ${
            featuredOnly
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-border bg-[#111827]/40 text-muted-foreground hover:text-white'
          }`}
        >
          <Sparkles size={16} />
          Featured Only
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Grid Results */}
      {loading ? (
        // Loading Skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass p-6 rounded-3xl border border-border animate-pulse space-y-6">
              <div className="w-full h-48 bg-slate-800 rounded-2xl"></div>
              <div className="space-y-3">
                <div className="h-6 bg-slate-800 rounded w-2/3"></div>
                <div className="h-4 bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : charities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No charities found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {charities.map((charity) => (
            <div
              key={charity.id}
              className="glass-card p-6 rounded-3xl border border-border flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="w-full h-48 rounded-2xl overflow-hidden relative mb-5 bg-slate-800">
                  <img
                    src={charity.image}
                    alt={charity.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {charity.featured && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
                      <Award size={10} />
                      Featured
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{charity.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                  {charity.description}
                </p>

                {/* Upcoming Events list (PRD-08) */}
                {charity.events && charity.events.length > 0 && (
                  <div className="mb-6 space-y-2 border-t border-white/5 pt-4">
                    <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Upcoming Events</p>
                    <ul className="space-y-1.5">
                      {charity.events.map((evt, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                          <Calendar size={12} className="text-primary flex-shrink-0" />
                          <span className="truncate">{evt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Links */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border mt-auto">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10 uppercase tracking-wider">
                    Vetted Partner
                  </div>
                  {charity.website && (
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Globe size={14} />
                      Visit Site
                    </a>
                  )}
                </div>

                {/* Direct Donation CTA (PRD-08) */}
                <button
                  onClick={() => handleOpenDonateModal(charity)}
                  className="w-full py-2.5 rounded-xl bg-primary text-black font-extrabold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(16,185,129,0.1)]"
                >
                  <Heart size={14} fill="currentColor" />
                  Donate Directly
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Standalone Donation Checkout Modal Overlay (PRD-08) */}
      {donateCharity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md glass border border-border rounded-3xl p-8 relative space-y-6">
            {/* Close */}
            <button
              onClick={handleCloseDonateModal}
              className="absolute top-6 right-6 text-muted-foreground hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                <Heart size={22} fill="currentColor" />
              </div>
              <h3 className="text-xl font-bold text-white mt-3">Direct Standalone Donation</h3>
              <p className="text-xs text-muted-foreground">Supporting: <strong className="text-white">{donateCharity.name}</strong></p>
            </div>

            {donationError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{donationError}</span>
              </div>
            )}

            {donationSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-primary text-xs flex items-start gap-2">
                <Check size={16} className="flex-shrink-0 mt-0.5" />
                <span>{donationSuccess}</span>
              </div>
            )}

            {!donationSuccess && (
              <form onSubmit={handleConfirmDonation} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Contribution Amount</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['50', '250', '1000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setDonateAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-3 rounded-xl border text-sm font-extrabold transition-all ${
                          donateAmount === amt
                            ? 'border-primary bg-primary/5 text-white'
                            : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDonateAmount('CUSTOM')}
                    className={`w-full py-2.5 rounded-xl border text-xs font-semibold mt-2 transition-all ${
                      donateAmount === 'CUSTOM'
                        ? 'border-primary bg-primary/5 text-white'
                        : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Custom Donation Amount
                  </button>
                </div>

                {donateAmount === 'CUSTOM' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-semibold text-slate-300">Enter Amount (INR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-sm text-muted-foreground font-bold">₹</span>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="100"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full bg-[#111827]/60 border border-border rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processingDonation}
                  className="w-full py-4 rounded-xl bg-primary text-black font-extrabold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-sm shadow-[0_4px_15px_rgba(16,185,129,0.25)]"
                >
                  {processingDonation ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin mr-1"></span>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Pay ₹{donateAmount === 'CUSTOM' ? (customAmount || '0') : donateAmount} INR
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
