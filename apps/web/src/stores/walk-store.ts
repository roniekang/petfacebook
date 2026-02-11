'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import type { WalkSession, RoutePoint } from '@pettopia/types';

interface WalkState {
  currentWalk: WalkSession | null;
  isWalking: boolean;
  localRoute: RoutePoint[];
  photos: string[];
  elapsedSeconds: number;
  distance: number;

  startWalk: (latitude?: number, longitude?: number) => Promise<void>;
  updateLocation: (lat: number, lng: number) => void;
  syncLocation: (lat: number, lng: number) => Promise<void>;
  addPhoto: (photoUrl: string) => Promise<void>;
  endWalk: () => Promise<WalkSession>;
  cancelWalk: () => Promise<void>;
  fetchCurrentWalk: () => Promise<void>;
  tick: () => void;
  reset: () => void;
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const useWalkStore = create<WalkState>((set, get) => ({
  currentWalk: null,
  isWalking: false,
  localRoute: [],
  photos: [],
  elapsedSeconds: 0,
  distance: 0,

  startWalk: async (latitude?: number, longitude?: number) => {
    const walk = await apiClient<WalkSession>('/api/walks/start', {
      method: 'POST',
      body: { latitude, longitude },
    });
    const initialRoute: RoutePoint[] =
      latitude && longitude ? [{ lat: latitude, lng: longitude, timestamp: Date.now() }] : [];
    set({
      currentWalk: walk,
      isWalking: true,
      localRoute: initialRoute,
      photos: [],
      elapsedSeconds: 0,
      distance: 0,
    });
  },

  updateLocation: (lat: number, lng: number) => {
    const { localRoute } = get();
    const newPoint: RoutePoint = { lat, lng, timestamp: Date.now() };
    let addedDistance = 0;
    if (localRoute.length > 0) {
      const last = localRoute[localRoute.length - 1];
      addedDistance = calcDistance(last.lat, last.lng, lat, lng);
    }
    set((s) => ({
      localRoute: [...s.localRoute, newPoint],
      distance: s.distance + addedDistance,
    }));
  },

  syncLocation: async (lat: number, lng: number) => {
    const { currentWalk } = get();
    if (!currentWalk) return;
    await apiClient(`/api/walks/${currentWalk.id}/location`, {
      method: 'PATCH',
      body: { latitude: lat, longitude: lng },
    });
  },

  addPhoto: async (photoUrl: string) => {
    const { currentWalk } = get();
    if (!currentWalk) return;
    await apiClient(`/api/walks/${currentWalk.id}/photos`, {
      method: 'POST',
      body: { photoUrl },
    });
    set((s) => ({ photos: [...s.photos, photoUrl] }));
  },

  endWalk: async () => {
    const { currentWalk, elapsedSeconds, distance, localRoute } = get();
    if (!currentWalk) throw new Error('No active walk');
    const lastPoint = localRoute[localRoute.length - 1];
    const walk = await apiClient<WalkSession>(`/api/walks/${currentWalk.id}/end`, {
      method: 'POST',
      body: {
        latitude: lastPoint?.lat,
        longitude: lastPoint?.lng,
        duration: elapsedSeconds,
        distance: Math.round(distance),
      },
    });
    set({
      currentWalk: null,
      isWalking: false,
      localRoute: [],
      photos: [],
      elapsedSeconds: 0,
      distance: 0,
    });
    return walk;
  },

  cancelWalk: async () => {
    const { currentWalk } = get();
    if (!currentWalk) return;
    await apiClient(`/api/walks/${currentWalk.id}`, { method: 'DELETE' });
    set({
      currentWalk: null,
      isWalking: false,
      localRoute: [],
      photos: [],
      elapsedSeconds: 0,
      distance: 0,
    });
  },

  fetchCurrentWalk: async () => {
    try {
      const walk = await apiClient<WalkSession | null>('/api/walks/current');
      if (walk) {
        const photos = walk.photos || [];
        const route = (walk.routePath || []) as RoutePoint[];
        let totalDist = 0;
        for (let i = 1; i < route.length; i++) {
          totalDist += calcDistance(route[i - 1].lat, route[i - 1].lng, route[i].lat, route[i].lng);
        }
        const elapsed = Math.floor((Date.now() - new Date(walk.startedAt).getTime()) / 1000);
        set({
          currentWalk: walk,
          isWalking: true,
          localRoute: route,
          photos,
          elapsedSeconds: elapsed,
          distance: totalDist,
        });
      } else {
        set({ currentWalk: null, isWalking: false });
      }
    } catch {
      set({ currentWalk: null, isWalking: false });
    }
  },

  tick: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),

  reset: () =>
    set({
      currentWalk: null,
      isWalking: false,
      localRoute: [],
      photos: [],
      elapsedSeconds: 0,
      distance: 0,
    }),
}));
