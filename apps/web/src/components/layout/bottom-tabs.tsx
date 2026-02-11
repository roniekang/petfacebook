'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IoHomeOutline,
  IoHome,
  IoPeopleOutline,
  IoPeople,
  IoWalkOutline,
  IoWalk,
  IoPawOutline,
  IoPaw,
} from 'react-icons/io5';
import { usePetStore } from '@/stores/pet-store';

const tabs = [
  { href: '/feed', label: '홈', Icon: IoHomeOutline, ActiveIcon: IoHome },
  { href: '/friends', label: '친구', Icon: IoPeopleOutline, ActiveIcon: IoPeople },
  { href: '/walk', label: '산책', Icon: IoWalkOutline, ActiveIcon: IoWalk },
  { href: '__pet__', label: '내 펫', Icon: IoPawOutline, ActiveIcon: IoPaw },
];

export function BottomTabs() {
  const pathname = usePathname();
  const pet = usePetStore((s) => s.pet);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const href = tab.href === '__pet__'
            ? pet ? `/pet/${pet.id}` : '/pet/register'
            : tab.href;
          const isActive = tab.href === '__pet__'
            ? pathname.startsWith('/pet/')
            : tab.href === '/walk'
              ? pathname.startsWith('/walk')
              : pathname === tab.href;
          const Icon = isActive ? tab.ActiveIcon : tab.Icon;

          return (
            <Link
              key={tab.label}
              href={href}
              className={`flex flex-col items-center gap-0.5 ${
                isActive ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              {tab.href === '__pet__' && pet?.profileImage ? (
                <div
                  className={`h-6 w-6 overflow-hidden rounded-full border-2 ${
                    isActive ? 'border-orange-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={pet.profileImage}
                    alt={pet.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <Icon size={24} />
              )}
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
