export default function DiaryLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-surface animate-pulse">
      <div className="sticky top-0 bg-white border-b border-border/40 h-14 flex justify-center gap-8 items-center">
         <div className="w-12 h-6 bg-gray-100 rounded-full" />
         <div className="w-12 h-6 bg-gray-100 rounded-full" />
         <div className="w-12 h-6 bg-gray-100 rounded-full" />
      </div>

      <div className="px-4 pt-8 flex flex-col gap-8">
        {[1, 2].map(i => (
          <div key={i} className="flex flex-col gap-4">
             <div className="w-32 h-6 bg-gray-200 rounded-full mx-auto" />
             <div className="flex justify-end">
                <div className="w-[70%] h-24 bg-gray-200 rounded-[20px] rounded-tr-sm" />
             </div>
             <div className="flex justify-start">
                <div className="w-[70%] h-24 bg-white rounded-[20px] rounded-tl-sm border border-border/50" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
