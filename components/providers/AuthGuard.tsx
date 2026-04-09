"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, couple, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
        return;
      }
      router.replace("/login");
      return;
    }

    if (!couple && pathname !== '/connect') {
      router.replace("/connect");
    } else if (couple && pathname === '/connect') {
      router.replace("/home");
    }
  }, [user, couple, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted font-medium animate-pulse">인증 정보를 확인 중입니다...</p>
      </div>
    );
  }

  return <>{children}</>;
}
