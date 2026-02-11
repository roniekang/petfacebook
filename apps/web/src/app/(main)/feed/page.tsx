'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import { PostCard } from '@/components/post/post-card';
import { StoryBar } from '@/components/story/story-bar';
import {
  IoImageOutline,
  IoVideocamOutline,
  IoPersonAddOutline,
  IoWalkOutline,
} from 'react-icons/io5';

interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
}

interface FeedPost {
  id: string;
  petAccountId: string;
  content?: string;
  images: string[];
  videos: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked: boolean;
  petAccount: {
    id: string;
    name: string;
    profileImage?: string;
    species?: string;
  };
  _count?: { comments: number; likes: number };
}

interface FriendEntry {
  friendshipId: string;
  friend: {
    id: string;
    name: string;
    profileImage?: string;
    species: string;
  };
}

interface FriendWalkingEntry {
  petAccount: { id: string };
  walkSessionId: string;
  startedAt: string;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [walkingFriendIds, setWalkingFriendIds] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pet = usePetStore((s) => s.pet);
  const observerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchPosts = useCallback(
    async (cursorParam?: string) => {
      if (!pet) return;
      const isMore = !!cursorParam;
      if (isMore) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = cursorParam ? `?cursor=${cursorParam}&limit=10` : '?limit=10';
        const data = await apiClient<FeedResponse>(`/api/posts/feed${params}`);
        setPosts((prev) => (isMore ? [...prev, ...data.posts] : data.posts));
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        // error
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pet],
  );

  // Fetch friends list
  useEffect(() => {
    if (!pet) return;
    apiClient<FriendEntry[]>('/api/friends')
      .then(setFriends)
      .catch(() => {});
    apiClient<FriendWalkingEntry[]>('/api/walks/friends-walking')
      .then((data) => setWalkingFriendIds(new Set(data.map((d) => d.petAccount.id))))
      .catch(() => {});
  }, [pet]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor) {
          fetchPosts(cursor);
        }
      },
      { threshold: 0.5 },
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loadingMore, cursor, fetchPosts]);

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-5xl">🐾</p>
        <p className="mt-4 text-lg font-semibold text-gray-800">펫을 등록해주세요</p>
        <p className="mt-1 text-sm text-gray-500">펫을 등록하면 피드를 볼 수 있어요</p>
        <button
          onClick={() => router.push('/pet/register')}
          className="mt-4 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white"
        >
          펫 등록하기
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Layer 0: Story Bar */}
      <StoryBar />

      {/* Layer 1: Create Post */}
      <div
        onClick={() => router.push('/posts/new')}
        className="mx-4 mt-3 cursor-pointer rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
            {pet.profileImage ? (
              <img src={pet.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm">🐾</div>
            )}
          </div>
          <div className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-400">
            {pet.name}의 이야기를 공유해보세요...
          </div>
        </div>
        <div className="mt-2.5 flex border-t border-gray-100 pt-2.5">
          <button className="flex flex-1 items-center justify-center gap-1.5 text-xs font-medium text-gray-500">
            <IoImageOutline size={18} className="text-green-500" />
            사진
          </button>
          <div className="w-px bg-gray-200" />
          <button className="flex flex-1 items-center justify-center gap-1.5 text-xs font-medium text-gray-500">
            <IoVideocamOutline size={18} className="text-red-500" />
            동영상
          </button>
        </div>
      </div>

      {/* Layer 2: Friends horizontal scroll */}
      <div className="mt-3 border-y border-gray-100 bg-white py-3">
        <div className="flex items-center justify-between px-4 pb-2">
          <p className="text-sm font-semibold text-gray-800">친구</p>
          <Link href="/friends" className="text-xs text-orange-500">
            전체 보기
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {/* Add friend card */}
          <Link
            href="/friends/add"
            className="flex flex-shrink-0 flex-col items-center gap-1.5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-orange-300 bg-orange-50">
              <IoPersonAddOutline size={22} className="text-orange-500" />
            </div>
            <span className="w-16 truncate text-center text-[11px] text-gray-500">
              친구 추가
            </span>
          </Link>

          {friends.length === 0 && (
            <div className="flex items-center px-4 text-xs text-gray-400">
              아직 친구가 없어요. 친구를 추가해보세요!
            </div>
          )}

          {friends.map((entry) => {
            const isWalking = walkingFriendIds.has(entry.friend.id);
            return (
              <Link
                key={entry.friendshipId}
                href={`/pet/${entry.friend.id}`}
                className="flex flex-shrink-0 flex-col items-center gap-1.5"
              >
                <div className="relative">
                  <div className={`h-16 w-16 overflow-hidden rounded-full bg-gray-200 ring-2 ${isWalking ? 'ring-green-400' : 'ring-orange-200'}`}>
                    {entry.friend.profileImage ? (
                      <img
                        src={entry.friend.profileImage}
                        alt={entry.friend.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">🐾</div>
                    )}
                  </div>
                  {isWalking && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                      산책중
                    </div>
                  )}
                </div>
                <span className="w-16 truncate text-center text-[11px] font-medium text-gray-700">
                  {entry.friend.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Layer 3: Feed posts */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-4xl">📷</p>
          <p className="mt-3 text-sm font-semibold text-gray-700">아직 게시글이 없어요</p>
          <p className="mt-1 text-xs text-gray-400">
            첫 번째 게시글을 올리거나 친구를 추가해보세요!
          </p>
          <button
            onClick={() => router.push('/posts/new')}
            className="mt-3 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white"
          >
            글 쓰기
          </button>
        </div>
      ) : (
        <div className="mt-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCommentClick={(id) => router.push(`/posts/${id}`)}
            />
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
