'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IoClose } from 'react-icons/io5';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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
}

interface StoryGroup {
  petAccount: StoryPetAccount;
  stories: StoryItem[];
  latestAt: string;
}

interface StoryViewerProps {
  groups: StoryGroup[];
  startGroupIndex: number;
  onClose: () => void;
}

const IMAGE_DURATION = 5000; // 5 seconds

export function StoryViewer({ groups, startGroupIndex, onClose }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    clearTimer();
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, currentGroup, groups.length, onClose, clearTimer]);

  const goPrev = useCallback(() => {
    clearTimer();
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((i) => i - 1);
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [storyIndex, groupIndex, groups, clearTimer]);

  // Start image timer
  useEffect(() => {
    if (!currentStory) return;
    if (currentStory.mediaType === 'VIDEO') return;

    clearTimer();
    setProgress(0);
    const interval = 50; // update every 50ms
    let elapsed = 0;

    timerRef.current = setInterval(() => {
      elapsed += interval;
      setProgress(elapsed / IMAGE_DURATION);
      if (elapsed >= IMAGE_DURATION) {
        goNext();
      }
    }, interval);

    return clearTimer;
  }, [currentStory, goNext, clearTimer]);

  // Handle video end
  const handleVideoEnd = () => {
    goNext();
  };

  // Handle video time update for progress
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress(video.currentTime / video.duration);
    }
  };

  // Handle tap areas
  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goPrev();
    } else {
      goNext();
    }
  };

  if (!currentGroup || !currentStory) return null;

  const timeAgo = formatDistanceToNow(new Date(currentStory.createdAt), {
    locale: ko,
    addSuffix: true,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 px-3 pt-3">
        {currentGroup.stories.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width:
                  i < storyIndex
                    ? '100%'
                    : i === storyIndex
                      ? `${progress * 100}%`
                      : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute left-0 right-0 top-5 z-10 flex items-center justify-between px-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-600">
            {currentGroup.petAccount.profileImage ? (
              <img
                src={currentGroup.petAccount.profileImage}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-white">
                🐾
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-white">
            {currentGroup.petAccount.name}
          </span>
          <span className="text-xs text-white/60">{timeAgo}</span>
        </div>
        <button onClick={onClose} className="text-white">
          <IoClose size={28} />
        </button>
      </div>

      {/* Media content - tap area */}
      <div className="flex h-full items-center justify-center" onClick={handleTap}>
        {currentStory.mediaType === 'VIDEO' ? (
          <video
            ref={videoRef}
            src={currentStory.mediaUrl}
            autoPlay
            playsInline
            onEnded={handleVideoEnd}
            onTimeUpdate={handleVideoTimeUpdate}
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            src={currentStory.mediaUrl}
            alt=""
            className="h-full w-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
