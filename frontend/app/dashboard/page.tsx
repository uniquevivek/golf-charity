'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import Link from 'next/link';
import { Heart, Target, TrendingUp, AlertTriangle, ShieldCheck, ChevronRight, Award } from 'lucide-react';

interface Score {
  id: string;
  score: number;
  scoreDate: string;
}

interface Subscription {
  id: string;
  plan: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  amount: number;
  endDate: string | null;
}

interface Charity {
  id: string;
  name: string;
  image: string;
}

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const [scores, setScores] = useState<Score[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [jackpot, setJackpot] = useState('$84,250');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch scores (only if subscriber, but let's fetch safely)
        const scoreData = await api.get('/scores').catch(() => []);
        setScores(scoreData);

        // Fetch active subscription
        const subData = await api.get('/subscriptions/active').catch(() => null);
        if (subData && subData.subscription) {
          setSubscription(subData.subscription);
        }
      } catch (err) {
        console.error('Error fetching dashboard overview data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeSub = subscription?.status === 'ACTIVE';

  // Calculate average score
  const avgScore = scores.length > 0 
    ? (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-8">
      {/* Alert if not subscribed */}
      {!activeSub && (
        <div className="glass p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-white">Action Required: Activate Subscription</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                To participate in the monthly draws and log your golf scores, you need an active Monthly or Yearly subscription.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 rounded-lg bg-primary text-black font-bold text-xs hover:bg-primary/90 transition-all flex-shrink-0 text-center"
          >
            Activate Subscription
          </Link>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subscription Info Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground">My Subscription</span>
              <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                activeSub
                  ? 'bg-primary/20 text-primary border border-primary/20'
                  : 'bg-red-500/20 text-red-400 border border-red-500/20'
              }`}>
                {activeSub ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-2xl font-black text-white">
              {activeSub
                ? (subscription?.plan === 'MONTHLY' ? 'Monthly Golfer' : 'Annual Supporter')
                : 'No Active Subscription'}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeSub && subscription?.endDate ? (
                <>
                  Next billing date: <span className="text-white font-semibold">
                    {new Date(subscription.endDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </>
              ) : (
                'No active billing cycle'
              )}
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-6"
          >
            Manage Billing
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Selected Charity Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">Charity Contribution</span>
            {user?.selectedCharity ? (
              <>
                <p className="text-2xl font-black text-white truncate">{user.selectedCharity.name}</p>
                <p className="text-xs text-muted-foreground">
                  Donation Share: <span className="text-primary font-bold">{user?.donationPercentage}%</span> of fee
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-white">No Charity Picked</p>
                <p className="text-xs text-muted-foreground">You are donating a baseline 10%.</p>
              </>
            )}
          </div>
          <Link
            href="/dashboard/charity"
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-6"
          >
            Change Charity
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Golf Stats Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">My Golf Analytics</span>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-white">{avgScore}</p>
              <span className="text-xs text-muted-foreground">average score</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Active scores: <span className="text-white font-semibold">{scores.length} / 5</span>
            </p>
          </div>
          <Link
            href="/dashboard/scores"
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-6"
          >
            Manage Scores
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Split Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draw details */}
        <div className="lg:col-span-2 glass p-6 rounded-3xl border border-border space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-primary" size={20} />
            Upcoming Monthly Draw
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-xs text-muted-foreground">Current Rollover Jackpot</p>
              <p className="text-2xl font-black text-primary">{jackpot}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-xs text-muted-foreground">My Entry Ticket</p>
              <p className="text-sm font-bold text-white">
                {scores.length === 5 
                  ? '✅ Active (5/5 scores submitted)'
                  : `❌ Incomplete (${scores.length}/5 scores)`}
              </p>
            </div>
          </div>

          {scores.length < 5 && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary leading-relaxed">
              💡 **Tip:** You must submit exactly 5 scores to enter the draw. Go to the **Golf Scores** tab to complete your profile!
            </div>
          )}
        </div>

        {/* Quick Winnings summary */}
        <div className="glass p-6 rounded-3xl border border-border flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="text-primary" size={20} />
              Recent Winnings
            </h3>
            
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-muted-foreground">Total Cash Won</p>
              <p className="text-3xl font-black text-white">$0.00</p>
            </div>
          </div>

          <Link
            href="/dashboard/winnings"
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-center font-bold text-xs border border-white/5 transition-all"
          >
            Claim Winnings
          </Link>
        </div>
      </div>
    </div>
  );
}
