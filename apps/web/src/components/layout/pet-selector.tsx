'use client';

import { usePetStore } from '@/stores/pet-store';
import Link from 'next/link';

export function PetSelector() {
  const { pet } = usePetStore();

  if (!pet) {
    return (
      <Link
        href="/pet/register"
        className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-medium text-white"
      >
        펫 등록
      </Link>
    );
  }

  return (
    <Link
      href={`/pet/${pet.id}`}
      className="flex items-center gap-1.5 rounded-full border border-gray-200 py-1 pl-1 pr-2.5 hover:bg-gray-50"
    >
      <div className="h-6 w-6 overflow-hidden rounded-full bg-gray-200">
        {pet.profileImage && (
          <img src={pet.profileImage} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <span className="max-w-[60px] truncate text-sm font-medium text-gray-800">
        {pet.name}
      </span>
    </Link>
  );
}
