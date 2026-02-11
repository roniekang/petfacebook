'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IoAddCircle } from 'react-icons/io5';
import { apiClient } from '@/lib/api-client';
import { usePetStore } from '@/stores/pet-store';
import { StoryViewer } from './story-viewer';

interface StoryPetAccount {
  id: string;
  name: string;
  profileImage?: string | null;
}

interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  createdAt: string;
  expiresAt: string;
  petAccount?: StoryPetAccount;
}

interface StoryGroup {
  petAccount: StoryPetAccount;
  stories: StoryItem[];
  latestAt: string;
}

interface StoryFeedResponse {
  storyGroups: StoryGroup[];
}

export function StoryBar() {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const pet = usePetStore((s) => s.pet);
  const router = useRouter();

  useEffect(() => {
    if (!pet) return;
    apiClient<StoryFeedResponse>('/api/stories/feed')
      .then((data) => setGroups(data.storyGroups))
      .catch(() => {});
  }, [pet]);

  const handleAvatarClick = (index: number) => {
    setViewerStartIndex(index);
    setViewerOpen(true);
  };

  // Check if current pet has stories
  const myGroup = groups.find((g) => g.petAccount.id === pet?.id);
  const hasMyStory = !!myGroup;

  // Build display list: my pet first (always shown), then others
  const otherGroups = groups.filter((g) => g.petAccount.id !== pet?.id);

  return (
    <>
      <div className="border-b border-gray-100 bg-white py-3">
        <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide">
          {/* My pet - always show */}
          {pet && (
            <div className="flex flex-shrink-0 flex-col items-center gap-1">
              <div className="relative">
                <button
                  onClick={() =>
                    hasMyStory
                      ? handleAvatarClick(groups.indexOf(myGroup!))
                      : router.push('/story/create')
                  }
                  className={`h-16 w-16 overflow-hidden rounded-full bg-gray-200 ${
                    hasMyStory
                      ? 'ring-2 ring-orange-500'
                      : 'ring-2 ring-dashed ring-gray-300'
                  }`}
                >
                  {pet.profileImage ? (
                    <img
                      src={pet.profileImage}
                      alt={pet.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      🐾
                    </div>
                  )}
                </button>
                <button
                  onClick={() => router.push('/story/create')}
                  className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white"
                >
                  <IoAddCircle size={22} className="text-orange-500" />
                </button>
              </div>
              <span className="w-16 truncate text-center text-[11px] font-medium text-gray-700">
                내 스토리
              </span>
            </div>
          )}

          {/* Friend stories */}
          {otherGroups.map((group) => {
            const globalIndex = groups.indexOf(group);
            return (
              <button
                key={group.petAccount.id}
                onClick={() => handleAvatarClick(globalIndex)}
                className="flex flex-shrink-0 flex-col items-center gap-1"
              >
                <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200 ring-2 ring-orange-500">
                  {group.petAccount.profileImage ? (
                    <img
                      src={group.petAccount.profileImage}
                      alt={group.petAccount.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      🐾
                    </div>
                  )}
                </div>
                <span className="w-16 truncate text-center text-[11px] font-medium text-gray-700">
                  {group.petAccount.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {viewerOpen && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          startGroupIndex={viewerStartIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
