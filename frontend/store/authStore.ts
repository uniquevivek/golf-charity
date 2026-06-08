import { create } from 'zustand';
import supabase from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  fullName: string | null;
  avatar: string | null;
  donationPercentage: number;
  selectedCharityId: string | null;
  selectedCharity?: {
    id: string;
    name: string;
    description: string;
    image: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setSession: (token: string | null, userProfile: UserProfile | null) => void;
  fetchProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  updateUserFields: (fields: Partial<UserProfile>) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setSession: (token, userProfile) => {
    set({
      token,
      user: userProfile,
      isAuthenticated: !!token && !!userProfile,
      isLoading: false,
      error: null,
    });
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    const { token } = get();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch user profile from backend');
      }

      const userProfile: UserProfile = await res.json();
      set({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false,
      });
      return userProfile;
    } catch (err: any) {
      console.error('fetchProfile error:', err);
      set({ error: err.message || 'Profile sync failed', isLoading: false });
      return null;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase sign out error:', err);
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  updateUserFields: (fields) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: { ...currentUser, ...fields },
      });
    }
  },
}));
