"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, Trash2, Check } from "lucide-react";

export default function MemoEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const supabase = createClient();
  const isNew = id === "new";
  
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function initUserAndMemo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: couple } = await supabase
        .from("couples")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single();

      if (!couple) {
        router.push("/connect");
        return;
      }
      setCoupleId(couple.id);

      if (!isNew) {
        const { data: memo } = await supabase
          .from("memos")
          .select("content")
          .eq("id", id)
          .single();
        
        if (memo) {
          setContent(memo.content);
        } else {
          router.replace("/memo");
        }
        setLoading(false);
      }
    }

    initUserAndMemo();
  }, [supabase, router, isNew, id]);

  const handleSave = async () => {
    if (!content.trim() || !coupleId || !userId) return;
    setSaving(true);

    try {
      if (isNew) {
        await supabase.from("memos").insert({
          couple_id: coupleId,
          author_id: userId,
          content: content.trim(),
        });
      } else {
        await supabase.from("memos").update({
          content: content.trim(),
          author_id: userId,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
      }
      router.push("/memo");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !confirm("이 메모를 삭제하시겠습니까?")) return;
    
    try {
      await supabase.from("memos").delete().eq("id", id);
      router.push("/memo");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white pt-14">
         <div className="animate-pulse p-6">
           <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
           <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
           <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 h-14 border-b border-border/50">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <span className="font-semibold text-gray-800">{isNew ? "새 메모" : "메모 수정"}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 active:scale-95 transition-colors">
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={handleSave} 
            disabled={saving || !content.trim()}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              content.trim() ? "bg-[#FF6B6B] text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            {saving ? "저장 중..." : <><Check size={16} /> 저장</>}
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <main className="flex-1 w-full flex flex-col p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="여기에 메모를 작성하세요..."
          className="flex-1 w-full bg-transparent resize-none outline-none text-gray-800 text-[16px] leading-[1.6] placeholder:text-gray-400"
          autoFocus={isNew}
        />
      </main>
    </div>
  );
}
