'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Award, UploadCloud, Check, AlertCircle, Eye, CreditCard } from 'lucide-react';

interface Winner {
  id: string;
  matchCount: number;
  prizeAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  proofImage: string | null;
  draw: {
    month: number;
    year: number;
    drawNumbers: number[];
  };
}

export default function UserWinningsPage() {
  const [winnings, setWinnings] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchWinnings = async () => {
    setLoading(true);
    try {
      const data = await api.get('/winners/me');
      setWinnings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve winnings records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinnings();
  }, []);

  const handleUploadProof = async (winnerId: string, file: File) => {
    setUploadingId(winnerId);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('proofImage', file);

    try {
      await api.post(`/winners/${winnerId}/proof`, formData);
      setSuccess('Scorecard proof uploaded successfully! Awaiting review.');
      fetchWinnings();
    } catch (err: any) {
      setError(err.message || 'Failed to upload scorecard proof.');
    } finally {
      setUploadingId(null);
    }
  };

  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Awaiting Payout
          </span>
        );
      case 'PAID':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-primary border border-emerald-500/20">
            Paid ✅
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            Rejected ❌
          </span>
        );
      default:
        return null;
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

      {/* Header Info */}
      <div className="glass p-6 rounded-2xl border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="text-primary" size={20} />
            My Claims Registry
          </h2>
          <p className="text-xs text-muted-foreground leading-normal max-w-xl">
            To claim prize payouts for matching draws, upload a clear photo of your verified scorecard. Administrators audit submissions before releasing funds.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((n) => (
            <div key={n} className="glass h-32 rounded-2xl border border-border"></div>
          ))}
        </div>
      ) : winnings.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl border border-border text-muted-foreground">
          No winning records found. You will receive entries here as soon as you match 3 or more scores in a published draw!
        </div>
      ) : (
        <div className="space-y-4">
          {winnings.map((item) => (
            <div
              key={item.id}
              className="glass-card p-6 rounded-3xl border border-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              {/* Summary */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {getMonthName(item.draw.month)} {item.draw.year} Draw
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                    {item.matchCount} Matches
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    ${item.prizeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground">Cash Prize</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                <div className="w-full sm:w-auto text-left sm:text-right space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Payout Status</p>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Proof Actions */}
                <div className="w-full sm:w-auto flex gap-3">
                  {item.proofImage ? (
                    <a
                      href={item.proofImage}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl border border-border bg-[#111827]/40 text-muted-foreground hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-semibold w-full sm:w-auto"
                    >
                      <Eye size={16} />
                      View Scorecard
                    </a>
                  ) : (
                    <label className="p-3 rounded-xl bg-primary text-black font-bold hover:bg-primary/95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto text-center">
                      {uploadingId === item.id ? (
                        <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin"></span>
                      ) : (
                        <>
                          <UploadCloud size={16} />
                          Upload Scorecard
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadProof(item.id, file);
                        }}
                        className="hidden"
                        disabled={uploadingId !== null}
                      />
                    </label>
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
