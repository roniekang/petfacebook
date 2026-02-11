'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import { IoCamera, IoArrowBack } from 'react-icons/io5';
import type { PetAccount, PetGender } from '@pettopia/types';

const GENDER_OPTIONS: { value: PetGender; label: string }[] = [
  { value: 'MALE', label: '수컷' },
  { value: 'FEMALE', label: '암컷' },
  { value: 'NEUTERED_MALE', label: '중성화 수컷' },
  { value: 'SPAYED_FEMALE', label: '중성화 암컷' },
];

export default function PetEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { pet, setPet } = usePetStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileImage, setProfileImage] = useState('');
  const [profilePreview, setProfilePreview] = useState('');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<PetGender | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [bio, setBio] = useState('');
  const [personality, setPersonality] = useState('');
  const [favorites, setFavorites] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 기존 데이터 로드
  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient<PetAccount>(`/api/pets/${id}`);
        setName(data.name);
        setProfileImage(data.profileImage || '');
        setProfilePreview(data.profileImage || '');
        setBreed(data.breed || '');
        setGender((data.gender as PetGender) || '');
        setBirthDate(data.birthDate ? String(data.birthDate).split('T')[0] : '');
        setBio(data.bio || '');
        setPersonality(data.personality?.join(', ') || '');
        setFavorites(data.favorites?.join(', ') || '');
      } catch {
        setError('펫 정보를 불러올 수 없습니다');
      } finally {
        setInitialLoading(false);
      }
    }
    load();
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await apiClient<{ url: string }>('/api/upload/image', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      setProfileImage(data.url);
    } catch {
      setError('이미지 업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('이름은 필수입니다');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        profileImage: profileImage || undefined,
        breed: breed.trim() || undefined,
        gender: gender || undefined,
        birthDate: birthDate || undefined,
        bio: bio.trim() || undefined,
        personality: personality
          ? personality.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        favorites: favorites
          ? favorites.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const updated = await apiClient<PetAccount>(`/api/pets/${id}`, {
        method: 'PATCH',
        body,
      });

      // pet store 업데이트
      if (pet?.id === id) {
        setPet(updated);
      }

      router.push(`/pet/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600">
          <IoArrowBack size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-900">프로필 편집</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Image */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative h-28 w-28 overflow-hidden rounded-full bg-gray-100"
          >
            {profilePreview ? (
              <img src={profilePreview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                <IoCamera size={28} />
                <span className="mt-1 text-xs">사진 변경</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 rounded-full bg-orange-500 p-1.5 text-white">
              <IoCamera size={14} />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">이름 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="반려동물 이름"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* Breed */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">품종</label>
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="예: 포메라니안, 러시안블루"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">성별</label>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(opt.value)}
                className={`rounded-xl border py-2.5 text-sm ${
                  gender === opt.value
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Birth Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">생일</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">소개</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="반려동물을 소개해주세요"
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* Personality */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">성격</label>
          <input
            type="text"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="쉼표로 구분 (예: 활발, 친근, 장난꾸러기)"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* Favorites */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">좋아하는 것</label>
          <input
            type="text"
            value={favorites}
            onChange={(e) => setFavorites(e.target.value)}
            placeholder="쉼표로 구분 (예: 산책, 간식, 공놀이)"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-gray-300 py-3.5 text-sm font-medium text-gray-600"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
