"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import { getPartnerInfo } from "@/lib/queries";
import { useAuth } from "@/components/providers/AuthProvider";
import HomeContent from "./HomeContent";

export default function HomePage() {
  const { user, couple, loading: authLoading } = useAuth();
  const supabase = createClient();

  const { data, isLoading: dataLoading } = useQuery({
    queryKey: ["home-data", couple?.id, user?.id],
    queryFn: async () => {
      if (!user || !couple) return null;
      
      const todayStr = new Date().toISOString().split("T")[0];

      const [
        { data: myProfile },
        partnerProfile,
        { data: nextEvents },
        { data: recentPhotos }
      ] = await Promise.all([
        supabase.from("users").select("*").eq("id", user.id).single(),
        getPartnerInfo(supabase, couple.id, user.id),
        supabase.from("events").select("*").eq("couple_id", couple.id).gte("date", todayStr).order("date", { ascending: true }).limit(1),
        supabase.from("photos").select("*").eq("couple_id", couple.id).order("taken_at", { ascending: false }).limit(3)
      ]);

      return {
        couple,
        myProfile,
        partnerProfile,
        nextEvent: nextEvents?.[0],
        recentPhotos
      };
    },
    enabled: !!user && !!couple,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });

  const loading = authLoading || (dataLoading && !data);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* D+ 카운터 영역 스켈레톤 */}
        <div className="px-6 pt-10 pb-8 flex flex-col gap-2">
          <div className="w-40 h-8 bg-gray-100 rounded-full animate-pulse" />
          <div className="w-32 h-5 bg-gray-50 rounded-full animate-pulse" />
        </div>
        {/* 다가오는 일정 섹션 */}
        <div className="px-6 mb-8">
          <div className="w-28 h-5 bg-gray-100 rounded-full animate-pulse mb-3" />
          <div className="w-full h-24 bg-gray-50 rounded-2xl animate-pulse" />
        </div>
        {/* 사진 섹션 */}
        <div className="px-6 mb-8">
          <div className="w-28 h-5 bg-gray-100 rounded-full animate-pulse mb-3" />
          <div className="flex gap-3">
            {[0, 1, 2].map(i => <div key={i} className="min-w-[120px] aspect-square bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data || !user) return null;

  return <HomeContent initialData={data} userId={user.id} />;
}
