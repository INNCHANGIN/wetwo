"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, Trash2, Check, Calendar as CalendarIcon, Thermometer } from "lucide-react";

export default function BrewingEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const isNew = params.id === "new";
  
  const [formData, setFormData] = useState({
    name: "", malt: "", hops: "", yeast: "",
    fermentation_temp: "", start_date: "", end_date: "", notes: ""
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
          .eq("id", params.id)
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
  }, [supabase, router, isNew, params.id]);

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
        await supabase.from("brewing_logs").update(payload).eq("id", params.id);
      }
      router.push("/brewing");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !confirm("일지를 삭제하시겠습니까?")) return;
    try {
      await supabase.from("brewing_logs").delete().eq("id", params.id);
      router.push("/brewing");
      router.refresh();
    } catch (error) {}
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pb-[100px] overflow-y-auto">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 h-14 border-b border-border/50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <span className="font-semibold text-gray-800">{isNew ? "신규 양조 일지" : "일지 수정"}</span>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={handleDelete} className="p-2 text-red-500">
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={handleSave} 
            disabled={saving || !formData.name.trim()}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
              formData.name.trim() ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            <Check size={16} /> 저장
          </button>
        </div>
      </header>

      <main className="p-6 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-700">맥주 이름 <span className="text-red-500">*</span></span>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="예: 문톤스 컨티넨탈 필스너" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 transition-colors" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-700">발효 시작일</span>
            <div className="relative">
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:border-orange-500" />
              <CalendarIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-700">발효 종료일</span>
            <div className="relative">
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:border-orange-500" />
              <CalendarIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-700">발효 온도</span>
          <div className="relative">
            <input type="number" step="0.1" name="fermentation_temp" value={formData.fermentation_temp} onChange={handleChange} placeholder="18.5" className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500" />
            <Thermometer size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">℃</span>
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
           <span className="text-sm font-semibold text-gray-700">맥아 (Malt)</span>
           <input type="text" name="malt" value={formData.malt} onChange={handleChange} placeholder="사용된 맥아 종류" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500" />
        </label>

        <label className="flex flex-col gap-1.5">
           <span className="text-sm font-semibold text-gray-700">홉 (Hops)</span>
           <input type="text" name="hops" value={formData.hops} onChange={handleChange} placeholder="사용된 홉 종류" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500" />
        </label>

        <label className="flex flex-col gap-1.5">
           <span className="text-sm font-semibold text-gray-700">효모 (Yeast)</span>
           <input type="text" name="yeast" value={formData.yeast} onChange={handleChange} placeholder="효모 종류" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-700">특이사항 (Notes)</span>
          <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="관찰 내용, 맛의 변화 등 자유롭게 기록하세요." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none min-h-[150px] resize-none focus:border-orange-500" />
        </label>
      </main>
    </div>
  );
}
