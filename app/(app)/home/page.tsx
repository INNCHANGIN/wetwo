import { createServerClient } from "@/lib/supabase-server";
import { getPartnerInfo } from "@/lib/queries";
import { redirect } from "next/navigation";
import HomeContent from "./HomeContent";

export default async function HomePage() {
  const supabase = createServerClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) redirect("/login");

  // 1. 커플 정보 (신규 컬럼 및 파트너 ID 파악용)
  const { data: couple } = await supabase
    .from("couples")
    .select("*")
    .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
    .single();

  if (!couple) redirect("/connect");
  
  const todayStr = new Date().toISOString().split("T")[0];

  // 2. 병렬 데이터 페칭 (이전 버전의 모든 섹션 데이터 복구)
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

  const initialData = {
    couple,
    myProfile,
    partnerProfile,
    nextEvent: nextEvents?.[0],
    recentPhotos,
    todaysDiaries
  };

  return <HomeContent initialData={initialData} userId={currentUser.id} />;
}
