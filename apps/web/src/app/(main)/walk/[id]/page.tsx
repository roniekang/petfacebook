'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { WalkSession } from '@pettopia/types';
import {
  IoTimeOutline,
  IoFootstepsOutline,
  IoCameraOutline,
  IoChevronBack,
  IoDocumentTextOutline,
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
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function WalkDetailPage() {
  const params = useParams();
  const [walk, setWalk] = useState<WalkSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<WalkSession>(`/api/walks/${params.id}`)
      .then(setWalk)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!walk) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500">산책 기록을 찾을 수 없습니다</p>
        <Link href="/walk/history" className="mt-2 text-sm text-orange-500">
          기록 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Link
        href="/walk/history"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500"
      >
        <IoChevronBack size={16} />
        산책 기록
      </Link>

      {/* Stats */}
      <div className="rounded-2xl bg-orange-50 p-5">
        <p className="text-sm text-gray-500">{formatDate(walk.startedAt)}</p>
        <div className="mt-3 grid grid-cols-3 gap-4 text-center">
          <div>
            <IoTimeOutline size={22} className="mx-auto text-orange-500" />
            <p className="mt-1 text-lg font-bold text-gray-800">
              {formatTime(walk.duration || 0)}
            </p>
            <p className="text-xs text-gray-500">시간</p>
          </div>
          <div>
            <IoFootstepsOutline size={22} className="mx-auto text-orange-500" />
            <p className="mt-1 text-lg font-bold text-gray-800">
              {formatDistance(Number(walk.distance) || 0)}
            </p>
            <p className="text-xs text-gray-500">거리</p>
          </div>
          <div>
            <IoCameraOutline size={22} className="mx-auto text-orange-500" />
            <p className="mt-1 text-lg font-bold text-gray-800">
              {walk.photos.length}
            </p>
            <p className="text-xs text-gray-500">사진</p>
          </div>
        </div>
      </div>

      {/* Photos */}
      {walk.photos.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">사진</p>
          <div className="grid grid-cols-3 gap-2">
            {walk.photos.map((url, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-xl bg-gray-100">
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to post */}
      {walk.post?.id && (
        <Link
          href={`/posts/${walk.post.id}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-3 text-sm font-semibold text-orange-600"
        >
          <IoDocumentTextOutline size={18} />
          게시글 보기
        </Link>
      )}
    </div>
  );
}
