'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import { PostCard } from '@/components/post/post-card';
import { IoChevronBack, IoSend } from 'react-icons/io5';

interface CommentData {
  id: string;
  postId: string;
  petAccountId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  petAccount: {
    id: string;
    name: string;
    profileImage?: string;
  };
  replies?: CommentData[];
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pet = usePetStore((s) => s.pet);

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [postData, commentsData] = await Promise.all([
          apiClient<any>(`/api/posts/${id}`),
          apiClient<CommentData[]>(`/api/posts/${id}/comments`),
        ]);
        setPost(postData);
        setComments(commentsData);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await apiClient<CommentData>(`/api/posts/${id}/comments`, {
        method: 'POST',
        body: { content: newComment.trim() },
      });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="px-4 py-20 text-center text-gray-500">게시글을 찾을 수 없습니다</div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <button onClick={() => router.back()} className="text-gray-600">
          <IoChevronBack size={24} />
        </button>
        <h1 className="text-base font-semibold">게시글</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PostCard post={post} />

        {/* Comments */}
        <div className="px-4 py-3">
          <p className="mb-3 text-sm font-semibold text-gray-800">
            댓글 {comments.length}개
          </p>
          {comments.map((comment) => (
            <div key={comment.id} className="mb-3">
              <div className="flex gap-2.5">
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                  {comment.petAccount.profileImage && (
                    <img
                      src={comment.petAccount.profileImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">
                      {comment.petAccount.name}
                    </span>{' '}
                    <span className="text-gray-700">{comment.content}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      locale: ko,
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-10 mt-2 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2">
                      <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                        {reply.petAccount.profileImage && (
                          <img
                            src={reply.petAccount.profileImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-semibold text-gray-900">
                            {reply.petAccount.name}
                          </span>{' '}
                          <span className="text-gray-700">{reply.content}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatDistanceToNow(new Date(reply.createdAt), {
                            locale: ko,
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comment input */}
      {pet && (
        <div className="border-t border-gray-100 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
              {pet.profileImage && (
                <img src={pet.profileImage} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder="댓글 달기..."
              className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm outline-none"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              className="text-orange-500 disabled:opacity-30"
            >
              <IoSend size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
