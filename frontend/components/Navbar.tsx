'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { GolfBallIcon } from './Icons'; // custom icon helper
import { Award, ShieldAlert, LogOut, User as UserIcon, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Charities', href: '/charities' },
    { label: 'Pricing', href: '/pricing' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border w-full py-4 px-6 md:px-12 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white group">
        <span className="p-2 rounded-lg bg-primary/20 text-primary group-hover:bg-primary group-hover:text-black transition-all">
          🏆
        </span>
        <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          GolfCharity
        </span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Auth Controls */}
      <div className="hidden md:flex items-center gap-4">
        {isAuthenticated && user ? (
          <>
            {user.role === 'ADMIN' && (
              <Link
                href="/admin/analytics"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
              >
                <ShieldAlert size={14} />
                Admin Panel
              </Link>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-black hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <button
              onClick={() => logout()}
              className="p-2 rounded-lg border border-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 transition-all"
            >
              Register
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 text-muted-foreground hover:text-white"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-[73px] left-0 right-0 glass border-b border-border flex flex-col p-6 gap-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-lg font-medium ${
                isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="h-[1px] bg-border my-2"></div>
          {isAuthenticated ? (
            <div className="flex flex-col gap-3">
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20"
                >
                  <ShieldAlert size={16} />
                  Admin Panel
                </Link>
              )}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 bg-primary text-black rounded-lg"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-medium py-2.5 text-muted-foreground hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-semibold py-2.5 bg-white/10 text-white border border-white/10 rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
