"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getCurrentCouple } from "@/lib/queries";
import DiaryContent from "./DiaryContent";
import { Diary } from "@/lib/types";

export default function DiaryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ diaries: Diary[], coupleId: string, myId: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const couple = await getCurrentCouple(supabase, user.id);
        if (!couple) {
          router.push("/connect");
          return;
        }

        const { data: diaries } = await supabase
          .from("diaries")
          .select("*")
          .eq("couple_id", couple.id)
          .order("diary_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(50);

        setData({
          diaries: (diaries as Diary[]) || [],
          coupleId: couple.id,
          myId: user.id
        });
      } catch (error) {
        console.error("Error loading diary data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex flex-col px-4 pt-6 gap-4 min-h-screen bg-white">
        <div className="flex justify-end">
          <div className="w-[60%] h-20 bg-gray-100 rounded-[20px] rounded-tr-sm animate-pulse" />
        </div>
        <div className="flex justify-start">
          <div className="w-[55%] h-16 bg-gray-100 rounded-[20px] rounded-tl-sm animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="w-[50%] h-24 bg-gray-100 rounded-[20px] rounded-tr-sm animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <DiaryContent 
      initialDiaries={data.diaries} 
      coupleId={data.coupleId} 
      myId={data.myId} 
    />
  );
}
