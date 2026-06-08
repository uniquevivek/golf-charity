'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';
import { TrendingUp, Sparkles, Play, ShieldAlert, Award, Calendar, Check, AlertCircle } from 'lucide-react';

interface WinnerSim {
  fullName: string | null;
  email: string;
  matchCount: number;
  prizeAmount: number;
}

interface SimResult {
  drawNumbers: number[];
  prizePool: {
    totalPool: number;
    charityPool: number;
    playersPool: number;
    match5Pool: number;
    match4Pool: number;
    match3Pool: number;
    rolloverAmount: number;
    finalMatch5Pool: number;
  };
  stats: {
    totalParticipants: number;
    match5Count: number;
    match4Count: number;
    match3Count: number;
  };
  payouts: {
    match5PrizeEach: number;
    match4PrizeEach: number;
    match3PrizeEach: number;
  };
  winners: WinnerSim[];
}

export default function AdminDrawsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [mode, setMode] = useState<'RANDOM' | 'MOST_FREQUENT' | 'LEAST_FREQUENT'>('RANDOM');

  // Preview / Sim State
  const [drawNumbers, setDrawNumbers] = useState<number[]>([]);
  const [simulation, setSimulation] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishedToggle, setPublishedToggle] = useState(true);

  const handleGenerateNumbers = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post('/draws/generate-numbers', { mode });
      setDrawNumbers(res.drawNumbers);
      setSimulation(null); // Clear outdated simulation
    } catch (err: any) {
      setError(err.message || 'Failed to generate draw numbers');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (drawNumbers.length !== 5) {
      setError('Please generate draw numbers first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post('/draws/simulate', {
        month,
        year,
        drawNumbers,
      });
      setSimulation(res);
    } catch (err: any) {
      setError(err.message || 'Failed to simulate draw details');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDraw = async () => {
    if (drawNumbers.length !== 5) {
      setError('Please generate and confirm draw numbers first');
      return;
    }

    if (!confirm(`Are you sure you want to execute and write this draw for ${month}/${year}? This action is irreversible.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/draws/execute', {
        month,
        year,
        drawNumbers,
        published: publishedToggle,
      });
      setSuccess('Draw successfully executed, winners registered, and details saved.');
      setSimulation(null);
      setDrawNumbers([]);
    } catch (err: any) {
      setError(err.message || 'Failed to execute and save draw');
    } finally {
      setLoading(false);
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
        {/* Draw Controls */}
        <div className="glass p-6 rounded-2xl border border-border h-fit space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-amber-500" size={20} />
            Draw Settings
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className="w-full bg-[#111827]/40 border border-border rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(0, m - 1).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="w-full bg-[#111827]/40 border border-border rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Drawing Algorithm Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full bg-[#111827]/40 border border-border rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="RANDOM">RANDOM (Math.random)</option>
                <option value="MOST_FREQUENT">MOST FREQUENT (statistical high)</option>
                <option value="LEAST_FREQUENT">LEAST FREQUENT (statistical low)</option>
              </select>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-3">
              <button
                onClick={handleGenerateNumbers}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/5 flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                Generate Draw Numbers
              </button>

              <button
                onClick={handleSimulate}
                disabled={loading || drawNumbers.length === 0}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-border text-xs font-bold flex items-center justify-center gap-2"
              >
                <Play size={14} />
                Run Draw Simulation
              </button>
            </div>
          </div>
        </div>

        {/* Console & Simulator Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Numbers Box */}
          <div className="glass p-6 rounded-2xl border border-border space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Draw Numbers
            </h3>
            {drawNumbers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No numbers generated yet.</p>
            ) : (
              <div className="flex gap-2">
                {drawNumbers.map((n, i) => (
                  <span
                    key={i}
                    className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm flex items-center justify-center"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Simulation Output */}
          {simulation && (
            <div className="glass p-6 rounded-3xl border border-border space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Simulation Outputs ({month}/{year})
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="publish-check"
                      checked={publishedToggle}
                      onChange={(e) => setPublishedToggle(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-border"
                    />
                    <label htmlFor="publish-check" className="font-semibold text-slate-300 cursor-pointer">
                      Publish immediately
                    </label>
                  </div>
                  <button
                    onClick={handleExecuteDraw}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400"
                  >
                    Execute & Save
                  </button>
                </div>
              </div>

              {/* Pool and Winners Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                  <p className="text-muted-foreground">Subscriber pool</p>
                  <p className="text-base font-bold text-white mt-1">
                    ${simulation.prizePool.totalPool.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                  <p className="text-muted-foreground">Players share</p>
                  <p className="text-base font-bold text-white mt-1">
                    ${simulation.prizePool.playersPool.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                  <p className="text-muted-foreground">Match 5 share (inc rollover)</p>
                  <p className="text-base font-bold text-white mt-1">
                    ${simulation.prizePool.finalMatch5Pool.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                  <p className="text-muted-foreground">Total simulated participants</p>
                  <p className="text-base font-bold text-white mt-1">
                    {simulation.stats.totalParticipants} golfers
                  </p>
                </div>
              </div>

              {/* simulated winners */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-white">Simulated Winners List ({simulation.winners.length})</h4>
                {simulation.winners.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No golfers matched 3 or more numbers in this draw.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {simulation.winners.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{w.fullName || w.email.split('@')[0]}</p>
                          <p className="text-[10px] text-muted-foreground">{w.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-400">${w.prizeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          <p className="text-[9px] text-muted-foreground">{w.matchCount} Matches</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
