'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Mail, Lock, ShieldCheck, AlertCircle, LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign in via Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        // 2. Fetch the user profile from database via global authStore
        const profile = await useAuthStore.getState().fetchProfile();
        
        if (profile && profile.role === 'ADMIN') {
          // 3. Admin authenticated -> redirect to admin dashboard
          router.push('/admin/analytics');
        } else {
          // 4. Access Denied -> log out and show error
          await useAuthStore.getState().logout();
          setError('Access denied: You do not have administrator privileges.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090d16] flex items-center justify-center px-6 py-16 text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/10 via-[#090d16] to-[#090d16]">
      <div className="w-full max-w-md glass p-8 rounded-3xl border border-amber-500/10 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-500 mb-2">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin Portal</h2>
          <p className="text-sm text-muted-foreground">
            Sign in to manage draws, winners, and charities.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-muted-foreground" size={16} />
              <input
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111827]/40 border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-muted-foreground" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111827]/40 border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin"></span>
            ) : (
              <>
                <LogIn size={18} />
                Access Dashboard
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Regular player?{' '}
          <Link href="/login" className="text-amber-500 hover:underline font-bold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
