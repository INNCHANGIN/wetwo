"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, Calendar, Image as ImageIcon, FileText, Beer, UserCircle, Bell } from "lucide-react";
import AuthGuard from "@/components/providers/AuthGuard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() || "";

  const getPageTitle = () => {
    if (pathname.includes("/home")) return "우리 홈";
    if (pathname.includes("/calendar")) return "캘린더";
    if (pathname.includes("/photos")) return "사진첩";
    if (pathname.includes("/memo")) return "메모장";
    if (pathname.includes("/brewing")) return "브루잉 일지";
    if (pathname.includes("/mypage")) return "마이페이지";
    if (pathname.includes("/settings")) return "설정";
    return "";
  };

  return (
    <div className="flex flex-col min-h-screen relative w-full h-full">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md flex items-end justify-between px-6 pb-3 min-h-[calc(56px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b border-border/50">
        <h1 className="text-lg font-bold text-text leading-none">{getPageTitle()}</h1>
        <div className="flex items-center gap-4">
          <button className="text-text hover:text-primary transition-colors active:scale-95">
            <Bell size={24} strokeWidth={2} />
          </button>
          <Link href="/mypage" className="text-text hover:text-primary transition-colors active:scale-95">
            <UserCircle size={24} strokeWidth={2} />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 w-full bg-white pb-[80px]">
        <AuthGuard>
          {children}
        </AuthGuard>
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-[#E5E8EB] flex justify-around items-center h-[calc(64px+env(safe-area-inset-bottom))] px-2 pb-[env(safe-area-inset-bottom)] z-50">
        <NavItem href="/home" icon={Home} label="홈" current={pathname} router={router} />
        <NavItem href="/calendar" icon={Calendar} label="캘린더" current={pathname} router={router} />
        <NavItem href="/photos" icon={ImageIcon} label="포토" current={pathname} router={router} />
        <NavItem href="/memo" icon={FileText} label="메모" current={pathname} router={router} />
        <NavItem href="/brewing" icon={Beer} label="브루잉" current={pathname} router={router} />
      </nav>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, current, router }: { href: string; icon: any; label: string; current: string; router: any }) {
  const isActive = current.startsWith(href);

  const handlePrefetch = () => {
    router.prefetch(href);
  };

  return (
    <Link 
      href={href} 
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-all outline-none"
    >
      <Icon 
        size={24} 
        strokeWidth={isActive ? 2.5 : 2} 
        className={isActive ? "text-primary" : "text-muted"} 
      />
      <span className={`font-medium ${isActive ? 'text-[14px] text-primary' : 'text-[12px] text-muted'}`}>
        {label}
      </span>
    </Link>
  );
}
