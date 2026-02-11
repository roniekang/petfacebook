'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWalkStore } from '@/stores/walk-store';
import { usePetStore } from '@/stores/pet-store';
import { apiClient, API_BASE_URL, getTokens } from '@/lib/api-client';
import {
  IoPlayOutline,
  IoStopOutline,
  IoCameraOutline,
  IoCloseOutline,
  IoTimeOutline,
  IoFootstepsOutline,
  IoListOutline,
  IoTrashOutline,
} from 'react-icons/io5';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

export default function WalkPage() {
  const router = useRouter();
  const pet = usePetStore((s) => s.pet);
  const {
    isWalking,
    elapsedSeconds,
    distance,
    photos,
    startWalk,
    endWalk,
    cancelWalk,
    addPhoto,
    updateLocation,
    syncLocation,
    fetchCurrentWalk,
    tick,
  } = useWalkStore();

  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watchIdRef = useRef<number | null>(null);
  const syncCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore session on mount
  useEffect(() => {
    fetchCurrentWalk();
  }, [fetchCurrentWalk]);

  // Timer
  useEffect(() => {
    if (isWalking) {
      timerRef.current = setInterval(() => tick(), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWalking, tick]);

  // GPS tracking
  const startGps = useCallback(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateLocation(latitude, longitude);
        syncCountRef.current++;
        // Sync to server every 5 position updates
        if (syncCountRef.current % 5 === 0) {
          syncLocation(latitude, longitude);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }, [updateLocation, syncLocation]);

  const stopGps = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    syncCountRef.current = 0;
  }, []);

  useEffect(() => {
    if (isWalking) startGps();
    else stopGps();
    return () => stopGps();
  }, [isWalking, startGps, stopGps]);

  const handleStart = async () => {
    setStarting(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}
      await startWalk(lat, lng);
    } catch (e: any) {
      alert(e.message || '산책을 시작할 수 없습니다');
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm('산책을 종료하시겠습니까?')) return;
    setEnding(true);
    try {
      const result = await endWalk();
      if (result.postId) {
        router.push(`/posts/${result.postId}`);
      } else {
        router.push(`/walk/${result.id}`);
      }
    } catch (e: any) {
      alert(e.message || '산책 종료 중 오류');
    } finally {
      setEnding(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('산책을 취소하시겠습니까? 기록이 저장되지 않습니다.')) return;
    try {
      await cancelWalk();
    } catch (e: any) {
      alert(e.message || '산책 취소 중 오류');
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { accessToken } = getTokens();
      const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      await addPhoto(url);
    } catch (e: any) {
      alert(e.message || '사진 업로드 실패');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-5xl">🐾</p>
        <p className="mt-4 text-lg font-semibold text-gray-800">펫을 등록해주세요</p>
        <p className="mt-1 text-sm text-gray-500">펫을 등록하면 산책 기능을 사용할 수 있어요</p>
        <button
          onClick={() => router.push('/pet/register')}
          className="mt-4 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white"
        >
          펫 등록하기
        </button>
      </div>
    );
  }

  // Walking state
  if (isWalking) {
    return (
      <div className="flex flex-col px-4 py-4">
        {/* Timer & Distance */}
        <div className="rounded-2xl bg-orange-50 p-6 text-center">
          <p className="text-4xl font-bold text-orange-600 tabular-nums">
            {formatTime(elapsedSeconds)}
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <IoFootstepsOutline size={16} />
              {formatDistance(distance)}
            </span>
            <span className="flex items-center gap-1">
              <IoCameraOutline size={16} />
              {photos.length}장
            </span>
          </div>
        </div>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-xl bg-gray-100">
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 disabled:opacity-50"
          >
            <IoCameraOutline size={20} />
            {uploading ? '업로드 중...' : '사진 촬영'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCapture}
          />
        </div>

        <div className="mt-3 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3.5 text-sm font-semibold text-red-500"
          >
            <IoTrashOutline size={18} />
            취소
          </button>
          <button
            onClick={handleEnd}
            disabled={ending}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <IoStopOutline size={20} />
            {ending ? '종료 중...' : '산책 종료'}
          </button>
        </div>
      </div>
    );
  }

  // Idle state
  return (
    <div className="flex flex-col items-center px-4 py-8">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-orange-50">
        <IoFootstepsOutline size={56} className="text-orange-400" />
      </div>

      <p className="mt-6 text-lg font-semibold text-gray-800">
        {pet.name}와 산책을 시작해보세요!
      </p>
      <p className="mt-1 text-sm text-gray-500">
        산책 기록과 사진을 남길 수 있어요
      </p>

      <button
        onClick={handleStart}
        disabled={starting}
        className="mt-6 flex items-center gap-2 rounded-2xl bg-orange-500 px-10 py-4 text-lg font-bold text-white shadow-lg disabled:opacity-50"
      >
        <IoPlayOutline size={24} />
        {starting ? '시작 중...' : '산책 시작'}
      </button>

      <Link
        href="/walk/history"
        className="mt-6 flex items-center gap-2 text-sm font-medium text-orange-500"
      >
        <IoListOutline size={18} />
        산책 기록 보기
      </Link>
    </div>
  );
}
