import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import MyPageContent from "./MyPageContent";

export default async function MyPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 유저 정보 (닉네임, 이메일 등)
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // 커플 정보 (D-day 날짜들, 초대 코드 등)
  const { data: couple } = await supabase
    .from("couples")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single();

  if (!couple) redirect("/connect");

  // 상대방 정보
  const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
  let partnerNickname = "미연결";
  
  if (partnerId) {
    const { data: partner } = await supabase
      .from("users")
      .select("nickname")
      .eq("id", partnerId)
      .single();
    if (partner) partnerNickname = partner.nickname;
  }

  return (
    <MyPageContent 
      initialProfile={profile} 
      initialCouple={couple} 
      partnerNickname={partnerNickname}
    />
  );
}
