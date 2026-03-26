"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Trash2, Edit2, Lock } from "lucide-react";

export default function DiaryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [diary, setDiary] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({}); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setMyId(user.id);
    });

    fetchDiary();

    const channel = supabase
      .channel(`diary-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diaries', filter: `id=eq.${params.id}` }, (payload) => {
        setDiary(payload.new);
        if (payload.new.reactions) setReactions(payload.new.reactions);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel) };
  }, [params.id]);

  const fetchDiary = async () => {
    const { data } = await supabase.from("diaries").select("*").eq("id", params.id).single();
    if (data) {
      setDiary(data);
      if (data.reactions) setReactions(data.reactions);
      
      supabase.from("users").select("nickname").eq("id", data.author_id).single()
        .then(res => {
          if (res.data) setAuthor(res.data);
        });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("정말 이 일기를 삭제할까요?")) {
      await supabase.from("diaries").delete().eq("id", params.id);
      router.push("/diary");
    }
  };

  const toggleReaction = async (type: string) => {
    if (!diary || !myId) return;
    
    const currentReaction = reactions[myId];
    const newReactions = { ...reactions };
    
    if (currentReaction === type) {
      delete newReactions[myId];
    } else {
      newReactions[myId] = type;
    }

    setReactions(newReactions); 
    await supabase.from("diaries").update({ reactions: newReactions }).eq("id", params.id);
  };

  if (loading) return <div className="min-h-screen bg-white" />;
  if (!diary) return <div className="min-h-screen bg-white flex items-center justify-center text-muted font-medium">일기를 찾을 수 없습니다.</div>;

  const isMine = diary.author_id === myId;
  const reactionTypes = [
    { id: 'heart', emoji: '❤️' },
    { id: 'hug', emoji: '🫂' },
    { id: 'smile', emoji: '😊' },
  ];

  const myReaction = myId ? reactions[myId] : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] relative selection:bg-primary/20">
      <div className="sticky top-0 z-40 bg-[#F9FAFB]/90 backdrop-blur-md flex items-center justify-between px-4 h-14 border-b border-border/30 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button onClick={() => router.back()} className="p-2 text-text active:scale-95 transition-transform outline-none cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        {isMine && (
          <button onClick={handleDelete} className="p-2 text-red-500 active:scale-95 transition-transform outline-none cursor-pointer bg-red-500/10 rounded-full">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 px-6 pt-10 pb-36 bg-white rounded-t-[32px] mt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] min-h-screen">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-[14px] font-bold text-muted">
              {new Date(diary.diary_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-extrabold text-text tracking-tight">{author?.nickname || "작성자"}의 일기</span>
              {diary.is_private && <Lock size={15} strokeWidth={2.5} className="text-muted" />}
            </div>
          </div>
          <div className="text-[44px] drop-shadow-md">
            {getMoodEmoji(diary.mood)}
          </div>
        </div>

        <p className="text-[16px] leading-[1.8] text-[#191F28] whitespace-pre-wrap font-medium">
          {diary.content}
        </p>
      </div>

      {/* 파트너 리액션 바 */}
      {!isMine ? (
        <div className="fixed bottom-0 w-full max-w-[390px] left-1/2 -translate-x-1/2 bg-white px-6 py-4 border-t border-border/50 z-50 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-4 justify-center shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
          {reactionTypes.map((rt) => {
            const isActive = myReaction === rt.id;
            return (
              <button
                key={rt.id}
                onClick={() => toggleReaction(rt.id)}
                className={`flex items-center justify-center flex-1 h-[56px] rounded-2xl text-[28px] transition-all active:scale-90 outline-none select-none
                  ${isActive ? 'bg-primary/10 border border-primary/20 scale-105 drop-shadow-sm' : 'bg-surface border border-transparent hover:bg-gray-100'}`}
              >
                <span className={isActive ? '' : 'opacity-70 grayscale'}>{rt.emoji}</span>
              </button>
            )
          })}
        </div>
      ) : Object.keys(reactions).length > 0 ? (
         <div className="fixed bottom-0 w-full max-w-[390px] left-1/2 -translate-x-1/2 bg-white px-6 py-5 border-t border-border/50 z-50 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-center gap-3 fade-in shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
           <span className="text-[14px] font-bold text-muted mr-1">파트너의 반응</span>
           <div className="flex bg-surface px-4 py-2 rounded-2xl border border-border/40 shadow-sm">
             {Object.keys(reactions).map(userId => {
               const rId = reactions[userId];
               const emoji = reactionTypes.find(t => t.id === rId)?.emoji;
               return <span key={userId} className="text-[28px] animate-bounce">{emoji}</span>
             })}
           </div>
         </div>
      ): null}
    </div>
  );
}

function getMoodEmoji(m: string) {
  switch(m) {
    case 'smile': return '😊';
    case 'love': return '💕';
    case 'sad': return '😢';
    case 'angry': return '😤';
    case 'relieved': return '😌';
    case 'happy': return '😊';
    case 'normal': return '😌';
    default: return '💭';
  }
}
