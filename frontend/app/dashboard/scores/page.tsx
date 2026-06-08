'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Target, Calendar, Trash2, Plus, AlertCircle } from 'lucide-react';

interface Score {
  id: string;
  score: number;
  scoreDate: string;
  createdAt: string;
}

export default function ScoresPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [scoreVal, setScoreVal] = useState('');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const data = await api.get('/scores');
      setScores(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load scores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const parsedScore = parseInt(scoreVal, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 45) {
      setError('Score must be an integer between 1 and 45');
      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/scores', {
        score: parsedScore,
        scoreDate: new Date(dateVal).toISOString(),
      });
      setScores(response.scores || []);
      setScoreVal('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit score.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteScore = async (id: string) => {
    if (!confirm('Are you sure you want to delete this score?')) return;
    
    setError(null);
    try {
      await api.delete(`/scores/${id}`);
      setScores(scores.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete score.');
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Score Form Box */}
        <div className="glass p-6 rounded-2xl border border-border space-y-6 h-fit">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="text-primary" size={20} />
            Add New Score
          </h2>
          
          <form onSubmit={handleAddScore} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Golf Score (1 - 45)</label>
              <div className="relative">
                <Target className="absolute left-4 top-3.5 text-muted-foreground" size={16} />
                <input
                  type="number"
                  min="1"
                  max="45"
                  required
                  placeholder="e.g. 18"
                  value={scoreVal}
                  onChange={(e) => setScoreVal(e.target.value)}
                  className="w-full bg-[#111827]/40 border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Round Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 text-muted-foreground" size={16} />
                <input
                  type="date"
                  required
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="w-full bg-[#111827]/40 border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin"></span>
              ) : (
                'Add Score'
              )}
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground leading-normal">
            ⚠️ **Note:** We only retain your 5 most recent scores. If you submit a 6th score, the oldest submission (by game date) will be automatically deleted.
          </p>
        </div>

        {/* Score History Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Active Round History</h2>
            <span className="text-xs font-semibold text-muted-foreground">
              Submitted: <span className="text-white font-bold">{scores.length} / 5</span>
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="glass p-6 rounded-xl border border-border animate-pulse h-24"></div>
              ))}
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl border border-border text-muted-foreground">
              No scores recorded yet. Submit your first score to build your history.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scores.map((score, index) => (
                <div
                  key={score.id}
                  className="glass-card p-6 rounded-2xl border border-border flex items-center justify-between group"
                >
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Round #{scores.length - index}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{score.score}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(score.scoreDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteScore(score.id)}
                    className="p-2.5 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                    title="Delete Score"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
