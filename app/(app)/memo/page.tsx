"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";

export default function MemoPage() {
  const router = useRouter();
  const { user, couple, loading: authLoading } = useAuth();
  const supabase = createClient();

  const { data: memos, isLoading: dataLoading } = useQuery({
    queryKey: ["memos", couple?.id],
    queryFn: async () => {
      if (!couple) return [];
      const { data } = await supabase
        .from("memos")
        .select("*")
        .eq("couple_id", couple.id)
        .order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!couple,
    staleTime: 1000 * 60 * 5,
  });

  const loading = authLoading || (dataLoading && !memos);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-2xl w-full"></div>
          <div className="h-20 bg-gray-200 rounded-2xl w-full"></div>
          <div className="h-20 bg-gray-200 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] relative pb-20">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-[24px] font-bold text-gray-900 mb-6">공유 메모</h2>
        
        {!memos || memos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-500 text-sm">아직 작성된 메모가 없어요.<br />첫 번째 메모를 작성해보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {memos.map((memo: any) => (
              <Link 
                key={memo.id} 
                href={`/memo/detail?id=${memo.id}`}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-gray-800 font-medium truncate text-[16px] mb-1">
                    {memo.content ? memo.content.split('\n')[0] : "새 메모"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(memo.updated_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    })} (최근 수정)
                  </p>
                </div>
                <ChevronRight className="text-gray-300" size={20} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => router.push("/memo/detail?id=new")}
        className="fixed bottom-[calc(100px+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors active:scale-95 z-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}
