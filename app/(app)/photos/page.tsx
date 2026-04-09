"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";
import PhotosContent from "./PhotosContent";

export default function PhotosPage() {
  const { user, couple, loading: authLoading } = useAuth();
  const supabase = createClient();

  const { data, isLoading: dataLoading } = useQuery({
    queryKey: ["photos", couple?.id],
    queryFn: async () => {
      if (!couple) return null;

      const { data: photos, count } = await supabase
        .from("photos")
        .select("*", { count: "exact" })
        .eq("couple_id", couple.id)
        .order("taken_at", { ascending: false });

      return {
        photos: photos || [],
        count: count || 0,
        coupleId: couple.id
      };
    },
    enabled: !!couple,
    staleTime: 1000 * 60 * 10, // 10분간 캐시
  });

  const loading = authLoading || (dataLoading && !data);

  if (loading) {
    return (
      <div className="flex flex-col bg-white min-h-screen">
        <div className="px-4 pt-4 pb-3">
          <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse mb-1.5" />
          <div className="w-28 h-4 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <PhotosContent 
      initialPhotos={data.photos} 
      initialCount={data.count} 
      coupleId={data.coupleId} 
    />
  );
}
