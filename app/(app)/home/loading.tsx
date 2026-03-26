export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-[48px] pb-20 animate-pulse">
      {/* D-day 텍스트 스켈레톤 */}
      <div className="flex flex-col gap-3 mb-10">
        <div className="w-48 h-5 bg-gray-100 rounded-full" />
        <div className="w-40 h-5 bg-gray-100 rounded-full" />
      </div>

      {/* 일정 스켈레톤 */}
      <div className="mb-8">
        <div className="w-32 h-6 bg-gray-100 rounded-full mb-4" />
        <div className="w-full h-24 bg-[#F9FAFB] rounded-2xl border border-gray-100" />
      </div>

      {/* 사진첩 스켈레톤 */}
      <div className="mb-8">
        <div className="w-32 h-6 bg-gray-100 rounded-full mb-4" />
        <div className="flex gap-3 overflow-hidden">
          <div className="min-w-[120px] aspect-square bg-gray-100 rounded-xl" />
          <div className="min-w-[120px] aspect-square bg-gray-100 rounded-xl" />
          <div className="min-w-[120px] aspect-square bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* 다이어리 스켈레톤 */}
      <div>
        <div className="w-40 h-6 bg-gray-100 rounded-full mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-[#F9FAFB] rounded-2xl border border-gray-100" />
          <div className="h-24 bg-[#F9FAFB] rounded-2xl border border-gray-100" />
        </div>
      </div>
    </div>
  );
}
