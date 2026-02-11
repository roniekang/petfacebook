'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import { IoImageOutline, IoClose, IoChevronBack } from 'react-icons/io5';

export default function NewPostPage() {
  const router = useRouter();
  const pet = usePetStore((s) => s.pet);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews = Array.from(files).map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));
      const data = await apiClient<{ urls: string[] }>('/api/upload/images', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      setImages((prev) => [...prev, ...data.urls]);
    } catch {
      setError('이미지 업로드에 실패했습니다');
      setPreviews((prev) => prev.slice(0, prev.length - newPreviews.length));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      setError('내용이나 사진을 추가해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient('/api/posts', {
        method: 'POST',
        body: {
          content: content.trim() || undefined,
          images: images.length > 0 ? images : undefined,
          visibility: 'PUBLIC',
        },
      });
      router.replace('/feed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '게시에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!pet) {
    router.replace('/pet/register');
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <button onClick={() => router.back()} className="text-gray-600">
          <IoChevronBack size={24} />
        </button>
        <h1 className="text-base font-semibold">새 게시글</h1>
        <button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="text-sm font-semibold text-orange-500 disabled:opacity-50"
        >
          {loading ? '게시 중...' : '공유'}
        </button>
      </div>

      {/* Author info */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200">
          {pet.profileImage && (
            <img src={pet.profileImage} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{pet.name}</p>
          <p className="text-xs text-gray-400">게시글 작성</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`${pet.name}의 이야기를 들려주세요...`}
          className="w-full resize-none border-none bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
          rows={6}
        />

        {/* Image previews */}
        {previews.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {previews.map((preview, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img src={preview} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  <IoClose size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            업로드 중...
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {/* Bottom toolbar */}
      <div className="border-t border-gray-100 px-4 py-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <IoImageOutline size={24} className="text-orange-500" />
          사진 추가
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
