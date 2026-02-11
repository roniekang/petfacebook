'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  IoHeartOutline,
  IoHeart,
  IoChatbubbleOutline,
  IoEllipsisHorizontal,
} from 'react-icons/io5';
import { apiClient } from '@/lib/api-client';

interface PostPetAccount {
  id: string;
  name: string;
  profileImage?: string;
  species?: string;
}

interface PostData {
  id: string;
  petAccountId: string;
  content?: string;
  images: string[];
  videos: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked: boolean;
  petAccount: PostPetAccount;
  _count?: { comments: number; likes: number };
}

interface PostCardProps {
  post: PostData;
  onCommentClick?: (postId: string) => void;
}

export function PostCard({ post, onCommentClick }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount || post._count?.likes || 0);
  const [imageIndex, setImageIndex] = useState(0);

  const handleLike = async () => {
    const prev = liked;
    setLiked(!liked);
    setLikeCount((c) => (prev ? c - 1 : c + 1));

    try {
      const res = await apiClient<{ liked: boolean; likeCount: number }>(
        `/api/posts/${post.id}/like`,
        { method: 'POST' },
      );
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      setLiked(prev);
      setLikeCount((c) => (prev ? c + 1 : c - 1));
    }
  };

  const commentCount = post.commentCount || post._count?.comments || 0;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { locale: ko, addSuffix: true });

  return (
    <article className="border-b border-gray-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/pet/${post.petAccount.id}`} className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200 ring-2 ring-orange-100">
            {post.petAccount.profileImage ? (
              <img
                src={post.petAccount.profileImage}
                alt={post.petAccount.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm">🐾</div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{post.petAccount.name}</p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </Link>
        <button className="text-gray-400 hover:text-gray-600">
          <IoEllipsisHorizontal size={20} />
        </button>
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className="relative aspect-square bg-gray-100">
          <img
            src={post.images[imageIndex]}
            alt=""
            className="h-full w-full object-cover"
          />
          {post.images.length > 1 && (
            <>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                {post.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`h-1.5 w-1.5 rounded-full ${
                      i === imageIndex ? 'bg-orange-500' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
              {imageIndex > 0 && (
                <button
                  onClick={() => setImageIndex((i) => i - 1)}
                  className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white"
                >
                  &lt;
                </button>
              )}
              {imageIndex < post.images.length - 1 && (
                <button
                  onClick={() => setImageIndex((i) => i + 1)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white"
                >
                  &gt;
                </button>
              )}
              <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white">
                {imageIndex + 1}/{post.images.length}
              </span>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-2.5">
        <button onClick={handleLike} className="flex items-center gap-1">
          {liked ? (
            <IoHeart size={24} className="text-red-500" />
          ) : (
            <IoHeartOutline size={24} className="text-gray-700" />
          )}
        </button>
        <button
          onClick={() => onCommentClick?.(post.id)}
          className="flex items-center gap-1"
        >
          <IoChatbubbleOutline size={22} className="text-gray-700" />
        </button>
      </div>

      {/* Like count */}
      {likeCount > 0 && (
        <p className="px-4 text-sm font-semibold text-gray-900">
          좋아요 {likeCount}개
        </p>
      )}

      {/* Content */}
      {post.content && (
        <p className="px-4 pt-1 text-sm text-gray-800">
          <Link href={`/pet/${post.petAccount.id}`} className="font-semibold">
            {post.petAccount.name}
          </Link>{' '}
          {post.content}
        </p>
      )}

      {/* Comment count */}
      {commentCount > 0 && (
        <button
          onClick={() => onCommentClick?.(post.id)}
          className="px-4 pt-1 text-sm text-gray-400"
        >
          댓글 {commentCount}개 모두 보기
        </button>
      )}

      <div className="h-2" />
    </article>
  );
}
