import React from 'react';
import { Shield, Sparkles, User, RefreshCw, BarChart2 } from 'lucide-react';

export default function AboutPage() {
  const cards = [
    {
      icon: <Shield className="text-primary" size={24} />,
      title: 'Vetted & Verified Charities',
      description: 'We collaborate strictly with legally registered, high-impact non-profit organizations. 100% of your charity percentage reaches the chosen organization.',
    },
    {
      icon: <Sparkles className="text-primary" size={24} />,
      title: 'Transparent Draw Engine',
      description: 'Our monthly draws run transparently in two modes: pure random selection, or analytical selection based on statistical score distributions.',
    },
    {
      icon: <RefreshCw className="text-primary" size={24} />,
      title: 'Jackpot Rollovers',
      description: 'If no subscriber achieves a full 5-match score in a month, the 40% cash allocation rolls over directly, fueling massive future pools.',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white">About Our Platform</h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          GolfCharity was built to combine the global community of casual and competitive golfers with direct, transparent funding for global non-profits. We believe play and purpose belong together.
        </p>
      </div>

      {/* Grid Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, idx) => (
          <div key={idx} className="glass-card p-8 rounded-2xl space-y-4">
            <div className="p-3 bg-primary/10 w-fit rounded-xl border border-primary/20">
              {card.icon}
            </div>
            <h3 className="text-xl font-bold text-white">{card.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Detailed Splits and Logic */}
      <div className="glass p-8 md:p-12 rounded-3xl border border-border grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white">The Flow of Funds</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Unlike traditional sweepstakes where corporate margins consume the pool, our model operates with absolute transparency:
          </p>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Monthly / Yearly Subscription</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Golfers select a monthly ($29) or yearly ($290) subscription. 50% of the funds enter the prize pool directly, and the other 50% goes to selected charities.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Custom Charity Allocation</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Subscribers determine exactly how much of their subscription goes directly to their selected charity (minimum 10% contribution, customizable up to 100%).
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Monthly Prize Distribution</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  At the end of the month, 5 numbers are selected. Winners upload verified scorecards to prove their rounds and receive payouts directly to their linked accounts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Graph Mock */}
        <div className="glass p-8 rounded-2xl border border-white/5 space-y-6">
          <h3 className="text-lg font-bold text-white">Prize Pool Distribution</h3>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">5-Match (Jackpot)</span>
              <span className="font-mono text-primary font-bold">40% Pool</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-2 rounded-full" style={{ width: '40%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-300">4-Match category</span>
              <span className="font-mono text-primary font-bold">35% Pool</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-300">3-Match category</span>
              <span className="font-mono text-primary font-bold">25% Pool</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
