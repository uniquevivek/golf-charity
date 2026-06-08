'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/api';
import { Heart, Search, Award, Check, AlertCircle, Percent } from 'lucide-react';

interface Charity {
  id: string;
  name: string;
  description: string;
  image: string;
  website: string | null;
  featured: boolean;
}

export default function UserCharityPage() {
  const { user, updateUserFields } = useAuthStore();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Donation percentage state
  const [pct, setPct] = useState(user?.donationPercentage || 10);

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const data = await api.get('/charities');
      setCharities(data);
    } catch (err: any) {
      setError('Failed to fetch charities list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharities();
    if (user) {
      setPct(user.donationPercentage);
    }
  }, [user]);

  const handleSelectCharity = async (charityId: string) => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await api.post('/charities/select', { charityId });
      updateUserFields({
        selectedCharityId: charityId,
        selectedCharity: charities.find((c) => c.id === charityId) || null,
      });
      setSuccess('Charity selection updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update charity selection');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePercentage = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/charities/percentage', { donationPercentage: pct });
      updateUserFields({ donationPercentage: pct });
      setSuccess('Donation percentage updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update donation percentage');
    } finally {
      setUpdating(false);
    }
  };

  const filteredCharities = charities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Settings Box */}
        <div className="glass p-6 rounded-2xl border border-border space-y-6 h-fit">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Heart className="text-primary" size={20} />
            My Contribution Settings
          </h2>

          {/* Current Selection Summary */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Currently Supporting</p>
            <p className="text-sm font-bold text-white">
              {user?.selectedCharity?.name || 'Baseline Donation Pool'}
            </p>
            <p className="text-xs text-muted-foreground leading-normal">
              If no charity is selected, your portion will be distributed evenly among all registered partners.
            </p>
          </div>

          {/* Slider Form */}
          <form onSubmit={handleUpdatePercentage} className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Donation Percentage</span>
                <span className="text-primary font-bold">{pct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={pct}
                onChange={(e) => setPct(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>10% (Min)</span>
                <span>50%</span>
                <span>100% (Max)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
            >
              {updating ? (
                <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin"></span>
              ) : (
                'Save Settings'
              )}
            </button>
          </form>
        </div>

        {/* Directory Selector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">Vetted Vetting Registry</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#111827]/40 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((n) => (
                <div key={n} className="glass h-32 rounded-xl border border-border"></div>
              ))}
            </div>
          ) : filteredCharities.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl border border-border text-muted-foreground">
              No charities found matching search.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCharities.map((charity) => {
                const isSelected = user?.selectedCharityId === charity.id;
                return (
                  <div
                    key={charity.id}
                    className={`glass-card p-5 rounded-2xl border flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between transition-all ${
                      isSelected ? 'border-primary/40 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex gap-4 items-start sm:items-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                        <img
                          src={charity.image}
                          alt={charity.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{charity.name}</h3>
                          {charity.featured && (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {charity.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectCharity(charity.id)}
                      disabled={updating || isSelected}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold w-full sm:w-auto transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-primary/20 text-primary border border-primary/30 cursor-default'
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={14} />
                          Selected
                        </>
                      ) : (
                        'Support Partner'
                      )}
                    </button>
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
