'use client';

import { useEffect } from 'react';
import supabase from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, fetchProfile, isLoading } = useAuthStore();

  useEffect(() => {
    // 1. Check current session on load
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session.access_token, null); // Set token, fetch profile will fill user
          await fetchProfile();
        } else {
          setSession(null, null);
        }
      } catch (err) {
        console.error('Failed to initialize auth session:', err);
        setSession(null, null);
      }
    };

    initializeAuth();

    // 2. Listen for session changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setSession(session.access_token, null);
          await fetchProfile();
        } else {
          setSession(null, null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, fetchProfile]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#090d16] flex flex-col items-center justify-center gap-4 z-50">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Synchronizing secure credentials...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
