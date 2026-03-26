import { createServerClient } from "@/lib/supabase-server";
import { getCurrentCouple, getPartnerInfo, getDdayCount } from "@/lib/queries";
import Link from "next/link";
import { Heart, User, Image as ImageIcon, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function HomePage() {
  const supabase = createServerClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) redirect("/login");

  // 1. 초기 정보 (커플 및 내 프로필용 유저 객체) - 본문 쿼리들에 필수적이므로 먼저 수행
  const couple = await getCurrentCouple(currentUser.id);
  if (!couple) redirect("/connect");
  
  const todayStr = new Date().toISOString().split("T")[0];

  // 2. 병렬 데이터 페칭 (핵심 최적화)
  const [
    { data: myProfile },
    partnerProfile,
    { data: nextEvents },
    { data: recentPhotos },
    { data: todaysDiaries }
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", currentUser.id).single(),
    getPartnerInfo(couple.id, currentUser.id),
    supabase.from("events").select("*").eq("couple_id", couple.id).gte("date", todayStr).order("date", { ascending: true }).limit(1),
    supabase.from("photos").select("*").eq("couple_id", couple.id).order("taken_at", { ascending: false }).limit(3),
    supabase.from("diaries").select("author_id").eq("couple_id", couple.id).eq("diary_date", todayStr)
  ]);

  const dDay = getDdayCount(couple.anniversary_date);
  const annivDate = new Date(couple.anniversary_date);
  const formattedAnniversary = `${annivDate.getFullYear()}년 ${annivDate.getMonth() + 1}월 ${annivDate.getDate()}일`;

  const nextEvent = nextEvents?.[0];
  const myDiary = todaysDiaries?.some(d => d.author_id === currentUser.id);
  const partnerDiary = todaysDiaries?.some(d => d.author_id === partnerProfile?.id);

  // Helpers
  const renderAvatar = (url?: string | null, name?: string, isPriority = false) => {
    if (url) return (
       <div className="relative w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden text-surface">
         <Image 
           src={url} 
           alt={name || "user"} 
           fill 
           sizes="48px" 
           className="object-cover" 
           priority={isPriority}
         />
       </div>
    );
    return (
      <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center border-2 border-white shadow-sm text-muted font-bold">
        {name ? name[0].toUpperCase() : <User size={20} />}
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-surface min-h-[100vh]">
      {/* 섹션 1: D-day 카드 */}
      <section className="w-full bg-gradient-to-b from-[#FFF0F3] to-[#FFFFFF] pt-6 pb-12 px-6 rounded-b-[40px] flex flex-col items-center justify-center shadow-sm">
        <div className="bg-white/60 px-4 py-1.5 rounded-full mb-3 shadow-sm border border-white/40 backdrop-blur-sm">
          <p className="text-[13px] font-semibold text-[#FF6B6B]">우리 만난 지 💑</p>
        </div>
        <h2 className="text-[52px] font-extrabold text-[#FF6B6B] mb-1 tracking-tight">{dDay}일</h2>
        <p className="text-[14px] font-medium text-muted/80">{formattedAnniversary}부터</p>
      </section>

      {/* 섹션 2: 파트너 상태 카드 (D-day 카드에 살짝 걸쳐있게) */}
      <section className="px-6 -mt-6">
        <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-border/40 flex items-center justify-between">
          <div className="flex flex-col items-center gap-2 w-1/3">
            {renderAvatar(myProfile?.avatar_url, myProfile?.nickname, true)}
            <span className="text-[15px] font-bold text-text">{myProfile?.nickname || "나"}</span>
          </div>
          <div className="flex flex-col items-center justify-center px-4">
            <div className="w-10 h-10 bg-[#FF6B6B]/10 rounded-full flex items-center justify-center mb-1">
              <Heart className="text-[#FF6B6B] fill-[#FF6B6B] animate-pulse w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-muted">함께하는 중</span>
          </div>
          <div className="flex flex-col items-center gap-2 w-1/3">
            {renderAvatar(partnerProfile?.avatar_url, partnerProfile?.nickname, true)}
            <span className="text-[15px] font-bold text-text">{partnerProfile?.nickname || "파트너"}</span>
          </div>
        </div>
      </section>

      {/* 리스트형 카드 컴포넌트들 컨테이너 */}
      <div className="flex flex-col gap-6 px-6 pt-8 pb-6">
        
        {/* 섹션 3: 다음 기념일 */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[17px] font-bold text-text">다가오는 일정</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-border/40 flex justify-between items-center active:scale-[0.98] transition-transform cursor-pointer">
            {nextEvent ? (
              <>
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-text text-[16px]">{nextEvent.title}</p>
                  <p className="text-[13px] font-medium text-muted">
                    {new Date(nextEvent.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="bg-primary/10 text-primary font-bold px-3.5 py-1.5 rounded-full text-[14px]">
                  D-{getDdayCount(nextEvent.date)}
                </div>
              </>
            ) : (
              <Link href="/calendar" className="flex items-center justify-center w-full py-2 gap-2 text-[15px] font-semibold text-primary">
                <Plus size={18} strokeWidth={2.5} /> 새로운 일정 추가하기
              </Link>
            )}
          </div>
        </section>

        {/* 섹션 4: 최근 사진 */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[17px] font-bold text-text">우리의 추억</h3>
            <Link href="/photos" className="text-[14px] font-medium text-muted hover:text-text transition-colors">
              전체보기
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {recentPhotos && recentPhotos.length > 0 ? (
              recentPhotos.map(p => (
                <div key={p.id} className="min-w-[130px] aspect-square bg-gray-100 rounded-2xl overflow-hidden snap-center relative shadow-sm border border-border/50">
                  <Image src={p.storage_path} alt={p.caption || "사진"} fill sizes="(max-width: 768px) 130px, 130px" className="object-cover" />
                </div>
              ))
            ) : (
                <div className="w-full bg-white px-5 py-8 rounded-2xl border border-border/40 text-center shadow-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-3">
                    <ImageIcon className="text-primary/40 w-6 h-6" />
                  </div>
                  <p className="text-[14px] font-medium text-muted">첫 번째 사진을 올려보세요</p>
                  <Link href="/photos" className="mt-3 text-[13px] font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full active:scale-95 transition-transform">
                    사진 추가하기
                  </Link>
                </div>
            )}
          </div>
        </section>

        {/* 섹션 5: 오늘의 일기 */}
        <section>
          <h3 className="text-[17px] font-bold text-text mb-3">오늘의 일기</h3>
          <div className="flex gap-3">
            {/* 내 일기 */}
            <div className="flex-1 bg-white border border-border/40 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 shadow-sm">
              <span className="text-[14px] font-bold text-text">{myProfile?.nickname || "나"}</span>
              {myDiary ? (
                <div className="w-full max-w-[100px] bg-green-50 text-green-600 text-[12px] py-1.5 rounded-lg font-bold">
                  작성 완료 ✅
                </div>
              ) : (
                <Link href="/diary" className="w-full max-w-[100px] bg-[#F9FAFB] text-muted text-[12px] py-1.5 rounded-lg font-bold border border-border hover:bg-white transition-colors active:scale-95">
                  지금 쓰기 ✍️
                </Link>
              )}
            </div>

            {/* 파트너 일기 */}
            <div className="flex-1 bg-white border border-border/40 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 shadow-sm">
              <span className="text-[14px] font-bold text-text">{partnerProfile?.nickname || "파트너"}</span>
              {partnerDiary ? (
                <div className="w-full max-w-[100px] bg-green-50 text-green-600 text-[12px] py-1.5 rounded-lg font-bold">
                  작성 완료 ✅
                </div>
              ) : (
                <div className="w-full max-w-[100px] bg-white text-muted/50 text-[12px] py-1.5 rounded-lg font-medium">
                  아직 안 씀 💭
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
