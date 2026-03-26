"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ConnectPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setInitLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setInitLoading(false);
          return;
        }

        if (user) {
          setCurrentUser(user);
          const { data: couple } = await supabase
            .from("couples")
            .select("id")
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .single();
            
          if (couple) {
            router.push("/home");
            return;
          }
        } else {
          router.push("/login");
          return;
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setInitLoading(false);
      }
    };
    init();
  }, [supabase, router]);

  const generateCode = async () => {
    if (!currentUser) {
      setError("로그인 정보가 없습니다. 다시 로그인해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    
    try {
      // 0. 프로필이 있는지 확인 (없으면 생성 - 트리거 미작동 대비)
      const { data: profile } = await supabase.from("users").select("id").eq("id", currentUser.id).single();
      if (!profile) {
        await supabase.from("users").insert({
          id: currentUser.id,
          email: currentUser.email,
          nickname: currentUser.user_metadata?.nickname || "사용자"
        });
      }

      // 1. 6자리 랜덤 대문자+숫자 코드
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const today = new Date().toISOString().split('T')[0];

      const { error: insertError } = await supabase
        .from("couples")
        .insert({
          user1_id: currentUser.id,
          user2_id: null,
          anniversary_date: today,
          invite_code: code,
        });

      if (insertError) {
        setError(`생성 실패: ${insertError.message}`);
      } else {
        router.push("/home");
      }
    } catch (e: any) {
      setError(`시스템 오류: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const connectPartner = async () => {
    if (!currentUser || !inputCode) return;
    setLoading(true);
    setError("");

    const upperCode = inputCode.toUpperCase();
    console.log("Attempting to connect with code:", upperCode);

    // 입력한 코드의 커플 정보 찾기
    const { data: couple, error: findError } = await supabase
      .from("couples")
      .select("*")
      .eq("invite_code", upperCode)
      .is("user2_id", null)
      .single();

    console.log("Find couple result:", { couple, findError });

    if (findError || !couple) {
      console.error("Find error details:", findError);
      setError("유효하지 않거나 이미 연결된 코드입니다. (상세 에러는 콘솔 확인)");
      setLoading(false);
      return;
    }

    if (couple.user1_id === currentUser.id) {
      setError("본인의 코드는 입력할 수 없습니다.");
      setLoading(false);
      return;
    }

    // 커플 파트너로 내 아이디 업데이트
    console.log("Updating couple with partner ID:", currentUser.id);
    const { error: updateError } = await supabase
      .from("couples")
      .update({ user2_id: currentUser.id })
      .eq("id", couple.id);

    if (updateError) {
      console.error("Update error details:", updateError);
      setError(`상대방과 연결하는 데 실패했습니다: ${updateError.message}`);
      setLoading(false);
      return;
    }

    // 성공 시 홈으로 이동
    router.push("/home");
  };

  if (initLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted text-sm font-medium">정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 pt-[60px] px-6">
        <h1 className="text-[28px] leading-tight font-bold text-text mb-2">커플 연결하기</h1>
        <p className="text-base text-muted mb-6">우리 둘만의 공간을 시작해볼까요?</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {inviteCode ? (
          <div className="flex flex-col items-center mt-12 bg-surface p-8 rounded-2xl">
            <span className="text-sm font-medium text-muted mb-2">초대 코드</span>
            <div className="text-[40px] font-bold text-primary tracking-[0.2em]">{inviteCode}</div>
            <p className="text-sm text-center text-muted mt-6">
              상대방에게 위 코드를 알려주세요.<br />
              상대가 코드를 입력하면 연결이 완료됩니다.
            </p>
            <button 
              onClick={() => router.push("/home")}
              className="mt-8 text-[15px] font-medium text-primary active:scale-95 transition"
            >
              연결 대기중... 홈으로 가기 (새로고침)
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 mt-4">
            {/* 새 코드 만들기 영역 */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={generateCode}
                disabled={loading}
                className="w-full h-[56px] bg-primary text-white rounded-xl font-semibold text-[17px] active:scale-[0.98] transition-transform flex items-center justify-center disabled:opacity-50"
              >
                {loading ? "생성 중..." : "새로운 커플 코드 만들기"}
              </button>
              <p className="text-center text-sm text-muted">아직 코드가 없다면 내가 먼저 만들어요</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-sm text-muted">또는</span>
              <div className="h-px bg-border flex-1" />
            </div>

            {/* 코드 입력하기 영역 */}
            <div className="flex flex-col gap-3 border border-border p-5 rounded-2xl bg-surface/50">
              <label className="text-sm font-semibold text-text">코드를 받았나요?</label>
              <input 
                type="text" 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                maxLength={6}
                className="w-full h-[56px] px-4 bg-white border border-border rounded-xl focus:outline-none focus:border-primary text-center text-xl tracking-[0.2em] font-bold placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/50 uppercase" 
                placeholder="코드 6자리 입력" 
              />
              <button 
                onClick={connectPartner}
                disabled={loading || inputCode.length !== 6}
                className="w-full h-[48px] mt-2 bg-white border border-border text-text rounded-xl font-medium text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                코드 확인하고 연결하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
