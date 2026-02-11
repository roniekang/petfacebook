'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import type { WalkSession, WalkHistoryResponse } from '@pettopia/types';
import {
  IoTimeOutline,
  IoFootstepsOutline,
  IoCameraOutline,
  IoChevronBack,
} from 'react-icons/io5';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function WalkHistoryPage() {
  const [walks, setWalks] = useState<WalkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pet = usePetStore((s) => s.pet);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchWalks = useCallback(
    async (cursorParam?: string) => {
      if (!pet) return;
      const isMore = !!cursorParam;
      if (isMore) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = cursorParam ? `?cursor=${cursorParam}&limit=20` : '?limit=20';
        const data = await apiClient<WalkHistoryResponse>(`/api/walks/history${params}`);
        setWalks((prev) => (isMore ? [...prev, ...data.walks] : data.walks));
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        //
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pet],
  );

  useEffect(() => {
    fetchWalks();
  }, [fetchWalks]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor) {
          fetchWalks(cursor);
        }
      },
      { threshold: 0.5 },
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loadingMore, cursor, fetchWalks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Link
        href="/walk"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500"
      >
        <IoChevronBack size={16} />
        산책
      </Link>

      {walks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IoFootstepsOutline size={48} className="text-gray-300" />
          <p className="mt-3 text-sm font-semibold text-gray-700">아직 산책 기록이 없어요</p>
          <p className="mt-1 text-xs text-gray-400">첫 산책을 시작해보세요!</p>
          <Link
            href="/walk"
            className="mt-4 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white"
          >
            산책 시작하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {walks.map((walk) => (
            <Link
              key={walk.id}
              href={`/walk/${walk.id}`}
              className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDate(walk.startedAt)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <IoTimeOutline size={14} />
                      {formatTime(walk.duration || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <IoFootstepsOutline size={14} />
                      {formatDistance(Number(walk.distance) || 0)}
                    </span>
                    {walk.photos.length > 0 && (
                      <span className="flex items-center gap-1">
                        <IoCameraOutline size={14} />
                        {walk.photos.length}장
                      </span>
                    )}
                  </div>
                </div>
                {walk.photos.length > 0 && (
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={walk.photos[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </Link>
          ))}

          {loadingMore && (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          )}

          <div ref={observerRef} className="h-4" />
        </div>
      )}
    </div>
  );
}
