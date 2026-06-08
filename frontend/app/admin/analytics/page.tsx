'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Users, Heart, Award, Coins, BarChart2, ShieldAlert } from 'lucide-react';

interface StatsCards {
  totalUsers: number;
  activeSubscribers: number;
  totalPrizePool: number;
  totalDonations: number;
  drawStatistics: number;
}

interface ChartData {
  name: string;
  revenue?: number;
  count?: number;
  donations?: number;
}

interface AnalyticsData {
  cards: StatsCards;
  charts: {
    monthlyRevenue: ChartData[];
    subscriptionGrowth: ChartData[];
    donationTrends: ChartData[];
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/admin/analytics');
        setData(response);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve admin analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass h-28 rounded-2xl border border-border"></div>
          ))}
        </div>
        <div className="glass h-80 rounded-3xl border border-border"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
        ⚠️ {error || 'No analytics data returned from server'}
      </div>
    );
  }

  const { cards, charts } = data;

  const cardList = [
    { label: 'Total Users Registered', value: cards.totalUsers, icon: <Users size={20} className="text-blue-400" /> },
    { label: 'Active Paid Subscribers', value: cards.activeSubscribers, icon: <ShieldAlert size={20} className="text-emerald-400" /> },
    { label: 'Player Prize Pool Pool', value: `$${cards.totalPrizePool.toLocaleString()}`, icon: <Coins size={20} className="text-amber-400" /> },
    { label: 'Total Donations Raised', value: `$${cards.totalDonations.toLocaleString()}`, icon: <Heart size={20} className="text-rose-400" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardList.map((c, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-black text-white">{c.value}</p>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              {c.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Visual Analytics Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trends */}
        <div className="glass p-8 rounded-3xl border border-border space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="text-amber-400" size={18} />
            Monthly Revenue Trends
          </h3>

          {charts.monthlyRevenue.length === 0 ? (
            <p className="text-xs text-muted-foreground py-12 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {charts.monthlyRevenue.map((item, idx) => {
                const maxVal = Math.max(...charts.monthlyRevenue.map((r) => r.revenue || 1));
                const percent = ((item.revenue || 0) / maxVal) * 100;
                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-white">${item.revenue?.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-3 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Charity Donation Trends */}
        <div className="glass p-8 rounded-3xl border border-border space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Heart className="text-rose-400" size={18} />
            Charity Donation Trends
          </h3>

          {charts.donationTrends.length === 0 ? (
            <p className="text-xs text-muted-foreground py-12 text-center">No charity allocations recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {charts.donationTrends.map((item, idx) => {
                const maxVal = Math.max(...charts.donationTrends.map((r) => r.donations || 1));
                const percent = ((item.donations || 0) / maxVal) * 100;
                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-white">${item.donations?.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-pink-500 h-3 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
