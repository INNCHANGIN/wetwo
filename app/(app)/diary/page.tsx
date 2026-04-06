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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
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
