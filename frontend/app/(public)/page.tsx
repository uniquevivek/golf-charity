'use client';

import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { Target, Heart, Award, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  const stats = [
    { label: 'Total Rollover Jackpot', value: '$84,250', desc: '5-match target pool', highlight: true },
    { label: 'Donations Raised', value: '$124,800', desc: 'Sent directly to charities', highlight: false },
    { label: 'Active Golfers', value: '4,820', desc: 'Subscribed players', highlight: false },
    { label: 'Next Monthly Draw', value: 'June 30', desc: '5 numbers drawn (1-45)', highlight: false },
  ];

  const steps = [
    {
      icon: <Zap className="text-primary" size={24} />,
      title: '1. Subscribe & Select',
      description: 'Choose a monthly or yearly plan. Select which vetted charity receives your custom contribution percentage (min 10%).',
    },
    {
      icon: <Target className="text-primary" size={24} />,
      title: '2. Log Your Scores',
      description: 'Enter your latest 5 golf scores (validated 1 to 45). The system automatically tracks your 5 most recent rounds.',
    },
    {
      icon: <Award className="text-primary" size={24} />,
      title: '3. Match & Win',
      description: 'Every month, 5 numbers are drawn. Match 3, 4, or 5 scores with the draw numbers to win equal splits of the cash prize pool.',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto pt-20 pb-16 px-6 md:px-12 text-center flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary animate-pulse">
          ⚡ Modern Philanthropy Meets Golf
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-white leading-tight">
          Where Passion for Golf
          <span className="block bg-gradient-to-r from-primary via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Fuels Global Impact
          </span>
        </h1>

        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mt-2">
          Subscribe, select your cause, log your scores, and enter the monthly prize draw. Win rewards while donating up to 100% of your contribution to charity.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-black font-bold text-lg hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all"
          >
            Get Started
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 rounded-xl border border-border hover:bg-white/5 font-semibold text-lg text-white transition-all"
          >
            Learn How It Works
          </Link>
        </div>
      </section>

      {/* Live Stats Grid */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`glass-card p-6 rounded-2xl flex flex-col justify-between ${
                stat.highlight ? 'border-primary/30 bg-primary/5 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : ''
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                <p className={`text-3xl font-black mt-2 ${stat.highlight ? 'text-primary' : 'text-white'}`}>
                  {stat.value}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-20 border-y border-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white">Platform Mechanics</h2>
          <p className="text-muted-foreground mt-4 text-sm md:text-base">
            Participating is simple. We bridge your weekend golf rounds with transparent, secure cash pools and direct charitable donations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="glass-card p-8 rounded-2xl space-y-4">
              <div className="p-3 bg-primary/10 w-fit rounded-xl border border-primary/20">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Draw Rules Overview */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-primary border border-emerald-500/20 text-xs font-semibold w-fit">
              🏆 Prize Distribution Rules
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Fair, Transparent & Audited Payouts
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Every subscriber can maintain up to 5 scores. When the monthly draw occurs, the prize pool is distributed based on the percentage of matching numbers:
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-white">5 Matches (40%):</span> Shared equally. Rolls over to next month if unclaimed.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-white">4 Matches (35%):</span> Shared equally among all 4-match entries.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-white">3 Matches (25%):</span> Shared equally among all 3-match entries.
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border border-border space-y-6">
            <h3 className="text-2xl font-bold text-white">Monthly Revenue Split</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Charity & Operations</span>
                  <span className="text-primary">50%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Draw Prize Pool</span>
                  <span className="text-primary">50%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
              <ShieldCheck className="text-primary flex-shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                All winning claims require proof of scorecard upload. Proof of score is subject to review by board administrators before payouts are released.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-24">
        <div className="glass p-12 md:p-16 rounded-3xl border border-border text-center space-y-6 flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-black text-white max-w-2xl">
            Ready to Play with Purpose?
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg">
            Join thousands of golfers worldwide transforming their standard weekend rounds into real charitable donations and monthly rewards.
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-black font-bold text-lg hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
          >
            Create Your Account
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
