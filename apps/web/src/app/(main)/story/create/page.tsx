'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IoImageOutline, IoVideocamOutline, IoClose } from 'react-icons/io5';
import { apiClient } from '@/lib/api-client';

export default function StoryCreatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const isVideo = selected.type.startsWith('video/');
    setMediaType(isVideo ? 'VIDEO' : 'IMAGE');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await apiClient<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      // 2. Create story
      await apiClient('/api/stories', {
        method: 'POST',
        body: {
          mediaUrl: uploadRes.url,
          mediaType,
        },
      });

      router.push('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview ? (
        /* File selection UI */
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <p className="text-4xl">📸</p>
          <p className="mt-4 text-lg font-semibold text-gray-800">
            스토리 만들기
          </p>
          <p className="mt-1 text-sm text-gray-500">
            사진이나 동영상을 선택해주세요
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*';
                  fileInputRef.current.click();
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
            >
              <IoImageOutline size={20} />
              사진
            </button>
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'video/*';
                  fileInputRef.current.click();
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white"
            >
              <IoVideocamOutline size={20} />
              동영상
            </button>
          </div>
        </div>
      ) : (
        /* Preview UI */
        <div className="relative">
          <div className="relative aspect-[9/16] max-h-[70vh] w-full bg-black">
            {mediaType === 'VIDEO' ? (
              <video
                src={preview}
                controls
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-contain"
              />
            )}
            <button
              onClick={clearFile}
              className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white"
            >
              <IoClose size={20} />
            </button>
          </div>

          {error && (
            <p className="mt-2 px-4 text-center text-sm text-red-500">{error}</p>
          )}

          <div className="mt-4 px-4">
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {uploading ? '업로드 중...' : '스토리 올리기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
