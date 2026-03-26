import { createServerClient } from "@/lib/supabase-server";
import { getCurrentCouple } from "@/lib/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import Image from "next/image";
import PhotosContent from "./PhotosContent";

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
    <PhotosContent 
      initialPhotos={photos || []} 
      initialCount={count || 0} 
      coupleId={couple.id} 
    />
  );
}
