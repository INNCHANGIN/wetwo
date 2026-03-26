export default function Loading() {
  return (
    <div className="flex flex-col flex-1 p-6 gap-6 animate-pulse mt-4 bg-white/50 w-full min-h-[100vh]">
      {/* 둥근 카드 스켈레톤 (예: 홈화면 D-Day) */}
      <div className="w-full h-[180px] bg-border/20 rounded-[32px]" />
      
      <div className="w-full h-[80px] bg-border/20 rounded-[20px]" />
      
      {/* 한 줄 카드 스켈레톤 리스트 */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="w-2/3 h-6 bg-border/20 rounded-md mb-2" />
        <div className="w-full h-[72px] bg-border/20 rounded-[20px]" />
        <div className="w-full h-[72px] bg-border/20 rounded-[20px]" />
      </div>
    </div>
  );
}
