"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

export default function PhotosContent({ initialPhotos, initialCount, coupleId }: { initialPhotos: any[], initialCount: number, coupleId: string }) {
  const supabase = createClient();

  const { data } = useQuery({
    queryKey: ["photos", coupleId],
    queryFn: async () => {
      const { data, count } = await supabase
        .from("photos")
        .select("*", { count: "exact" })
        .eq("couple_id", coupleId)
        .order("taken_at", { ascending: false });
      
      return { photos: data || [], count: count || 0 };
    },
    initialData: { photos: initialPhotos, count: initialCount },
    staleTime: 5 * 60 * 1000, // 5분
  });

  const photos = data.photos;
  const count = data.count;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex flex-col px-4 pt-4 pb-3">
        <h1 className="text-[20px] font-bold text-text mb-0.5">사진첩</h1>
        <p className="text-[13px] text-muted">우리 사진 총 {count}장</p>
      </div>

      <div className="grid grid-cols-3 gap-[2px] pb-[90px]">
        {photos?.map((photo) => (
          <Link key={photo.id} href={`/photos/detail?id=${photo.id}`} className="aspect-square bg-surface overflow-hidden relative cursor-pointer group active:opacity-80 transition-opacity">
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

      <Link 
        href={`/photos/upload`} 
        className="fixed bottom-[100px] left-1/2 ml-[120px] w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(49,130,246,0.3)] hover:scale-105 active:scale-95 transition-transform z-50"
      >
        <Plus size={28} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
