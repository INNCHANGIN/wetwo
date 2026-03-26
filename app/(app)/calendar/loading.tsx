export default function CalendarLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-white animate-pulse">
      <div className="px-6 pt-6">
        {/* 달력 헤더 스켈레톤 */}
        <div className="flex items-center justify-between mb-8">
           <div className="w-10 h-10 bg-gray-100 rounded-full" />
           <div className="w-24 h-7 bg-gray-200 rounded-full" />
           <div className="w-10 h-10 bg-gray-100 rounded-full" />
        </div>

        {/* 달력 그리드 스켈레톤 */}
        <div className="aspect-[1/1] bg-gray-50 rounded-3xl border border-border/40 p-4">
           <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-full scale-75" />
              ))}
           </div>
        </div>

        {/* 하단 일정 섹션 스켈레톤 */}
        <div className="mt-10">
           <div className="w-32 h-6 bg-gray-200 rounded-full mb-6" />
           <div className="flex flex-col gap-4">
              <div className="w-full h-16 bg-gray-100 rounded-2xl" />
              <div className="w-full h-16 bg-gray-100 rounded-2xl" />
           </div>
        </div>
      </div>
    </div>
  );
}
