"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Check, CheckCircle2, Circle, Trash2 } from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date') || new Date().toISOString().substring(0, 10);
  const editId = searchParams.get('edit'); 
  const isEdit = !!editId;

  const supabase = createClient();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [isPeriod, setIsPeriod] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  // 다중 사진 선택기
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  useEffect(() => {
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: couple } = await supabase.from("couples").select("id").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).single();
      if (!couple) return;
      setCoupleId(couple.id);

      // 사진 목록 로드
      const { data: photos } = await supabase.from("photos").select("id, storage_path").eq("couple_id", couple.id).order("taken_at", { ascending: false }).limit(20);
      if (photos) setRecentPhotos(photos);

      // 편집 모드일 경우 기존 데이터 및 매핑된 사진 로드
      if (isEdit) {
        const { data: evt } = await supabase.from("events").select("*").eq("id", editId).single();
        if (evt) {
          setTitle(evt.title);
          setDate(evt.date);
          setEndDate(evt.end_date || evt.date);
          setIsPeriod(evt.date !== (evt.end_date || evt.date));
          setIsRecurring(evt.is_recurring);

          const { data: mappings } = await supabase.from("event_photos").select("photo_id").eq("event_id", editId);
          if (mappings) {
            setSelectedPhotos(mappings.map(m => m.photo_id));
          }
        }
        setLoading(false);
      }
    }
    initData();
  }, [supabase, isEdit, editId]);

  const togglePhotoSelection = (id: string) => {
    setSelectedPhotos(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title || !date || !coupleId || !userId) return;
    setSaving(true);

    try {
      let eventId = editId;
      const finalEndDate = isPeriod ? endDate : date;

      if (isEdit) {
        // 기존 업데이트
        await supabase.from("events").update({
          title, 
          date, 
          end_date: finalEndDate,
          is_recurring: isRecurring
        }).eq("id", editId);

        // 기존 맵핑 제거
        await supabase.from("event_photos").delete().eq("event_id", editId);
      } else {
        // 새로 생성
        const { data: newEvt, error } = await supabase.from("events").insert({
          couple_id: coupleId,
          created_by: userId,
          title, 
          date, 
          end_date: finalEndDate,
          is_recurring: isRecurring
        }).select("id").single();
        if (error) throw error;
        eventId = newEvt.id;
      }

      // 새 매핑 일괄 생성 N:M
      if (selectedPhotos.length > 0 && eventId) {
        const insertMappings = selectedPhotos.map(pId => ({ event_id: eventId, photo_id: pId }));
        await supabase.from("event_photos").insert(insertMappings);
      }

      router.push("/calendar");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !confirm("일정을 삭제하시겠습니까?")) return;
    try {
      await supabase.from("events").delete().eq("id", editId);
      router.push("/calendar");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { id: 'date', label: '데이트', color: 'bg-pink-100 text-pink-600 border-pink-200' },
    { id: 'anniversary', label: '기념일', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    { id: 'daily', label: '일상', color: 'bg-blue-100 text-blue-600 border-blue-200' }
  ];

  const canSave = title.trim() && date && (!isPeriod || (endDate >= date));

  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-[100px]">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 h-14 border-b border-border/50">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-text active:scale-95 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-[17px] font-bold ml-2">{isEdit ? "일정 수정" : "일정 추가"}</h1>
        </div>
        <div>
          {isEdit && (
            <button onClick={handleDelete} className="p-2 text-red-500 active:scale-95 transition-colors">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-24 bg-white flex flex-col gap-8">
        
        {/* 제목 입력 */}
        <div>
          <label className="block text-[14px] font-semibold text-muted mb-2">일정 이름</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 우리 처음 만난 날"
            className="w-full text-[24px] font-bold text-text placeholder:text-muted/40 border-b border-border py-2 focus:outline-none focus:border-primary transition-colors bg-transparent"
          />
        </div>

        {/* 날짜 선택 (단일/기간) */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[16px] font-semibold text-text">기간 설정</label>
              <p className="text-[13px] text-muted">며칠 동안 이어지는 일정인가요?</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPeriod}
                onChange={(e) => {
                  setIsPeriod(e.target.checked);
                  if (!e.target.checked) setEndDate(date);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-muted mb-2">
                {isPeriod ? "시작일" : "날짜"}
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (!isPeriod) setEndDate(e.target.value);
                }}
                className="w-full bg-surface h-[56px] px-4 rounded-xl text-[16px] font-medium text-text border border-transparent focus:outline-none focus:border-primary"
              />
            </div>

            {isPeriod && (
              <div className="fade-in">
                <label className="block text-[14px] font-semibold text-muted mb-2">종료일</label>
                <input 
                  type="date" 
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-surface h-[56px] px-4 rounded-xl text-[16px] font-medium text-text border border-transparent focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
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

        {/* 사진 N:M 연동 */}
        <div className="border-t border-gray-100 pt-6 mt-2">
           <span className="block text-[14px] font-bold text-gray-800 mb-3">연관된 사진 (다중 선택 기능)</span>
           {recentPhotos.length === 0 ? (
             <p className="text-sm text-gray-400">업로드 된 사진이 없습니다.</p>
           ) : (
             <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {recentPhotos.map(photo => {
                  const isSelected = selectedPhotos.includes(photo.id);
                  const url = supabase.storage.from("couples").getPublicUrl(photo.storage_path).data.publicUrl;
                  // 만약 storage_path 자체가 전체 URL이라면 그대로 사용
                  const finalUrl = photo.storage_path.startsWith("http") ? photo.storage_path : url;

                  return (
                    <button
                      key={photo.id}
                      onClick={() => togglePhotoSelection(photo.id)}
                      className={`relative snap-start shrink-0 w-[100px] h-[100px] rounded-xl overflow-hidden border-4 transition-all duration-200 ${
                        isSelected ? 'border-primary scale-95 shadow-md' : 'border-transparent'
                      }`}
                    >
                      <img src={finalUrl} alt="photo" className="w-full h-full object-cover rounded-lg" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 color="white" fill="HotPink" size={28} />
                        </div>
                      )}
                    </button>
                  );
                })}
             </div>
           )}
        </div>
      </div>

      {/* 하단 고정 CTA 버튼 (nav 바가 가리지 않게 bottom 조정) */}
      <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] w-full max-w-[390px] left-1/2 -translate-x-1/2 px-4 z-50 pointer-events-none">
        <button 
          onClick={handleSave}
          disabled={saving || !canSave}
          className="w-full h-[56px] bg-primary text-white rounded-xl font-bold text-[17px] shadow-[0_8px_20px_rgba(240,98,146,0.3)] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center pointer-events-auto"
        >
          {saving ? "저장 중..." : "일정 저장하기"}
        </button>
      </div>
    </div>
  );
}
