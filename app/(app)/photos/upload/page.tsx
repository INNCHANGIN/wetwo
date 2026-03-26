"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus } from "lucide-react";

export default function PhotoUploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("couples").select("id").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).single().then(({ data }) => {
          if (data) setCoupleId(data.id);
        });
      }
    });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // 미리보기 (원본 비트맵으로 렌더링)
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
    
    // 모바일 리소스 절약을 위한 Web Canvas 기반 압축 (최대 폭 1200px)
    const compressed = await compressImage(selected);
    setFile(compressed as File);
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            // 원본 파일명 보존
            resolve(new File([blob!], file.name, { type: "image/jpeg" }));
          }, "image/jpeg", 0.8);
        };
      };
    });
  };

  const handleUpload = async () => {
    if (!file || !coupleId) return;
    setLoading(true);
    setProgress(10); 

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // couples 버킷(폴더 구조)
      const fileName = `photos/${coupleId}/${Date.now()}.jpg`;
      setProgress(40);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("couples")
        .upload(fileName, file, { contentType: "image/jpeg", upsert: false });

      if (uploadError) throw uploadError;
      setProgress(80);

      // Public URL 획득
      const { data: { publicUrl } } = supabase.storage.from("couples").getPublicUrl(fileName);

      // photos 테이블 레코드 생성
      const { error: dbError } = await supabase.from("photos").insert({
        couple_id: coupleId,
        uploaded_by: user.id,
        storage_path: publicUrl,
        caption,
        taken_at: new Date().toISOString()
      });

      if (dbError) throw dbError;
      
      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ["photos", coupleId] });
      router.push("/photos");
    } catch (e) {
      console.error(e);
      alert("업로드 중 오류가 발생했습니다. Storage 버킷 및 권한(RLS)을 확인하세요.");
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 상단 액션바 */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md flex justify-between items-center px-4 h-14 border-b border-border/50">
        <button onClick={() => router.back()} className="p-2 text-text active:scale-95 transition-transform outline-none">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold">새 사진 올리기</h1>
        <button 
          onClick={handleUpload} 
          disabled={loading || !file}
          className="text-[15px] font-bold text-primary px-2 active:scale-95 transition-transform disabled:opacity-50 outline-none"
        >
          {loading ? "공유 중" : "공유"}
        </button>
      </div>

      <div className="flex-1 w-full bg-white">
        {/* 진행률 바 */}
        <div className="w-full h-1 bg-surface absolute top-14 z-50">
          <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
        
        <div className="flex flex-col w-full">
          {/* 이미지 프리뷰 및 파일 선택기 */}
          <label className="w-full aspect-square bg-surface flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
            {preview ? (
              <img src={preview} alt="preview" className="object-cover w-full h-full" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted">
                <ImagePlus size={40} strokeWidth={1.5} />
                <span className="text-[14px] font-medium">사진을 선택하거나 촬영하세요</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>

          {/* 캡션 입력 폼 */}
          <div className="p-4 border-t border-border/40 bg-white">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="문구 입력... (선택)"
              className="w-full h-32 focus:outline-none text-[15px] text-text resize-none bg-transparent placeholder:text-muted/60"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
