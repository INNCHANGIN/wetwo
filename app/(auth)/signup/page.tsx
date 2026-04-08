"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronLeft } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !email || !password) return;
    setLoading(true);
    setError("");

    // 1. Supabase Auth 계정 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname, // auth metadata에 임시 저장 (옵션)
        }
      }
    });

    if (authError || !authData.user) {
      const errorMap: Record<string, string> = {
        'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 해요.',
        'User already registered': '이미 사용 중인 이메일이에요.',
        'Invalid email': '이메일 형식이 올바르지 않아요.',
      };
      const msg = errorMap[authError?.message || ""] ?? '회원가입에 실패했어요. 다시 시도해주세요.';
      setError(msg);
      setLoading(false);
      return;
    }

    // 2. public.users 테이블에 프로필 레코드 생성
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: email,
        nickname: nickname,
      });

    if (profileError) {
      console.error(profileError);
      // 보안 룰이나 권한 이슈가 있을 경우 실패할 수 있음
    }

    // 3. 바로 연결 페이지로 이동 (이메일 인증이 꺼져 있는 경우 바로 로그온 상태)
    router.push("/connect");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 pt-[60px] px-6">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-muted mb-6 active:opacity-70 transition-opacity">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[28px] leading-tight font-bold text-text mb-2">반가워요! 👋</h1>
        <p className="text-base text-muted mb-10">간단한 정보만 입력하면 끝나요</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full h-[56px] px-4 bg-surface text-text rounded-xl focus:outline-none placeholder:text-muted/60 text-[17px]" 
              placeholder="내 이름 (상대에게 보여요)" 
            />
          </div>
          <div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[56px] px-4 bg-surface text-text rounded-xl focus:outline-none placeholder:text-muted/60 text-[17px]" 
              placeholder="이메일" 
            />
          </div>
          <div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[56px] px-4 bg-surface text-text rounded-xl focus:outline-none placeholder:text-muted/60 text-[17px]" 
              placeholder="비밀번호" 
            />
            {password.length > 0 && password.length < 6 && (
              <p className="text-[13px] text-muted mt-1">비밀번호는 6자 이상이어야 해요</p>
            )}
          </div>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

          <div className="h-2" />

          <button 
            type="submit"
            disabled={loading || !nickname || !email || !password || password.length < 6}
            className="w-full h-[56px] bg-primary text-white rounded-xl font-semibold text-[17px] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "회원가입 완료"}
          </button>
        </form>
      </div>
    </div>
  );
}
