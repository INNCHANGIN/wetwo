"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, Calendar as CalendarIcon, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function EventDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [linkedPhotos, setLinkedPhotos] = useState<any[]>([]);

  useEffect(() => {
    async function loadEventData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");

        const { data: evt } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (evt) {
          setEvent(evt);
          
          const { data: photoLinks } = await supabase
            .from("event_photos")
            .select("photos(*)")
            .eq("event_id", evt.id);

          if (photoLinks) {
            setLinkedPhotos(photoLinks.map(pl => pl.photos).filter(Boolean));
          }
        }
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setLoading(false);
      }
    }
    loadEventData();
  }, [id, supabase, router]);

  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!event) {
    return <div className="min-h-screen bg-white p-6 pt-20 text-center">일정을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 h-14 border-b border-border/50">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
            <ChevronLeft size={24} />
          </button>
          <span className="font-semibold text-gray-800 ml-2">일정 상세</span>
        </div>
        <Link href={`/calendar/new?edit=${event.id}`} className="px-3 py-1.5 rounded-full bg-surface text-primary font-bold text-[13px] active:scale-95 transition-transform">
          편집
        </Link>
      </header>
      
      <main className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
        <div className="flex items-center gap-2 text-gray-500 mb-8">
          <CalendarIcon size={18} />
          <span>{event.date}</span>
        </div>

        {linkedPhotos.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <ImageIcon size={18} /> 연동된 사진
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
              {linkedPhotos.map(photo => {
                const url = photo.storage_path.startsWith("http") 
                  ? photo.storage_path 
                  : supabase.storage.from("couples").getPublicUrl(photo.storage_path).data.publicUrl;
                return (
                  <Link href={`/photos/detail?id=${photo.id}`} key={photo.id} className="snap-start shrink-0">
                    <img 
                      src={url} 
                      alt="Linked event photo" 
                      className="w-[120px] h-[120px] object-cover rounded-xl bg-gray-100 shadow-sm"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
