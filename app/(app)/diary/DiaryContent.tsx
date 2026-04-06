"use client";

import { useState, useEffect } from "react";
import { Plus, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Diary } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function DiaryContent({ initialDiaries, coupleId, myId }: { initialDiaries: Diary[], coupleId: string, myId: string }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'partner'>('all');

  const { data: diaries = [], isLoading } = useQuery({
    queryKey: ["diaries", coupleId],
    queryFn: async () => {
      const { data } = await supabase
        .from("diaries")
        .select("*")
        .eq("couple_id", coupleId)
        .order("diary_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      
      return (data as Diary[]) || [];
    },
    initialData: initialDiaries,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('public:diaries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diaries', filter: `couple_id=eq.${coupleId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["diaries", coupleId] });
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [supabase, coupleId, queryClient]);

  const filteredDiaries = diaries.filter(d => {
    if (activeTab === 'mine') return d.author_id === myId;
    if (activeTab === 'partner') return d.author_id !== myId;
    return true;
  });

  const grouped = filteredDiaries.reduce((acc, d) => {
    const key = d.diary_date; 
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {} as Record<string, Diary[]>);

  const getMoodEmoji = (m: string) => {
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
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border/40 px-4 pt-[calc(1rem+env(safe-area-inset-top))] flex justify-center gap-6">
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="전체" />
        <TabButton active={activeTab === 'mine'} onClick={() => setActiveTab('mine')} label="내 일기" />
        <TabButton active={activeTab === 'partner'} onClick={() => setActiveTab('partner')} label="파트너 일기" />
      </div>

      <div className="flex-1 px-4 pt-6 pb-32">
        {isLoading && diaries.length === 0 ? (
          <div className="flex justify-center mt-10">
             <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredDiaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-[14px] font-medium text-muted">아직 작성된 일기가 없어요.<br/>우리의 따뜻한 하루를 기록해보세요.</p>
          </div>
        ) : (
          Object.keys(grouped).map(date => (
            <div key={date} className="mb-8">
              <div className="text-center mb-5">
                <span className="inline-block bg-black/5 text-muted px-3.5 py-1.5 rounded-full text-[12px] font-bold tracking-tight shadow-sm border border-border/20">
                  {new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                {grouped[date].map(diary => {
                  const isMine = diary.author_id === myId;
                  return (
                    <div key={diary.id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <Link 
                        href={`/diary/detail?id=${diary.id}`} 
                        className={`max-w-[80%] p-4 rounded-[20px] shadow-sm active:scale-[0.98] transition-transform
                          ${isMine 
                            ? 'bg-primary text-white rounded-tr-sm border border-black/5' 
                            : 'bg-white border border-border/40 text-text rounded-tl-sm'}`}
                      >
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                          <span className="text-[20px] drop-shadow-sm">{getMoodEmoji(diary.mood)}</span>
                          {diary.is_private && <Lock size={12} strokeWidth={3} className={isMine ? "text-white/80" : "text-muted"} />}
                        </div>
                        <p className={`text-[15px] font-medium leading-[1.6] line-clamp-2 ${isMine ? 'text-white/95' : 'text-text'}`}>
                          {diary.content}
                        </p>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <Link 
        href="/diary/new" 
        className="fixed bottom-[100px] right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(49,130,246,0.3)] hover:scale-105 active:scale-95 transition-transform z-50"
      >
        <Plus size={28} strokeWidth={2.5} />
      </Link>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`pb-3 border-b-[3px] font-bold text-[15px] transition-colors ${active ? 'border-text text-text' : 'border-transparent text-muted hover:text-text/70'}`}
    >
      {label}
    </button>
  );
}
