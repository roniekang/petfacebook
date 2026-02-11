'use client';

import { TopNav } from '@/components/layout/top-nav';
import { BottomTabs } from '@/components/layout/bottom-tabs';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white">
      <TopNav />
      <main className="pb-16 pt-14">{children}</main>
      <BottomTabs />
    </div>
  );
}
