'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import { IoCamera, IoChevronForward } from 'react-icons/io5';
import type { PetAccount, PetSpecies, PetGender } from '@pettopia/types';

const SPECIES_OPTIONS: { value: PetSpecies; label: string; emoji: string }[] = [
  { value: 'DOG', label: '강아지', emoji: '🐕' },
  { value: 'CAT', label: '고양이', emoji: '🐈' },
  { value: 'BIRD', label: '새', emoji: '🐦' },
  { value: 'RABBIT', label: '토끼', emoji: '🐇' },
  { value: 'HAMSTER', label: '햄스터', emoji: '🐹' },
  { value: 'FISH', label: '물고기', emoji: '🐠' },
  { value: 'REPTILE', label: '파충류', emoji: '🦎' },
  { value: 'OTHER', label: '기타', emoji: '🐾' },
];

const GENDER_OPTIONS: { value: PetGender; label: string }[] = [
  { value: 'MALE', label: '수컷' },
  { value: 'FEMALE', label: '암컷' },
  { value: 'NEUTERED_MALE', label: '중성화 수컷' },
  { value: 'SPAYED_FEMALE', label: '중성화 암컷' },
];

export default function PetRegisterPage() {
  const router = useRouter();
  const { pet, fetchMyPet, setPet } = usePetStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileImage, setProfileImage] = useState('');
  const [profilePreview, setProfilePreview] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('DOG');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<PetGender | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 이미 펫이 있으면 리다이렉트
  useEffect(() => {
    if (pet) {
      router.replace('/feed');
    }
  }, [pet, router]);

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
      setProfilePreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileImage) {
      setError('프로필 사진은 필수입니다');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const newPet = await apiClient<PetAccount>('/api/pets', {
        method: 'POST',
        body: {
          name,
          species,
          profileImage,
          breed: breed || undefined,
          gender: gender || undefined,
          birthDate: birthDate || undefined,
          bio: bio || undefined,
        },
      });
      setPet(newPet);
      router.replace('/feed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '펫 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (pet) return null;

  return (
    <div className="px-4 py-6">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">펫 등록</h2>
        <p className="mt-1 text-sm text-gray-500">반려동물의 프로필을 만들어주세요</p>
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
                <span className="mt-1 text-xs">사진 추가</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
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

        {/* Species */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">종류 *</label>
          <div className="grid grid-cols-4 gap-2">
            {SPECIES_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSpecies(opt.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs ${
                  species === opt.value
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
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

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || uploading}
          className="flex w-full items-center justify-center gap-1 rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? '등록 중...' : '펫 등록하기'}
          {!loading && <IoChevronForward size={16} />}
        </button>
      </form>
    </div>
  );
}
