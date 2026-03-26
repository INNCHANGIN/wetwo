"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Heart } from "lucide-react";
import Image from "next/image";

export default function PhotoDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [photo, setPhoto] = useState<any>(null);
  const [uploader, setUploader] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [photosList, setPhotosList] = useState<string[]>([]);
  
  useEffect(() => {
    // 1. 해당 사진 데이터 가져오기
    supabase.from("photos").select("*").eq("id", params.id).single()
      .then(({ data }) => {
        if (data) {
          setPhoto(data);
          
          // 2. 업로더 프로필 
          supabase.from("users").select("nickname, avatar_url").eq("id", data.uploaded_by).single()
            .then(res => {
              if (res.data) setUploader(res.data);
            });
            
          // 3. 커플의 모든 사진 리스트 아이디 수집 (좌우 스와이핑 목적)
          supabase.from("photos").select("id").eq("couple_id", data.couple_id).order("taken_at", { ascending: false })
            .then(allPhotos => {
              if (allPhotos.data) {
                setPhotosList(allPhotos.data.map(p => p.id));
              }
            });
        }
      });
  }, [params.id]);

  const currentIndex = photosList.indexOf(params.id);
  
  // 가벼운 스와이프 핸들러
  let touchStartX = 0;
  const handleTouchStart = (e: React.TouchEvent) => touchStartX = e.touches[0].clientX;
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // 임계값 50px 좌우 드래그 판단
    if (diff > 50 && currentIndex < photosList.length - 1) {
      // 왼쪽 스와이프: 다음(오래된) 사진
      router.push(`/photos/${photosList[currentIndex + 1]}`);
    } else if (diff < -50 && currentIndex > 0) {
      // 오른쪽 스와이프: 이전(새로운) 사진
      router.push(`/photos/${photosList[currentIndex - 1]}`);
    }
  };

  if (!photo) return <div className="min-h-screen bg-black" />; // Loading 시 검은 배경 노출

  return (
    <div 
         className="flex flex-col min-h-screen bg-black text-white w-full h-full relative select-none" 
         onTouchStart={handleTouchStart} 
         onTouchEnd={handleTouchEnd}
    >
      {/* 상단 상태 및 뒤로가기 툴바 */}
      <div className="absolute top-0 w-full z-50 flex items-center p-4 bg-gradient-to-b from-black/80 to-transparent pt-[calc(1rem+env(safe-area-inset-top))]">
        <button onClick={() => router.push("/photos")} className="p-2 active:scale-95 transition-transform text-white drop-shadow-md outline-none cursor-pointer">
          <ArrowLeft size={26} />
        </button>
        <div className="flex-1 text-center pr-2">
          <span className="text-[13px] font-medium opacity-90 drop-shadow-md tracking-wide">
            {new Date(photo.taken_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
          </span>
        </div>
        <div className="w-[42px]" />
      </div>

      {/* 풀 스크린 고화질 뷰어 */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <Image 
          src={photo.storage_path} 
          alt={photo.caption || "사진"} 
          fill
          priority
          sizes="100vw"
          className="object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] fade-in"
          draggable={false}
        />
      </div>

      {/* 하단 캡션 정보 및 UI */}
      <div className="absolute bottom-0 w-full z-50 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-16 text-white pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-between items-end gap-6 max-w-[390px] mx-auto">
          <div className="flex-1">
            {uploader && (
              <div className="flex items-center gap-2.5 mb-2.5">
                {uploader.avatar_url ? (
                  <div className="relative w-7 h-7 rounded-full border border-white/30 shadow-sm overflow-hidden">
                    <Image src={uploader.avatar_url} alt="avatar" fill sizes="28px" className="object-cover" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold shadow-sm">
                    {uploader.nickname[0]}
                  </div>
                )}
                <span className="text-[14px] font-extrabold opacity-95 tracking-tight">{uploader.nickname}</span>
              </div>
            )}
            <p className="text-[15px] font-medium leading-[1.6] drop-shadow-md text-white/90">
              {photo.caption || "캡션이 없는 사진입니다."}
            </p>
          </div>
          
          {/* 가상 좋아요 버튼 (현재는 DB x, UI 토글만) */}
          <button 
            onClick={() => setLiked(!liked)} 
            className={`flex-shrink-0 w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all ${liked ? 'bg-black/20 scale-100' : 'bg-black/20 backdrop-blur-md active:scale-90 scale-100'}`}
          >
            <Heart size={28} strokeWidth={liked ? 0 : 2} className={liked ? "fill-[#FF6B6B] text-[#FF6B6B] scale-110 drop-shadow-[0_0_10px_rgba(255,107,107,0.5)] transition-transform" : "text-white"} />
          </button>
        </div>
      </div>
    </div>
  );
}
