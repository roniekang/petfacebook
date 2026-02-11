'use client';

import { create } from 'zustand';
import { apiClient, setTokens, clearTokens } from '@/lib/api-client';
import type { Guardian } from '@pettopia/types';

interface AuthState {
  guardian: Guardian | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
  updateGuardian: (guardian: Partial<Guardian>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  guardian: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const data = await apiClient<{ guardian: Guardian; accessToken: string; refreshToken: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password } },
    );
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('guardian', JSON.stringify(data.guardian));
    set({ guardian: data.guardian, isAuthenticated: true });
  },

  register: async (email, password, name) => {
    const data = await apiClient<{ guardian: Guardian; accessToken: string; refreshToken: string }>(
      '/api/auth/register',
      { method: 'POST', body: { email, password, name } },
    );
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('guardian', JSON.stringify(data.guardian));
    set({ guardian: data.guardian, isAuthenticated: true });
  },

  logout: () => {
    clearTokens();
    set({ guardian: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  hydrate: () => {
    const stored = localStorage.getItem('guardian');
    const token = localStorage.getItem('accessToken');
    if (stored && token) {
      set({ guardian: JSON.parse(stored), isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  updateGuardian: (updates) => {
    set((state) => {
      const updated = { ...state.guardian, ...updates } as Guardian;
      localStorage.setItem('guardian', JSON.stringify(updated));
      return { guardian: updated };
    });
  },
}));
