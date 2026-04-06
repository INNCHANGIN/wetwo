"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getPartnerInfo } from "@/lib/queries";
import HomeContent from "./HomeContent";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push("/login");
          return;
        }
        setUserId(currentUser.id);

        // 1. 커플 정보
        const { data: couple } = await supabase
          .from("couples")
          .select("*")
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
          .single();

        if (!couple) {
          router.push("/connect");
          return;
        }
        
        const todayStr = new Date().toISOString().split("T")[0];

        // 2. 병렬 데이터 페칭
        const [
          { data: myProfile },
          partnerProfile,
          { data: nextEvents },
          { data: recentPhotos },
          { data: todaysDiaries }
        ] = await Promise.all([
          supabase.from("users").select("*").eq("id", currentUser.id).single(),
          getPartnerInfo(supabase, couple.id, currentUser.id),
          supabase.from("events").select("*").eq("couple_id", couple.id).gte("date", todayStr).order("date", { ascending: true }).limit(1),
          supabase.from("photos").select("*").eq("couple_id", couple.id).order("taken_at", { ascending: false }).limit(3),
          supabase.from("diaries").select("author_id").eq("couple_id", couple.id).eq("diary_date", todayStr)
        ]);

        setInitialData({
          couple,
          myProfile,
          partnerProfile,
          nextEvent: nextEvents?.[0],
          recentPhotos,
          todaysDiaries
        });
      } catch (error) {
        console.error("Error loading home data:", error);
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

  if (!initialData || !userId) return null;

  return <HomeContent initialData={initialData} userId={userId} />;
}
