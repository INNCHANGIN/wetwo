"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, ChevronRight, Copy, LogOut, X, Camera } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface MyPageContentProps {
  initialProfile: any;
  initialCouple: any;
  partnerNickname: string;
}

export default function MyPageContent({ initialProfile, initialCouple, partnerNickname }: MyPageContentProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNickname, setNewNickname] = useState(initialProfile.nickname);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. 유저 프로필 쿼리
  const { data: profile } = useQuery({
    queryKey: ["profile", initialProfile.id],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("*").eq("id", initialProfile.id).single();
      return data;
    },
    initialData: initialProfile,
  });

  // 2. 커플 정보 쿼리
  const { data: couple } = useQuery({
    queryKey: ["couple", initialProfile.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("couples")
        .select("*")
        .or(`user1_id.eq.${initialProfile.id},user2_id.eq.${initialProfile.id}`)
        .single();
      return data;
    },
    initialData: initialCouple,
  });

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) return;
    setIsUpdating(true);
    const { error } = await supabase
      .from("users")
      .update({ nickname: newNickname })
      .eq("id", profile.id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["profile", profile.id] });
      showToast("닉네임이 변경되었습니다 ✓");
      setIsModalOpen(false);
    }
    setIsUpdating(false);
  };

  const handleUpdateDate = async (field: string, value: string) => {
    const { error } = await supabase
      .from("couples")
      .update({ [field]: value })
      .eq("id", couple.id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["couple", profile.id] });
      showToast("저장되었습니다 ✓");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("복사되었습니다");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface pb-20">
      {/* 상단 프로필 영역 */}
      <div className="bg-white px-6 pt-10 pb-8 flex flex-col items-center gap-4 rounded-b-[40px] shadow-sm">
        <div className="relative group cursor-pointer" onClick={() => showToast("이미지 변경 기능 준비 중")}>
          <div className="w-[84px] h-[84px] rounded-full overflow-hidden bg-gray-100 border-2 border-primary/10 relative">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="profile" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary text-2xl font-bold">
                {profile.nickname[0]}
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-border">
            <Camera size={14} className="text-muted" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-[20px] font-bold text-text mb-1">{profile.nickname}</h2>
          <p className="text-[13px] text-muted font-medium">{profile.email}</p>
        </div>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-6">
        {/* 섹션 1: 내 정보 */}
        <section>
          <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-border/40">
            <button onClick={() => setIsModalOpen(true)} className="w-full h-[56px] px-6 flex items-center justify-between active:bg-gray-50 transition-colors border-b border-border/30">
              <span className="text-[15px] font-bold text-text">닉네임</span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-muted font-medium">{profile.nickname}</span>
                <ChevronRight size={18} className="text-muted/40" />
              </div>
            </button>
            <button className="w-full h-[56px] px-6 flex items-center justify-between active:bg-gray-50 transition-colors">
              <span className="text-[15px] font-bold text-text">프로필 사진</span>
              <div className="flex items-center gap-1">
                <span className="text-[15px] text-primary font-bold">변경</span>
                <ChevronRight size={18} className="text-muted/40" />
              </div>
            </button>
          </div>
        </section>

        {/* 섹션 2: D-day 설정 */}
        <section>
          <h3 className="px-2 text-[13px] font-bold text-muted mb-2 uppercase tracking-wider">기념일 설정</h3>
          <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-border/40 px-6">
            <div className="h-[72px] flex items-center justify-between border-b border-border/30">
              <span className="text-[15px] font-bold text-text">💑 시작한 날</span>
              <input 
                type="date" 
                value={couple.first_met_date || ""} 
                onChange={(e) => handleUpdateDate("first_met_date", e.target.value)}
                className="text-[15px] font-bold text-primary bg-transparent outline-none cursor-pointer"
              />
            </div>
            <div className="h-[72px] flex items-center justify-between">
              <span className="text-[15px] font-bold text-text">💍 결혼한 날</span>
              <input 
                type="date" 
                value={couple.wedding_date || ""}
                onChange={(e) => handleUpdateDate("wedding_date", e.target.value)}
                className="text-[15px] font-bold text-primary bg-transparent outline-none cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* 섹션 3: 커플 연결 */}
        <section>
          <h3 className="px-2 text-[13px] font-bold text-muted mb-2 uppercase tracking-wider">커플 커넥트</h3>
          <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-border/40">
            <button 
              onClick={() => copyToClipboard(couple.invite_code)}
              className="w-full min-h-[72px] px-6 py-4 flex flex-col justify-center gap-1 active:bg-gray-50 transition-colors border-b border-border/30 text-left"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[15px] font-bold text-text">내 커플 코드</span>
                <Copy size={16} className="text-primary" />
              </div>
              <p className="text-[18px] font-black text-text tracking-[4px] uppercase">{couple.invite_code}</p>
            </button>
            <div className="h-[56px] px-6 flex items-center justify-between">
              <span className="text-[15px] font-bold text-text">연결된 상대</span>
              <span className="text-[15px] text-muted font-black">{partnerNickname}</span>
            </div>
          </div>
        </section>

        {/* 섹션 4: 계정 */}
        <section className="mb-8">
          <button 
            onClick={handleLogout}
            className="w-full h-[56px] px-6 bg-red-50 text-red-500 rounded-[20px] flex items-center justify-center gap-2 font-bold active:bg-red-100 transition-colors"
          >
            <LogOut size={20} /> 로그아웃
          </button>
        </section>
      </div>

      {/* 닉네임 수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[360px] bg-white rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold text-text">닉네임 수정</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted hover:text-text transition-colors">
                <X size={24} />
              </button>
            </div>
            <input 
              type="text" 
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="w-full h-[56px] bg-surface rounded-2xl px-5 text-[16px] font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-border/40 mb-8"
              placeholder="새로운 닉네임을 입력하세요"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-[56px] rounded-2xl font-bold text-muted bg-surface active:scale-95 transition-all"
              >
                취소
              </button>
              <button 
                onClick={handleUpdateNickname}
                disabled={isUpdating}
                className="flex-1 h-[56px] rounded-2xl font-bold text-white bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
