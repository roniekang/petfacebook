'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { usePetStore } from '@/stores/pet-store';

const PUBLIC_PATHS = ['/login', '/register', '/'];
const PET_SETUP_PATHS = ['/pet/register', '/invitations'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const { pet, fetchMyPet } = usePetStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated) {
      fetchMyPet();

      if (pathname === '/login' || pathname === '/register') {
        router.replace('/feed');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, fetchMyPet]);

  // 펫이 없으면 등록 또는 초대 수락 페이지로 리다이렉트
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const isPetSetupPath = PET_SETUP_PATHS.some((p) => pathname.startsWith(p));
    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (pet === null && !isPetSetupPath && !isPublicPath && !usePetStore.getState().isLoading) {
      // pet이 null이고 로딩이 끝났으면 등록 페이지로
      // (fetchMyPet 완료 후에만 리다이렉트)
    }
  }, [pet, isAuthenticated, isLoading, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
