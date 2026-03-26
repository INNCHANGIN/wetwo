import { createServerClient } from "@/lib/supabase-server";
import { getCurrentCouple } from "@/lib/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import Image from "next/image";

export default async function PhotosPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const couple = await getCurrentCouple(user.id);
  if (!couple) redirect("/connect");

  const { data: photos, count } = await supabase
    .from("photos")
    .select("*", { count: "exact" })
    .eq("couple_id", couple.id)
    .order("taken_at", { ascending: false });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 통계상단 헤더 */}
      <div className="flex flex-col px-4 pt-4 pb-3">
        <h1 className="text-[20px] font-bold text-text mb-0.5">사진첩</h1>
        <p className="text-[13px] text-muted">우리 사진 총 {count || 0}장</p>
      </div>

      {/* 3열 그리드 (인스타그램 스타일) */}
      <div className="grid grid-cols-3 gap-[2px] pb-[90px]">
        {photos?.map((photo) => (
          <Link key={photo.id} href={`/photos/${photo.id}`} className="aspect-square bg-surface overflow-hidden relative cursor-pointer group active:opacity-80 transition-opacity">
            <Image 
               src={photo.storage_path} 
               alt={photo.caption || "사진"} 
               fill
               sizes="(max-width: 768px) 33vw, 33vw"
               className="object-cover"
            />
          </Link>
        ))}
      </div>

      {/* 새 사진 업로드 FAB */}
      <Link 
        href={`/photos/upload`} 
        className="fixed bottom-[100px] left-1/2 ml-[120px] w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(49,130,246,0.3)] hover:scale-105 active:scale-95 transition-transform z-50"
      >
        <Plus size={28} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
