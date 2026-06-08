'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Award, Eye, Check, X, CreditCard, AlertCircle } from 'lucide-react';

interface WinnerRecord {
  id: string;
  matchCount: number;
  prizeAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  proofImage: string | null;
  createdAt: string;
  user: {
    fullName: string | null;
    email: string;
  };
  draw: {
    month: number;
    year: number;
    drawNumbers: number[];
  };
}

export default function AdminWinnersPage() {
  const [claims, setClaims] = useState<WinnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      let path = '/admin/winners';
      if (statusFilter) path += `?status=${statusFilter}`;
      const data = await api.get(path);
      setClaims(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve winning claims list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'pay') => {
    setProcessingId(id);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = `/admin/winners/${id}/${action}`;
      const res = await api.post(endpoint);
      setSuccess(res.message || `Claim successfully update: ${action}`);
      fetchClaims();
    } catch (err: any) {
      setError(err.message || 'Action execution failed');
    } finally {
      setProcessingId(null);
    }
  };

  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'short' });
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

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-4 flex-wrap">
        {['PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statusFilter === status
                ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'text-muted-foreground hover:text-white bg-white/5 border border-white/5'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((n) => (
            <div key={n} className="glass h-32 rounded-2xl border border-border"></div>
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl border border-border text-muted-foreground text-sm">
          No winning claims found in state: {statusFilter}.
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="glass-card p-6 rounded-3xl border border-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              {/* Info Column */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">
                    {claim.user.fullName || 'No Name synced'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">({claim.user.email})</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-primary/10 text-primary rounded">
                    {claim.matchCount} Matches
                  </span>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">
                    ${claim.prizeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    from {getMonthName(claim.draw.month)} {claim.draw.year} draw
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                {/* Proof scorecard viewer */}
                {claim.proofImage ? (
                  <a
                    href={claim.proofImage}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl border border-border bg-[#111827]/40 text-muted-foreground hover:text-white text-xs font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Eye size={14} />
                    View scorecard
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground italic px-3 py-2">
                    No scorecard proof uploaded yet
                  </span>
                )}

                {/* Status-specific action buttons */}
                <div className="flex gap-2 w-full sm:w-auto">
                  {claim.status === 'PENDING' && claim.proofImage && (
                    <>
                      <button
                        onClick={() => handleAction(claim.id, 'reject')}
                        disabled={processingId !== null}
                        className="flex-1 sm:flex-initial px-3.5 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(claim.id, 'approve')}
                        disabled={processingId !== null}
                        className="flex-1 sm:flex-initial px-3.5 py-3 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-bold"
                      >
                        Approve
                      </button>
                    </>
                  )}

                  {claim.status === 'APPROVED' && (
                    <button
                      onClick={() => handleAction(claim.id, 'pay')}
                      disabled={processingId !== null}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 text-xs flex items-center justify-center gap-2"
                    >
                      <CreditCard size={14} />
                      Release Payout
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
