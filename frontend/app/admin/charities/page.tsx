'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Heart, Plus, Edit2, Trash2, Check, AlertCircle, Globe } from 'lucide-react';

interface Charity {
  id: string;
  name: string;
  description: string;
  image: string;
  website: string | null;
  featured: boolean;
}

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [website, setWebsite] = useState('');
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const data = await api.get('/charities');
      setCharities(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve charities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharities();
  }, []);

  const handleEditClick = (c: Charity) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description);
    setImage(c.image);
    setWebsite(c.website || '');
    setFeatured(c.featured);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImage('');
    setWebsite('');
    setFeatured(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name,
      description,
      image: image || undefined,
      website: website || null,
      featured,
    };

    try {
      if (editingId) {
        await api.put(`/charities/${editingId}`, payload);
        setSuccess('Charity profile updated successfully!');
      } else {
        await api.post('/charities', payload);
        setSuccess('New charity partner created successfully!');
      }

      handleCancelEdit();
      fetchCharities();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCharity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this charity? All active users selecting this charity will default to the baseline pool.')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/charities/${id}`);
      setSuccess('Charity profile deleted.');
      setCharities(charities.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete charity.');
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
        {/* List Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Heart className="text-amber-500" size={20} />
            Partner Charity Registry
          </h2>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((n) => (
                <div key={n} className="glass h-24 rounded-2xl border border-border"></div>
              ))}
            </div>
          ) : charities.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl border border-border text-muted-foreground text-sm">
              No charities profiles registered.
            </div>
          ) : (
            <div className="space-y-3">
              {charities.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-4 rounded-xl border border-border flex items-center justify-between gap-4 group"
                >
                  <div className="flex gap-4 items-center min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{item.name}</span>
                        {item.featured && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-2 rounded bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10"
                      title="Edit Profile"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCharity(item.id)}
                      className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                      title="Delete Profile"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit Form Box */}
        <div className="glass p-6 rounded-2xl border border-border h-fit">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            {editingId ? (
              <>
                <Edit2 className="text-amber-500" size={18} />
                Edit Profile
              </>
            ) : (
              <>
                <Plus className="text-amber-500" size={18} />
                Add Vetted Charity
              </>
            )}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Charity Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Save Our Oceans"
                className="w-full bg-[#111827]/40 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Description</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Core mission statement..."
                className="w-full bg-[#111827]/40 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Photo URL</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#111827]/40 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.org"
                className="w-full bg-[#111827]/40 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="featured-check"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary bg-[#111827]/60 focus:ring-0"
              />
              <label htmlFor="featured-check" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                Featured Partner
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs text-slate-300 font-bold hover:bg-white/5"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all"
              >
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Partner'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
