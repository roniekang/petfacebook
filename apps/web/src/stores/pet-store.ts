'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import type { PetAccount } from '@pettopia/types';

interface PetState {
  pet: PetAccount | null;
  isLoading: boolean;
  fetchMyPet: () => Promise<void>;
  setPet: (pet: PetAccount | null) => void;
  clear: () => void;
}

export const usePetStore = create<PetState>((set) => ({
  pet: null,
  isLoading: false,

  fetchMyPet: async () => {
    set({ isLoading: true });
    try {
      const pet = await apiClient<PetAccount | null>('/api/pets/mine');
      set({ pet, isLoading: false });
    } catch {
      set({ pet: null, isLoading: false });
    }
  },

  setPet: (pet) => {
    set({ pet });
  },

  clear: () => {
    set({ pet: null });
  },
}));
