"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import MyPageContent from "./MyPageContent";

export default function MyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ profile: any, couple: any, partnerNickname: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

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

        if (!couple) {
          router.push("/connect");
          return;
        }

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

        setData({
          profile,
          couple,
          partnerNickname
        });
      } catch (error) {
        console.error("Error loading mypage data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <MyPageContent 
      initialProfile={data.profile} 
      initialCouple={data.couple} 
      partnerNickname={data.partnerNickname}
    />
  );
}
