export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* TODO: 사이드바 네비게이션 */}
      <nav className="w-64 border-r bg-white p-4">
        <h2 className="text-xl font-bold">Pettopia</h2>
        {/* TODO: 네비게이션 메뉴 */}
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
