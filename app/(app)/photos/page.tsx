"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getCurrentCouple } from "@/lib/queries";
import PhotosContent from "./PhotosContent";

export default function PhotosPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ photos: any[], count: number, coupleId: string } | null>(null);

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

        const { data: photos, count } = await supabase
          .from("photos")
          .select("*", { count: "exact" })
          .eq("couple_id", couple.id)
          .order("taken_at", { ascending: false });

        setData({
          photos: photos || [],
          count: count || 0,
          coupleId: couple.id
        });
      } catch (error) {
        console.error("Error loading photos data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex flex-col bg-white min-h-screen">
        <div className="px-4 pt-4 pb-3">
          <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse mb-1.5" />
          <div className="w-28 h-4 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 animate-pulse" />
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
