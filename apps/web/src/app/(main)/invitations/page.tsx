'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import { IoCheckmark, IoClose, IoChevronBack } from 'react-icons/io5';

interface Invitation {
  id: string;
  petAccountId: string;
  role: string;
  status: string;
  createdAt: string;
  petAccount: {
    id: string;
    name: string;
    species: string;
    profileImage?: string;
  };
  inviter?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
}

export default function InvitationsPage() {
  const router = useRouter();
  const { fetchMyPet } = usePetStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient<Invitation[]>('/api/pets/invitations');
        setInvitations(data);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAccept = async (invitationId: string) => {
    try {
      await apiClient(`/api/pets/invitations/${invitationId}/accept`, { method: 'POST' });
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      await fetchMyPet();
      router.replace('/feed');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '수락 실패');
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      await apiClient(`/api/pets/invitations/${invitationId}/reject`, { method: 'POST' });
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '거절 실패');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <button onClick={() => router.back()} className="text-gray-600">
          <IoChevronBack size={24} />
        </button>
        <h1 className="text-base font-semibold">받은 초대</h1>
      </div>

      {invitations.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl">📬</p>
          <p className="mt-3 text-sm text-gray-500">받은 초대가 없습니다</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-4">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-gray-200">
                {inv.petAccount.profileImage ? (
                  <img src={inv.petAccount.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl">🐾</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {inv.petAccount.name}의 집사 초대
                </p>
                {inv.inviter && (
                  <p className="text-xs text-gray-500">
                    {inv.inviter.name}님이 초대했습니다
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(inv.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white"
                >
                  <IoCheckmark size={18} />
                </button>
                <button
                  onClick={() => handleReject(inv.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600"
                >
                  <IoClose size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
