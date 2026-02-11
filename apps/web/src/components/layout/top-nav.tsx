'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoSearchOutline, IoSettingsOutline } from 'react-icons/io5';
import { PetSelector } from './pet-selector';

export function TopNav() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {pathname === '/feed' ? (
            <Link href="/feed" className="text-xl font-bold text-orange-500">
              Pettopia
            </Link>
          ) : (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          <PetSelector />
          <Link
            href="/search"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <IoSearchOutline size={22} className="text-gray-700" />
          </Link>
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <IoSettingsOutline size={22} className="text-gray-700" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function getTitle(pathname: string) {
  if (pathname === '/feed') return 'Pettopia';
  if (pathname === '/friends') return '친구';
  if (pathname === '/pet/register') return '펫 등록';
  if (pathname.startsWith('/pet/')) return '프로필';
  if (pathname === '/profile') return '설정';
  if (pathname.startsWith('/story')) return '스토리';
  if (pathname.startsWith('/walk')) return '산책';
  return 'Pettopia';
}
