"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // 공개 경로는 허용 (이미 RootLayout에서 분기되지만 안전장치)
          if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
            setLoading(false);
            return;
          }
          router.replace("/login");
          return;
        }

        // 커플 연결 상태 체크 (APK 환경에서 미들웨어를 대신함)
        const { data: couple } = await supabase
          .from("couples")
          .select("id")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .limit(1)
          .single();

        if (!couple && pathname !== '/connect') {
          router.replace("/connect");
        } else if (couple && pathname === '/connect') {
          router.replace("/home");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("AuthGuard Error:", error);
        router.replace("/login");
      }
    }

    checkAuth();
  }, [supabase, router, pathname]);

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
