"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, Trash2, Check, Calendar as CalendarIcon, Thermometer, Edit3 } from "lucide-react";

export default function BrewingDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const supabase = createClient();
  const isNew = id === "new";
  
  const [formData, setFormData] = useState({
    name: "", malt: "", hops: "", yeast: "",
    fermentation_temp: "", start_date: "", end_date: "", notes: ""
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(isNew);

  useEffect(() => {
    async function initUserAndLog() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUserId(user.id);

      const { data: couple } = await supabase
        .from("couples")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single();
      
      if (!couple) return router.push("/connect");
      setCoupleId(couple.id);

      if (!isNew) {
        const { data: log } = await supabase
          .from("brewing_logs")
          .select("*")
          .eq("id", id)
          .single();
        
        if (log) {
          setFormData({
            name: log.name || "",
            malt: log.malt || "",
            hops: log.hops || "",
            yeast: log.yeast || "",
            fermentation_temp: log.fermentation_temp?.toString() || "",
            start_date: log.start_date || "",
            end_date: log.end_date || "",
            notes: log.notes || ""
          });
        }
        setLoading(false);
      }
    }
    initUserAndLog();
  }, [supabase, router, isNew, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !coupleId || !userId) return;
    setSaving(true);

    const payload = {
      ...formData,
      couple_id: coupleId,
      fermentation_temp: formData.fermentation_temp ? parseFloat(formData.fermentation_temp) : null,
      updated_at: new Date().toISOString()
    };

    try {
      if (isNew) {
        await supabase.from("brewing_logs").insert({ ...payload, created_by: userId, created_at: new Date().toISOString() });
      } else {
        await supabase.from("brewing_logs").update(payload).eq("id", id);
      }
      setIsEditing(false);
      router.refresh();
      if (isNew) router.push("/brewing");
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !confirm("일지를 삭제하시겠습니까?")) return;
    try {
      await supabase.from("brewing_logs").delete().eq("id", id);
      router.push("/brewing");
    } catch (error) {}
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pb-[env(safe-area-inset-bottom)] overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md flex items-end justify-between px-4 pb-3 min-h-[calc(56px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b border-border/50">
        <button onClick={() => isEditing && !isNew ? setIsEditing(false) : router.back()} className="p-2 -ml-2 text-text">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-text mb-1">
          {isNew ? "신규 양조 일지" : isEditing ? "일지 수정" : "양조 리포트"}
        </span>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="p-2 text-primary">
              <Edit3 size={22} />
            </button>
          ) : (
            <>
              {!isNew && (
                <button onClick={handleDelete} className="p-2 text-red-500">
                  <Trash2 size={20} />
                </button>
              )}
              <button 
                onClick={handleSave} 
                disabled={saving || !formData.name.trim()}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
                  formData.name.trim() ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                <Check size={16} /> {isNew ? "등록" : "저장"}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="p-6 flex flex-col gap-6">
        {isEditing ? (
          /* EDIT MODE */
          <>
            <label className="flex flex-col gap-2">
              <span className="text-[15px] font-bold text-text">맥주 이름 <span className="text-primary">*</span></span>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="예: 문톤스 컨티넨탈 필스너" className="w-full px-4 py-3.5 bg-surface border border-border rounded-2xl outline-none focus:border-primary transition-colors text-[16px]" />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-[15px] font-bold text-text">발효 시작일</span>
                <div className="relative">
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-surface border border-border rounded-2xl outline-none text-[15px] focus:border-primary" />
                  <CalendarIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[15px] font-bold text-text">발효 종료일</span>
                <div className="relative">
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-surface border border-border rounded-2xl outline-none text-[15px] focus:border-primary" />
                  <CalendarIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                </div>
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-[15px] font-bold text-text">발효 온도</span>
              <div className="relative">
                <input type="number" step="0.1" name="fermentation_temp" value={formData.fermentation_temp} onChange={handleChange} placeholder="18.5" className="w-full pl-10 pr-10 py-3.5 bg-surface border border-border rounded-2xl outline-none focus:border-primary text-[16px]" />
                <Thermometer size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold">℃</span>
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[15px] font-bold text-text">맥아 (Malt)</span>
              <input type="text" name="malt" value={formData.malt} onChange={handleChange} placeholder="사용된 맥아 종류" className="w-full px-4 py-3.5 bg-surface border border-border rounded-2xl outline-none focus:border-primary" />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[15px] font-bold text-text">홉 (Hops)</span>
              <input type="text" name="hops" value={formData.hops} onChange={handleChange} placeholder="사용된 홉 종류" className="w-full px-4 py-3.5 bg-surface border border-border rounded-2xl outline-none focus:border-primary" />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[15px] font-bold text-text">효모 (Yeast)</span>
              <input type="text" name="yeast" value={formData.yeast} onChange={handleChange} placeholder="효모 종류" className="w-full px-4 py-3.5 bg-surface border border-border rounded-2xl outline-none focus:border-primary" />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[15px] font-bold text-text">특이사항 (Notes)</span>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="관찰 내용, 맛의 변화 등 자유롭게 기록하세요." className="w-full px-4 py-3.5 bg-surface border border-border rounded-2xl outline-none min-h-[200px] resize-none focus:border-primary text-[16px]" />
            </label>
          </>
        ) : (
          /* VIEW MODE (Report Style) */
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col gap-1 border-l-4 border-primary pl-4 py-1">
              <h2 className="text-[26px] font-bold text-text">{formData.name}</h2>
              <p className="text-muted text-[15px]">Brewing Report</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface p-4 rounded-2xl flex flex-col gap-1">
                <span className="text-[13px] font-bold text-muted">발효 시작</span>
                <p className="text-[16px] font-bold text-text">{formData.start_date || "-"}</p>
              </div>
              <div className="bg-surface p-4 rounded-2xl flex flex-col gap-1">
                <span className="text-[13px] font-bold text-muted">발효 종료</span>
                <p className="text-[16px] font-bold text-text">{formData.end_date || "-"}</p>
              </div>
            </div>

            {formData.fermentation_temp && (
              <div className="bg-primary/5 p-6 rounded-3xl flex items-center justify-between border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Thermometer size={24} />
                  </div>
                  <span className="text-[16px] font-bold text-text">최적 발효 온도</span>
                </div>
                <span className="text-[24px] font-black text-primary">{formData.fermentation_temp}℃</span>
              </div>
            )}

            <section className="flex flex-col gap-4">
              <h3 className="text-[18px] font-bold text-text flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                재료 정보
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted font-medium">맥아 (Malt)</span>
                  <span className="font-bold text-text">{formData.malt || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted font-medium">홉 (Hops)</span>
                  <span className="font-bold text-text">{formData.hops || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted font-medium">효모 (Yeast)</span>
                  <span className="font-bold text-text">{formData.yeast || "-"}</span>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-[18px] font-bold text-text flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                관찰 기록
              </h3>
              <div className="bg-surface p-5 rounded-2xl min-h-[120px] whitespace-pre-wrap text-[15px] leading-relaxed text-text">
                {formData.notes || "기록된 특이사항이 없습니다."}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
