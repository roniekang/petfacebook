'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IoCamera } from 'react-icons/io5';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface GuardianProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<GuardianProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwChanging, setPwChanging] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { guardian, logout } = useAuthStore();

  useEffect(() => {
    apiClient<GuardianProfile>('/api/users/me')
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone || '');
      })
      .catch(() => {});
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await apiClient<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      const updated = await apiClient<GuardianProfile>('/api/users/me', {
        method: 'PATCH',
        body: { profileImage: uploadRes.url },
      });

      setProfile(updated);
      // Update auth store
      const stored = localStorage.getItem('guardian');
      if (stored) {
        const g = JSON.parse(stored);
        g.profileImage = updated.profileImage;
        g.name = updated.name;
        localStorage.setItem('guardian', JSON.stringify(g));
      }
    } catch {
      // error
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const updated = await apiClient<GuardianProfile>('/api/users/me', {
        method: 'PATCH',
        body: { name, phone: phone || undefined },
      });
      setProfile(updated);
      setSaveMsg('저장되었습니다');
      // Update localStorage
      const stored = localStorage.getItem('guardian');
      if (stored) {
        const g = JSON.parse(stored);
        g.name = updated.name;
        g.phone = updated.phone;
        g.profileImage = updated.profileImage;
        localStorage.setItem('guardian', JSON.stringify(g));
      }
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg('');
    if (newPassword.length < 6) {
      setPwMsg('새 비밀번호는 6자 이상이어야 합니다');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg('새 비밀번호가 일치하지 않습니다');
      return;
    }
    setPwChanging(true);
    try {
      await apiClient('/api/users/me/password', {
        method: 'PATCH',
        body: { oldPassword, newPassword },
      });
      setPwMsg('비밀번호가 변경되었습니다');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMsg(err instanceof Error ? err.message : '비밀번호 변경 실패');
    } finally {
      setPwChanging(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiClient('/api/users/me', { method: 'DELETE' });
      logout();
    } catch (err) {
      alert(err instanceof Error ? err.message : '계정 삭제 실패');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Profile Header */}
      <div className="flex flex-col items-center bg-white px-4 py-6">
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-200">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">
                🐾
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 rounded-full bg-orange-500 p-2 text-white shadow-md"
          >
            <IoCamera size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
        <h2 className="mt-3 text-lg font-bold text-gray-900">{profile.name}</h2>
        <p className="text-sm text-gray-500">{profile.email}</p>
      </div>

      {/* Profile Edit */}
      <div className="mt-3 bg-white px-4 py-5">
        <h3 className="mb-4 text-sm font-bold text-gray-800">프로필 수정</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              전화번호
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
        {saveMsg && (
          <p className={`mt-2 text-xs ${saveMsg.includes('실패') ? 'text-red-500' : 'text-green-600'}`}>
            {saveMsg}
          </p>
        )}
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* Password Change - only for email provider */}
      {profile.provider === 'EMAIL' && (
        <div className="mt-3 bg-white px-4 py-5">
          <h3 className="mb-4 text-sm font-bold text-gray-800">비밀번호 변경</h3>
          <div className="space-y-3">
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="현재 비밀번호"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (6자 이상)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 확인"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
          {pwMsg && (
            <p className={`mt-2 text-xs ${pwMsg.includes('실패') || pwMsg.includes('일치') || pwMsg.includes('이상') ? 'text-red-500' : 'text-green-600'}`}>
              {pwMsg}
            </p>
          )}
          <button
            onClick={handleChangePassword}
            disabled={pwChanging || !oldPassword || !newPassword}
            className="mt-4 w-full rounded-xl bg-gray-800 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pwChanging ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="mt-3 bg-white px-4 py-4">
        <button
          onClick={logout}
          className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700"
        >
          로그아웃
        </button>
      </div>

      {/* Delete Account */}
      <div className="mt-3 bg-white px-4 py-4">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full text-center text-sm text-red-500"
        >
          계정 삭제
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-gray-900">계정 삭제</h3>
            <p className="mt-2 text-sm text-gray-500">
              정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
