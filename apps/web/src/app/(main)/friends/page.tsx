'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import { IoPersonAddOutline, IoCheckmark, IoClose, IoAdd } from 'react-icons/io5';

interface FriendEntry {
  friendshipId: string;
  friend: {
    id: string;
    name: string;
    profileImage?: string;
    species: string;
  };
  method: string;
  acceptedAt: string;
}

interface FriendRequestEntry {
  id: string;
  requesterId: string;
  status: string;
  createdAt: string;
  requester: {
    id: string;
    name: string;
    profileImage?: string;
    species: string;
  };
}

export default function FriendsPage() {
  const pet = usePetStore((s) => s.pet);
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pet) return;
    async function load() {
      setLoading(true);
      try {
        const [friendsData, requestsData] = await Promise.all([
          apiClient<FriendEntry[]>('/api/friends'),
          apiClient<FriendRequestEntry[]>('/api/friends/requests'),
        ]);
        setFriends(friendsData);
        setRequests(requestsData);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pet]);

  const handleAccept = async (requestId: string) => {
    try {
      await apiClient(`/api/friends/requests/${requestId}/accept`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      const friendsData = await apiClient<FriendEntry[]>('/api/friends');
      setFriends(friendsData);
    } catch {
      // error
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await apiClient(`/api/friends/requests/${requestId}/reject`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      // error
    }
  };

  if (!pet) {
    return (
      <div className="px-4 py-20 text-center text-gray-500">
        펫을 먼저 등록해주세요
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
      {/* Header with add button */}
      <div className="flex items-center justify-between px-4 py-2">
        <span />
        <Link
          href="/friends/add"
          className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <IoAdd size={16} />
          친구 추가
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('friends')}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            tab === 'friends'
              ? 'border-b-2 border-orange-500 text-orange-500'
              : 'text-gray-500'
          }`}
        >
          친구 {friends.length}
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`relative flex-1 py-3 text-center text-sm font-medium ${
            tab === 'requests'
              ? 'border-b-2 border-orange-500 text-orange-500'
              : 'text-gray-500'
          }`}
        >
          요청 {requests.length}
          {requests.length > 0 && (
            <span className="absolute right-1/4 top-2 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="py-16 text-center">
              <IoPersonAddOutline size={48} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">아직 친구가 없어요</p>
              <p className="text-xs text-gray-400">다른 펫에게 친구 요청을 보내보세요</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {friends.map((entry) => (
                <Link
                  key={entry.friendshipId}
                  href={`/pet/${entry.friend.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                    {entry.friend.profileImage ? (
                      <img
                        src={entry.friend.profileImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg">🐾</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{entry.friend.name}</p>
                    <p className="text-xs text-gray-500">{speciesLabel(entry.friend.species)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests list */}
      {tab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500">받은 친구 요청이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/pet/${req.requester.id}`}>
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                      {req.requester.profileImage ? (
                        <img
                          src={req.requester.profileImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg">
                          🐾
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{req.requester.name}</p>
                    <p className="text-xs text-gray-500">{speciesLabel(req.requester.species)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(req.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white"
                    >
                      <IoCheckmark size={18} />
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
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
      )}
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
