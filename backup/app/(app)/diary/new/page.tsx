"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Lock, Unlock } from "lucide-react";

export default function NewDiaryPage() {
  const router = useRouter();
  const supabase = createClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [mood, setMood] = useState('smile');
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const moods = [
    { id: 'smile', icon: '😊' },
    { id: 'love', icon: '💕' },
    { id: 'sad', icon: '😢' },
    { id: 'angry', icon: '😤' },
    { id: 'relieved', icon: '😌' },
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("couples").select("id").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).single().then(({ data }) => {
          if (data) setCoupleId(data.id);
        });
      }
    });
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSave = async () => {
    if (!content || !date || !coupleId) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("diaries").insert({
      couple_id: coupleId,
      author_id: user.id,
      content,
      mood,
      diary_date: date,
      is_private: isPrivate
    });

    if (!error) {
      router.push("/diary");
    } else {
      setLoading(false);
      alert("등록에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md flex items-center px-4 h-14 border-b border-border/40 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button onClick={() => router.back()} className="p-2 text-text active:scale-95 transition-transform outline-none cursor-pointer">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold ml-2">일기 쓰기</h1>
        <div className="flex-1" />
        <button 
          onClick={handleSave} 
          disabled={loading || !content}
          className="text-[15px] font-bold text-primary px-2 active:scale-95 transition-transform disabled:opacity-50 outline-none"
        >
          {loading ? "저장 중" : "완료"}
        </button>
      </div>

      <div className="flex-1 px-6 pt-8 pb-32 flex flex-col items-center">
        {/* 기분 선택 */}
        <p className="text-[14px] font-bold text-text mb-4 text-center">오늘 하루의 기분을 골라보세요</p>
        <div className="flex gap-4 mb-8 bg-surface p-3 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-border/50">
          {moods.map(m => (
            <button 
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`text-[36px] transition-all transform active:scale-90 select-none ${mood === m.id ? 'scale-110 drop-shadow-lg opacity-100' : 'opacity-30 grayscale hover:grayscale-0'}`}
            >
              {m.icon}
            </button>
          ))}
        </div>

        {/* 본문 입력 */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          placeholder="오늘은 어떤 일이 있었나요? 솔직한 감정을 남겨보세요."
          className="w-full min-h-[50vh] text-[16px] leading-[1.8] font-medium text-text border-none focus:outline-none resize-none placeholder:text-muted/40 bg-transparent"
        />
      </div>

      {/* 하단 옵션 바 */}
      <div className="fixed bottom-0 w-full max-w-[390px] left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-5 py-4 border-t border-border/50 z-50 flex justify-between items-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-surface px-4 py-2 rounded-xl text-[14px] font-bold text-text focus:outline-none border border-border/40 shadow-sm outline-none"
        />
        
        <button 
          onClick={() => setIsPrivate(!isPrivate)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all shadow-sm outline-none select-none
            ${isPrivate ? 'bg-[#191F28] text-white shadow-md' : 'bg-surface text-muted hover:bg-gray-100 border border-border/40'}`}
        >
          {isPrivate ? <Lock size={14} strokeWidth={2.5} /> : <Unlock size={14} strokeWidth={2.5} />}
          {isPrivate ? "나만 보기" : "같이 보기"}
        </button>
      </div>
    </div>
  );
}
