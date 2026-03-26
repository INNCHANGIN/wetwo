"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Check } from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date') || new Date().toISOString().substring(0, 10);
  
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate);
  const [category, setCategory] = useState<'date' | 'anniversary' | 'daily'>('date');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("couples")
          .select("id")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .single()
          .then(({ data }) => {
            if (data) setCoupleId(data.id);
          });
      }
    });
  }, []);

  const handleSave = async () => {
    if (!title || !date || !coupleId) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("events").insert({
      couple_id: coupleId,
      created_by: user.id,
      title,
      date,
      category,
      is_recurring: isRecurring
    });

    if (!error) {
      router.push("/calendar");
    } else {
      setLoading(false);
      alert("등록에 실패했습니다.");
    }
  };

  const categories = [
    { id: 'date', label: '데이트', color: 'bg-pink-100 text-pink-600 border-pink-200' },
    { id: 'anniversary', label: '기념일', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    { id: 'daily', label: '일상', color: 'bg-blue-100 text-blue-600 border-blue-200' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 백 버튼 헤더 */}
      <div className="sticky top-0 z-40 bg-white flex items-center px-4 h-14 border-b border-border/50">
        <button onClick={() => router.back()} className="p-2 text-text active:scale-95 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold ml-2">일정 추가</h1>
      </div>

      <div className="flex-1 px-6 pt-6 pb-24">
        <div className="flex flex-col gap-8">
          
          {/* 제목 입력 */}
          <div>
            <label className="block text-[14px] font-semibold text-muted mb-2">일정 이름</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 우리 처음 만난 날"
              className="w-full text-[24px] font-bold text-text placeholder:text-muted/40 border-b border-border py-2 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-[14px] font-semibold text-muted mb-3">카테고리</label>
            <div className="flex gap-2">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id as any)}
                  className={`px-4 py-2 rounded-xl text-[14px] font-bold border transition-all active:scale-95 flex items-center gap-1.5
                    ${category === c.id 
                      ? c.color 
                      : 'bg-surface text-muted border-transparent hover:bg-gray-100'}`}
                >
                  {category === c.id && <Check size={16} strokeWidth={3} />}
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 선택 */}
          <div>
            <label className="block text-[14px] font-semibold text-muted mb-2">날짜</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface h-[56px] px-4 rounded-xl text-[16px] font-medium text-text border border-transparent focus:outline-none focus:border-primary"
            />
          </div>

          {/* 반복 여부 토글 */}
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="block text-[16px] font-semibold text-text">매년 반복하기</label>
              <p className="text-[13px] text-muted">기념일이나 생일 등에 추천해요</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

        </div>
      </div>

      {/* 하단 고정 저장 버튼 */}
      <div className="fixed bottom-0 w-full max-w-[390px] left-1/2 -translate-x-1/2 bg-white p-4 border-t border-border/50 z-50 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button 
          onClick={handleSave}
          disabled={loading || !title || !date}
          className="w-full h-[56px] bg-primary text-white rounded-xl font-bold text-[17px] shadow-sm active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? "저장 중..." : "일정 저장하기"}
        </button>
      </div>
    </div>
  );
}
