import { createServerClient } from "@/lib/supabase-server";
import { getCurrentCouple } from "@/lib/queries";
import { redirect } from "next/navigation";
import DiaryContent from "./DiaryContent";
import { Diary } from "@/lib/types";

export default async function DiaryPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const couple = await getCurrentCouple(user.id);
  if (!couple) redirect("/connect");

  const { data: diaries } = await supabase
    .from("diaries")
    .select("*")
    .eq("couple_id", couple.id)
    .order("diary_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <DiaryContent 
      initialDiaries={(diaries as Diary[]) || []} 
      coupleId={couple.id} 
      myId={user.id} 
    />
  );
}
