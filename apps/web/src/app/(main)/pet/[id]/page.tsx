'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import {
  IoGridOutline,
  IoSettingsOutline,
  IoPersonAddOutline,
  IoTrashOutline,
  IoHeartSharp,
  IoChatbubbleSharp,
  IoImageOutline,
} from 'react-icons/io5';
import type { GuardianRole } from '@pettopia/types';

interface GuardianInfo {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface PetGuardianEntry {
  id: string;
  guardianId: string;
  role: GuardianRole;
  status: string;
  guardian: GuardianInfo;
}

interface GridPost {
  id: string;
  images: string[];
  videos: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface GridPostsResponse {
  posts: GridPost[];
  nextCursor: string | null;
}

interface PetProfile {
  id: string;
  guardianId: string;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  profileImage?: string;
  bio?: string;
  personality: string[];
  favorites: string[];
  petGuardians?: PetGuardianEntry[];
  _count?: {
    posts: number;
    sentRequests: number;
    receivedRequests: number;
  };
}

export default function PetProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const myPet = usePetStore((s) => s.pet);
  const isOwn = myPet?.id === id;

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showGuardians, setShowGuardians] = useState(false);

  const [gridPosts, setGridPosts] = useState<GridPost[]>([]);
  const [gridCursor, setGridCursor] = useState<string | null>(null);
  const [gridHasMore, setGridHasMore] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);
  const gridObserverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient<PetProfile>(`/api/pets/${id}`);
        setPet(data);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const fetchGridPosts = useCallback(
    async (cursor?: string) => {
      if (!id) return;
      setGridLoading(true);
      try {
        const params = cursor ? `?cursor=${cursor}&limit=24` : '?limit=24';
        const data = await apiClient<GridPostsResponse>(`/api/posts/pet/${id}${params}`);
        setGridPosts((prev) => (cursor ? [...prev, ...data.posts] : data.posts));
        setGridCursor(data.nextCursor);
        setGridHasMore(!!data.nextCursor);
      } catch {
        //
      } finally {
        setGridLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchGridPosts();
  }, [fetchGridPosts]);

  useEffect(() => {
    if (!gridHasMore || gridLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && gridCursor) {
          fetchGridPosts(gridCursor);
        }
      },
      { threshold: 0.5 },
    );
    const el = gridObserverRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [gridHasMore, gridLoading, gridCursor, fetchGridPosts]);

  const myRole = pet?.petGuardians?.find((pg) => pg.guardian.id === pet.guardianId)?.role;
  const isOwnerOrAdmin = isOwn && pet?.petGuardians?.some(
    (pg) => (pg.role === 'OWNER' || pg.role === 'ADMIN'),
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim() || inviting) return;
    setInviting(true);
    try {
      await apiClient(`/api/pets/${id}/guardians/invite`, {
        method: 'POST',
        body: { email: inviteEmail.trim() },
      });
      setInviteEmail('');
      // Reload pet data
      const data = await apiClient<PetProfile>(`/api/pets/${id}`);
      setPet(data);
      alert('초대를 보냈습니다!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '초대 실패');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveGuardian = async (guardianId: string, guardianName: string) => {
    if (!confirm(`${guardianName} 집사를 제거하시겠습니까?`)) return;
    try {
      await apiClient(`/api/pets/${id}/guardians/${guardianId}`, { method: 'DELETE' });
      const data = await apiClient<PetProfile>(`/api/pets/${id}`);
      setPet(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '제거 실패');
    }
  };

  const handleRoleChange = async (guardianId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      await apiClient(`/api/pets/${id}/guardians/${guardianId}/role`, {
        method: 'PATCH',
        body: { role: newRole },
      });
      const data = await apiClient<PetProfile>(`/api/pets/${id}`);
      setPet(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '역할 변경 실패');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!pet) {
    return <div className="px-4 py-20 text-center text-gray-500">펫을 찾을 수 없습니다</div>;
  }

  const postCount = pet._count?.posts || 0;
  const friendCount = (pet._count?.sentRequests || 0) + (pet._count?.receivedRequests || 0);
  const guardianCount = pet.petGuardians?.length || 0;

  return (
    <div>
      {/* Profile header */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 ring-3 ring-orange-200">
            {pet.profileImage ? (
              <img src={pet.profileImage} alt={pet.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">🐾</div>
            )}
          </div>

          <div className="flex flex-1 justify-around text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{postCount}</p>
              <p className="text-xs text-gray-500">게시글</p>
            </div>
            <Link href="/friends">
              <p className="text-lg font-bold text-gray-900">{friendCount}</p>
              <p className="text-xs text-gray-500">친구</p>
            </Link>
            <button onClick={() => setShowGuardians(!showGuardians)}>
              <p className="text-lg font-bold text-gray-900">{guardianCount}</p>
              <p className="text-xs text-gray-500">집사</p>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">{pet.name}</h2>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
              {speciesLabel(pet.species)}
            </span>
            {pet.breed && (
              <span className="text-xs text-gray-400">{pet.breed}</span>
            )}
          </div>
          {pet.bio && <p className="mt-1 text-sm text-gray-600">{pet.bio}</p>}
          {pet.personality.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {pet.personality.map((p) => (
                <span key={p} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {isOwn ? (
            <>
              <Link
                href={`/pet/${id}/edit`}
                className="flex-1 rounded-lg bg-gray-100 py-2 text-center text-sm font-medium text-gray-800"
              >
                프로필 편집
              </Link>
              <button className="rounded-lg bg-gray-100 px-3 py-2 text-gray-600">
                <IoSettingsOutline size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={async () => {
                try {
                  await apiClient('/api/friends/request', {
                    method: 'POST',
                    body: { receiverId: id, method: 'SEARCH' },
                  });
                  alert('친구 요청을 보냈습니다!');
                } catch (err: unknown) {
                  alert(err instanceof Error ? err.message : '요청 실패');
                }
              }}
              className="flex-1 rounded-lg bg-orange-500 py-2 text-center text-sm font-semibold text-white"
            >
              친구 요청
            </button>
          )}
        </div>
      </div>

      {/* Guardian management section */}
      {showGuardians && (
        <div className="border-t border-gray-100 px-4 py-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">집사 목록</h3>

          <div className="space-y-2">
            {pet.petGuardians?.map((pg) => (
              <div key={pg.id} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200">
                  {pg.guardian.profileImage ? (
                    <img src={pg.guardian.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm">👤</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{pg.guardian.name}</p>
                  <p className="text-xs text-gray-400">{pg.guardian.email}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  pg.role === 'OWNER'
                    ? 'bg-orange-100 text-orange-600'
                    : pg.role === 'ADMIN'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {roleLabel(pg.role)}
                </span>

                {/* OWNER can change roles and remove guardians */}
                {isOwn && pet.petGuardians?.some((g) => g.role === 'OWNER') && pg.role !== 'OWNER' && (
                  <div className="flex items-center gap-1">
                    <select
                      value={pg.role}
                      onChange={(e) => handleRoleChange(pg.guardianId, e.target.value as 'ADMIN' | 'MEMBER')}
                      className="rounded border border-gray-200 px-1.5 py-0.5 text-xs"
                    >
                      <option value="ADMIN">관리자</option>
                      <option value="MEMBER">멤버</option>
                    </select>
                    <button
                      onClick={() => handleRemoveGuardian(pg.guardianId, pg.guardian.name)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <IoTrashOutline size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Invite form - OWNER or ADMIN only */}
          {isOwn && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-gray-500">집사 초대</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="이메일 주소 입력"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <IoPersonAddOutline size={16} />
                  {inviting ? '...' : '초대'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        <button className="flex-1 border-b-2 border-orange-500 py-3 text-center">
          <IoGridOutline size={22} className="mx-auto text-orange-500" />
        </button>
      </div>

      {/* Post grid */}
      <div className="p-0.5">
        {gridPosts.length === 0 && !gridLoading ? (
          <div className="py-16 text-center">
            <p className="text-4xl">📷</p>
            <p className="mt-3 text-sm text-gray-500">
              {isOwn ? '첫 번째 게시글을 올려보세요' : '아직 게시글이 없습니다'}
            </p>
            {isOwn && (
              <button
                onClick={() => router.push('/posts/new')}
                className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white"
              >
                글 쓰기
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-0.5">
              {gridPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="group relative aspect-square bg-gray-100"
                >
                  {post.images.length > 0 ? (
                    <img
                      src={post.images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
                      <IoImageOutline size={32} />
                    </div>
                  )}
                  {post.images.length > 1 && (
                    <div className="absolute right-1.5 top-1.5">
                      <IoGridOutline size={16} className="text-white drop-shadow" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-1 text-sm font-semibold text-white">
                      <IoHeartSharp size={16} /> {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-white">
                      <IoChatbubbleSharp size={16} /> {post.commentCount}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {gridLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            )}

            <div ref={gridObserverRef} className="h-4" />
          </>
        )}
      </div>
    </div>
  );
}

function speciesLabel(species: string) {
  const map: Record<string, string> = {
    DOG: '강아지', CAT: '고양이', BIRD: '새', RABBIT: '토끼',
    HAMSTER: '햄스터', FISH: '물고기', REPTILE: '파충류', OTHER: '기타',
  };
  return map[species] || species;
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    OWNER: '소유자',
    ADMIN: '관리자',
    MEMBER: '멤버',
  };
  return map[role] || role;
}
