export default function PhotosLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-white animate-pulse">
      <div className="flex flex-col px-4 pt-4 pb-3">
        <div className="w-24 h-7 bg-gray-200 rounded-full mb-1.5" />
        <div className="w-32 h-4 bg-gray-100 rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-[2px]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
