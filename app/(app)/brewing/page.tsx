"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, ChevronRight, Beer } from "lucide-react";
import Link from "next/link";

export default function BrewingPage() {
  const router = useRouter();
  const { user, couple, loading: authLoading } = useAuth();
  const supabase = createClient();

  const { data: logs, isLoading: dataLoading } = useQuery({
    queryKey: ["brewing-logs", couple?.id],
    queryFn: async () => {
      if (!couple) return [];
      const { data } = await supabase
        .from("brewing_logs")
        .select("*")
        .eq("couple_id", couple.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!couple,
    staleTime: 1000 * 60 * 5,
  });

  const loading = authLoading || (dataLoading && !logs);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
          <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
          <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] relative pb-20">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-[24px] font-bold text-gray-900 mb-6">브루잉 일지</h2>
        
        {!logs || logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Beer className="text-orange-500" size={32} />
            </div>
            <p className="text-gray-500 text-sm">기록된 양조 일지가 없어요.<br />첫 맥주를 기록해보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log: any) => (
              <Link 
                key={log.id} 
                href={`/brewing/detail?id=${log.id}`}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-md">
                      {log.fermentation_temp ? `${log.fermentation_temp}℃` : "온도 미상"}
                    </span>
                    <p className="text-gray-800 font-bold truncate text-[16px]">{log.name}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {log.start_date || '발효 시작일 미정'} {log.end_date ? `~ ${log.end_date}` : ''}
                  </p>
                </div>
                <ChevronRight className="text-gray-300" size={20} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => router.push("/brewing/detail?id=new")}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors active:scale-95 z-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}
