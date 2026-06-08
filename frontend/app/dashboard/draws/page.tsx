'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { TrendingUp, Target, Calendar, CheckCircle2, XCircle, Gift } from 'lucide-react';

interface Draw {
  id: string;
  month: string;
  year: number;
  drawNumbers: number[];
  drawType: string;
  createdAt: string;
}

interface Score {
  score: number;
}

export default function UserDrawsPage() {
  const { user } = useAuthStore();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const publishedDraws = await api.get('/draws');
        setDraws(publishedDraws);

        const scoreHistory = await api.get('/scores').catch(() => []);
        setScores(scoreHistory.map((s: Score) => s.score));
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve draws history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getMonthName = (monthNum: any) => {
    const date = new Date();
    date.setMonth(parseInt(monthNum, 10) - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* active card stats */}
      <div className="glass p-6 rounded-2xl border border-border space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Target className="text-primary" size={20} />
          My Current Golf Card (Active Ticket)
        </h2>
        <p className="text-xs text-muted-foreground">
          The monthly draws match your 5 most recent golf score submissions. Ensure your card is complete!
        </p>
        
        {scores.length === 0 ? (
          <p className="text-sm text-amber-500">
            ⚠️ No scores logged. Log exactly 5 scores to form your draw ticket!
          </p>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {scores.map((num, i) => (
              <span
                key={i}
                className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-lg flex items-center justify-center shadow-inner"
              >
                {num}
              </span>
            ))}
            {scores.length < 5 && (
              <div className="flex items-center text-xs text-amber-400 ml-2">
                ⚠️ Complete card ({scores.length}/5 scores logged)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Draw Logs */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-primary" size={20} />
          Published Draw Results
        </h2>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((n) => (
              <div key={n} className="glass h-36 rounded-2xl border border-border"></div>
            ))}
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl border border-border text-muted-foreground">
            No draw results have been published yet for this cycle.
          </div>
        ) : (
          <div className="space-y-6">
            {draws.map((draw) => {
              // Calculate matching count
              const matches = scores.filter((score) => draw.drawNumbers.includes(score));
              const matchCount = matches.length;

              return (
                <div
                  key={draw.id}
                  className={`glass-card p-6 rounded-3xl border flex flex-col md:flex-row justify-between gap-6 items-start md:items-center ${
                    matchCount >= 3 ? 'border-primary/40 bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="text-primary" size={16} />
                      <h3 className="text-base font-bold text-white">
                        {getMonthName(draw.month)} {draw.year}
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/5">
                        {draw.drawType.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Draw Numbers */}
                    <div className="flex gap-2">
                      {draw.drawNumbers.map((num, i) => {
                        const isMatched = scores.includes(num);
                        return (
                          <span
                            key={i}
                            className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center border transition-all ${
                              isMatched
                                ? 'bg-primary text-black border-primary font-black scale-105'
                                : 'bg-[#111827]/40 border-border text-muted-foreground'
                            }`}
                            title={isMatched ? 'Matching Number!' : 'Draw Number'}
                          >
                            {num}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Match Evaluation Callout */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 w-full md:w-auto">
                    {matchCount >= 3 ? (
                      <>
                        <CheckCircle2 className="text-primary flex-shrink-0" size={20} />
                        <div>
                          <p className="text-xs font-bold text-white">Matched {matchCount} Numbers!</p>
                          <p className="text-[10px] text-muted-foreground">
                            Claim rewards on the **My Winnings** page.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="text-muted-foreground flex-shrink-0" size={20} />
                        <div>
                          <p className="text-xs font-semibold text-slate-300">
                            {matchCount === 0 ? 'No matches' : `Matched ${matchCount} number${matchCount > 1 ? 's' : ''}`}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Requires 3+ matches to win.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
