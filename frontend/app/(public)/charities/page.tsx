'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { Search, Globe, Award, Sparkles } from 'lucide-react';

interface Charity {
  id: string;
  name: string;
  description: string;
  image: string;
  website: string | null;
  featured: boolean;
}

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharities = async () => {
      setLoading(true);
      setError(null);
      try {
        let path = '/charities';
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (featuredOnly) params.append('featured', 'true');
        
        if (params.toString()) {
          path += `?${params.toString()}`;
        }

        const data = await api.get(path);
        setCharities(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load charities. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search input
    const delayDebounce = setTimeout(() => {
      fetchCharities();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, featuredOnly]);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16 space-y-8">
      {/* Title */}
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-black text-white">Vetted Non-Profits</h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Select which charity receives your platform donations. Propose custom donation amounts and support vetted initiatives.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full glass p-4 rounded-2xl border border-border">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3.5 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search charities by name or cause..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827]/60 border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Featured Filter */}
        <button
          onClick={() => setFeaturedOnly(!featuredOnly)}
          className={`px-5 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 w-full sm:w-auto justify-center transition-all ${
            featuredOnly
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-border bg-[#111827]/40 text-muted-foreground hover:text-white'
          }`}
        >
          <Sparkles size={16} />
          Featured Only
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Grid Results */}
      {loading ? (
        // Loading Skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass p-6 rounded-3xl border border-border animate-pulse space-y-6">
              <div className="w-full h-48 bg-slate-800 rounded-2xl"></div>
              <div className="space-y-3">
                <div className="h-6 bg-slate-800 rounded w-2/3"></div>
                <div className="h-4 bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : charities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No charities found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {charities.map((charity) => (
            <div
              key={charity.id}
              className="glass-card p-6 rounded-3xl border border-border flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="w-full h-48 rounded-2xl overflow-hidden relative mb-5 bg-slate-800">
                  <img
                    src={charity.image}
                    alt={charity.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {charity.featured && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
                      <Award size={10} />
                      Featured
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{charity.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                  {charity.description}
                </p>
              </div>

              {/* Action Links */}
              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="flex items-center gap-1 text-[11px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10 uppercase tracking-wider">
                  Vetted Partner
                </div>
                {charity.website && (
                  <a
                    href={charity.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Globe size={14} />
                    Visit Site
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
