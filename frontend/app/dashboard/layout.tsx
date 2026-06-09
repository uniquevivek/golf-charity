'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Target,
  Heart,
  Award,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Coins,
  Menu,
  X,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#090d16] flex flex-col items-center justify-center gap-4 z-50">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Route guard in progress
  }

  const sidebarLinks = [
    { label: 'Overview', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Golf Scores', href: '/dashboard/scores', icon: <Target size={18} /> },
    { label: 'Charity Pick', href: '/dashboard/charity', icon: <Heart size={18} /> },
    { label: 'Monthly Draws', href: '/dashboard/draws', icon: <TrendingUp size={18} /> },
    { label: 'My Winnings', href: '/dashboard/winnings', icon: <Award size={18} /> },
    { label: 'Billing Settings', href: '/dashboard/settings', icon: <Settings size={18} /> },
    { label: 'Payment Testing', href: '/dashboard/test-payment', icon: <Coins size={18} /> },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/40 border-r border-border p-6 flex-shrink-0">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white mb-8">
          <span className="p-1.5 rounded bg-primary/20 text-primary">🏆</span>
          <span>GolfCharity</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive(link.href)
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="pt-6 border-t border-border mt-auto flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold border border-primary/20">
              {user?.email?.[0]?.toUpperCase() || ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.fullName || user?.email?.split('@')[0] || ''}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all w-full text-left"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="glass border-b border-border py-4 px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-muted-foreground hover:text-white"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold">
              {sidebarLinks.find((l) => isActive(l.href))?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-white/5 transition-all"
            >
              Go to Website
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden">
            <div className="w-64 h-full glass border-r border-border p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <span className="p-1 rounded bg-primary/20 text-primary">🏆</span>
                    <span>GolfCharity</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <nav className="space-y-1">
                  {sidebarLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive(link.href)
                          ? 'bg-primary text-black'
                          : 'text-muted-foreground hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all w-full"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
