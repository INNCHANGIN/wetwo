"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { ChevronLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes("Email not confirmed")) {
        setError("이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.");
      } else if (signInError.status === 400) {
        setError("이메일이나 비밀번호가 올바르지 않습니다.");
      } else {
        setError(`로그인 오류: ${signInError.message} (상태: ${signInError.status || 'unknown'})`);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      // 커플 정보 확인
      const { data: couple } = await supabase
        .from("couples")
        .select("id")
        .or(`user1_id.eq.${data.user.id},user2_id.eq.${data.user.id}`)
        .single();
        
      if (couple) {
        router.push("/home");
      } else {
        router.push("/connect");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 pt-[60px] px-6">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-muted mb-6 active:opacity-70 transition-opacity">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[28px] leading-tight font-bold text-text mb-2">We Two 💑</h1>
        <p className="text-base text-muted mb-10">우리를 위한 특별한 공간</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[56px] px-4 bg-surface rounded-xl focus:outline-none placeholder:text-muted/60 text-[17px] text-text" 
              placeholder="이메일" 
            />
          </div>
          <div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[56px] px-4 bg-surface rounded-xl focus:outline-none placeholder:text-muted/60 text-[17px] text-text" 
              placeholder="비밀번호" 
            />
          </div>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

          <button 
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-[56px] mt-4 bg-primary text-white rounded-xl font-semibold text-[17px] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "로그인"}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link href="/signup" className="text-[15px] font-medium text-muted hover:text-text transition-colors">
            아직 계정이 없으신가요? <span className="text-primary font-semibold">회원가입하기</span>
          </Link>
        </div>

        {/* 빌드 디버그 정보 (APK 문제 진단용, 실제 서비스 시 숨기거나 관리자용으로 사용 가능) */}
        {process.env.NODE_ENV === 'production' && (
          <div className="mt-auto pb-6 text-center">
            <p className="text-[10px] text-muted/30">
              Config: {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ? '⚠️ Placeholder' : '✅ Production'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
