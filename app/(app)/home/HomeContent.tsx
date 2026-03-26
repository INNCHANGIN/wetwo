"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, User, Image as ImageIcon, Plus, ChevronRight, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

interface HomeContentProps {
  initialData: any;
  userId: string;
}

export default function HomeContent({ initialData, userId }: HomeContentProps) {
  const supabase = createClient();

  // D-day 계산 로직
  const calcDday = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const start = new Date(dateStr);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const { data: homeData } = useQuery({
    queryKey: ["home_data", userId],
    queryFn: async () => {
      const { data: couple } = await supabase
        .from("couples")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .single();
      
      if (!couple) return null;

      const todayStr = new Date().toISOString().split("T")[0];

      const [
        { data: myProfile },
        { data: partnerData },
        { data: nextEvents },
        { data: recentPhotos },
        { data: todaysDiaries }
      ] = await Promise.all([
        supabase.from("users").select("*").eq("id", userId).single(),
        supabase.from("couples").select("user1_id, user2_id").eq("id", couple.id).single(),
        supabase.from("events").select("*").eq("couple_id", couple.id).gte("date", todayStr).order("date", { ascending: true }).limit(1),
        supabase.from("photos").select("*").eq("couple_id", couple.id).order("taken_at", { ascending: false }).limit(3),
        supabase.from("diaries").select("author_id").eq("couple_id", couple.id).eq("diary_date", todayStr)
      ]);

      const partnerId = partnerData?.user1_id === userId ? partnerData?.user2_id : partnerData?.user1_id;
      let partnerProfile = null;
      if (partnerId) {
        const { data: pProfile } = await supabase.from("users").select("*").eq("id", partnerId).single();
        partnerProfile = pProfile;
      }

      return {
        couple,
        myProfile,
        partnerProfile,
        nextEvent: nextEvents?.[0],
        recentPhotos,
        todaysDiaries
      };
    },
    initialData,
    staleTime: 30 * 1000,
  });

  if (!homeData || !homeData.couple) return null;

  const { couple, myProfile, partnerProfile, nextEvent, recentPhotos, todaysDiaries } = homeData;
  const myDiary = todaysDiaries?.some((d: any) => d.author_id === userId);
  const partnerDiary = todaysDiaries?.some((d: any) => d.author_id === partnerProfile?.id);

  const firstMetDday = calcDday(couple.first_met_date);
  const weddingDday = calcDday(couple.wedding_date);

  return (
    <div className="flex flex-col bg-white min-h-[100vh] pb-24">
      {/* 새로운 D-day 텍스트 섹션 */}
      <section className="px-6 pt-10 pb-8 flex flex-col gap-2">
        {firstMetDday !== null && (
          <div className="flex items-center gap-2 text-[16px] font-medium text-[#191F28]">
            <span>💑</span>
            <span>시작한 지 D+{firstMetDday}</span>
          </div>
        )}
        {weddingDday !== null && (
          <div className="flex items-center gap-2 text-[16px] font-medium text-[#191F28]">
            <span>💍</span>
            <span>결혼한 지 D+{weddingDday}</span>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-8 px-6">
        {/* 섹션: 다가오는 일정 */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[17px] font-bold text-text flex items-center gap-2">
              <CalendarIcon size={18} className="text-primary" /> 다가오는 일정
            </h3>
          </div>
          <div className="bg-[#F9FAFB] p-5 rounded-2xl shadow-sm border border-border/40 flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer">
            {nextEvent ? (
              <>
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-text text-[16px]">{nextEvent.title}</p>
                  <p className="text-[13px] font-medium text-muted">
                    {new Date(nextEvent.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-[13px]">
                  D-{calcDday(nextEvent.date)}
                </div>
              </>
            ) : (
              <p className="w-full text-center text-muted py-2 text-[14px]">일정이 없어요</p>
            )}
          </div>
        </section>

        {/* 섹션: 기억하고 싶은 순간 */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[17px] font-bold text-text flex items-center gap-2">
              <ImageIcon size={18} className="text-primary" /> 우리들의 사진
            </h3>
            <Link href="/photos" className="text-[14px] font-medium text-muted">전체보기</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {recentPhotos && recentPhotos.length > 0 ? (
              recentPhotos.map((p: any) => (
                <div key={p.id} className="min-w-[120px] aspect-square bg-gray-100 rounded-xl overflow-hidden relative border border-border/30">
                  <Image src={p.storage_path} alt="photo" fill className="object-cover" />
                </div>
              ))
            ) : (
              <div className="w-full bg-[#F9FAFB] py-8 rounded-2xl border border-dashed border-border/40 text-center">
                <p className="text-[14px] text-muted">아직 사진이 없어요</p>
              </div>
            )}
          </div>
        </section>

        {/* 섹션: 오늘의 다이어리 */}
        <section>
          <h3 className="text-[17px] font-bold text-text mb-4">오늘의 다이어리</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/diary" className={`p-5 rounded-2xl border transition-all active:scale-95 flex flex-col items-center gap-2 ${myDiary ? 'bg-primary/5 border-primary/20' : 'bg-[#F9FAFB] border-border/40'}`}>
              <span className="text-[13px] font-bold text-muted">{myProfile?.nickname || "나"}</span>
              <span className={`text-[15px] font-bold ${myDiary ? 'text-primary' : 'text-text'}`}>{myDiary ? '작성 완료 ✅' : '지금 쓰기 ✍️'}</span>
            </Link>
            <div className={`p-5 rounded-2xl border flex flex-col items-center gap-2 ${partnerDiary ? 'bg-primary/5 border-primary/20' : 'bg-[#F9FAFB] border-border/40'}`}>
              <span className="text-[13px] font-bold text-muted">{partnerProfile?.nickname || "파트너"}</span>
              <span className="text-[15px] font-bold text-text">{partnerDiary ? '작성 완료 ✅' : '대기 중 💭'}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
