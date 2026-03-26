"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LogOut, User, Bell, Heart, Link as LinkIcon, Edit2, Check, Camera, Calendar } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [couple, setCouple] = useState<any>(null);
  
  // 편집 상태
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  
  const [isEditingAnniv, setIsEditingAnniv] = useState(false);
  const [editAnniv, setEditAnniv] = useState("");
  
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setCurrentUser(user);

    // 내 프로필
    const { data: myData } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (myData) {
      setMyProfile(myData);
      setEditNickname(myData.nickname);
    }

    // 커플 정보 및 파트너
    const { data: coupleData } = await supabase.from("couples").select("*").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).single();
    if (coupleData) {
      setCouple(coupleData);
      setEditAnniv(coupleData.anniversary_date);
      
      const partnerId = coupleData.user1_id === user.id ? coupleData.user2_id : coupleData.user1_id;
      if (partnerId) {
         const { data: partnerData } = await supabase.from("users").select("*").eq("id", partnerId).single();
         if (partnerData) setPartnerProfile(partnerData);
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if(confirm("정말 로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      router.replace("/login");
    }
  };

  const copyInviteCode = () => {
    if (couple?.invite_code) {
      navigator.clipboard.writeText(couple.invite_code);
      alert("커플 코드가 클립보드에 복사되었습니다.");
    }
  };

  const saveNickname = async () => {
    if (!editNickname.trim() || !currentUser) return;
    await supabase.from("users").update({ nickname: editNickname }).eq("id", currentUser.id);
    setMyProfile({ ...myProfile, nickname: editNickname });
    setIsEditingNickname(false);
  };

  const saveAnniv = async () => {
    if (!editAnniv || !couple) return;
    await supabase.from("couples").update({ anniversary_date: editAnniv }).eq("id", couple.id);
    setCouple({ ...couple, anniversary_date: editAnniv });
    setIsEditingAnniv(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setUploading(true);
    
    // 리사이징 (Canvas)
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 800; // 프로필은 크게 필요하지 않음
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const compressedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          
          try {
            const fileName = `avatars/${currentUser.id}_${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from("couples").upload(fileName, compressedFile, { contentType: "image/jpeg" });
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from("couples").getPublicUrl(fileName);
            
            await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", currentUser.id);
            setMyProfile({ ...myProfile, avatar_url: publicUrl });
          } catch (error) {
            console.error(error);
            alert("아바타 업로드 실패. 버킷 권한을 확인하세요.");
          } finally {
            setUploading(false);
          }
        }, "image/jpeg", 0.8);
      };
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] pb-32">
      <div className="sticky top-0 z-40 bg-[#F9FAFB]/90 backdrop-blur-md px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-3 border-b border-transparent shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
        <h1 className="text-[22px] font-extrabold text-text tracking-tight">설정</h1>
      </div>

      <div className="flex flex-col gap-6 px-4 mt-4 w-full max-w-[390px] mx-auto">
        
        {/* 내 프로필 섹션 */}
        <section className="bg-white rounded-[24px] shadow-sm border border-border/40 overflow-hidden relative">
          <div className="p-6 flex flex-col items-center gap-4">
            <label className="relative cursor-pointer group rounded-full">
              <div className={`w-[88px] h-[88px] rounded-full bg-surface border-2 border-white drop-shadow-sm flex items-center justify-center overflow-hidden transition-opacity relative ${uploading ? 'opacity-50' : 'opacity-100'}`}>
                {myProfile?.avatar_url ? (
                  <Image src={myProfile.avatar_url} alt="avatar" fill sizes="88px" className="object-cover" />
                ) : (
                  <span className="text-[28px] font-bold text-muted">{myProfile?.nickname?.[0]}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-text w-[28px] h-[28px] rounded-full flex items-center justify-center border-[2.5px] border-white text-white shadow-md group-active:scale-90 transition-transform">
                <Camera size={14} />
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
            </label>

            <div className="flex flex-col items-center justify-center w-full">
              {isEditingNickname ? (
                <div className="flex items-center gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2">
                  <input 
                    type="text" 
                    value={editNickname} 
                    onChange={(e) => setEditNickname(e.target.value)} 
                    className="bg-surface px-4 py-2 rounded-xl text-[16px] font-bold text-center w-36 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                    autoFocus
                  />
                  <button onClick={saveNickname} className="p-2 bg-text text-white rounded-xl active:scale-95 shadow-sm">
                    <Check size={18} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-1.5 mb-1 cursor-pointer group px-3 py-1 rounded-xl hover:bg-surface active:scale-95 transition-all text-center" 
                  onClick={() => setIsEditingNickname(true)}
                >
                  <span className="text-[20px] font-extrabold text-text tracking-tight">{myProfile?.nickname}</span>
                  <Edit2 size={14} strokeWidth={2.5} className="text-muted/60 group-hover:text-text transition-colors" />
                </div>
              )}
              <p className="text-[13px] font-medium text-muted/70">{myProfile?.email}</p>
            </div>
          </div>
        </section>

        {/* 커플 정보 섹션 */}
        <section className="bg-white rounded-[24px] shadow-sm border border-border/40 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#E5E8EB]/50 bg-gray-50/50">
            <span className="text-[13px] font-bold text-muted tracking-tight">커플 정보</span>
          </div>
          
          <div className="flex items-center justify-between px-5 h-[60px] border-b border-[#E5E8EB]/50">
            <div className="flex items-center gap-3">
              <Heart size={20} className="text-[#FF6B6B]" />
              <span className="text-[15px] font-bold text-text">파트너</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-text/90 tracking-tight">{partnerProfile?.nickname || "아직 없음"}</span>
              {partnerProfile?.avatar_url ? (
                <div className="relative w-[30px] h-[30px] rounded-full border border-border shadow-sm overflow-hidden">
                  <Image src={partnerProfile.avatar_url} alt="partner avatar" fill sizes="30px" className="object-cover" />
                </div>
              ) : (
                <div className="w-[30px] h-[30px] rounded-full bg-surface text-[12px] font-bold text-muted flex items-center justify-center border border-border/50 shadow-sm">
                  {partnerProfile?.nickname?.[0]}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-5 h-[60px] border-b border-[#E5E8EB]/50">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-primary" />
              <span className="text-[15px] font-bold text-text">함께한 날</span>
            </div>
            {isEditingAnniv ? (
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={editAnniv} 
                  onChange={(e) => setEditAnniv(e.target.value)} 
                  className="bg-surface px-3 py-1.5 rounded-lg text-[14px] font-bold focus:outline-none border border-transparent focus:border-border/60"
                />
                <button onClick={saveAnniv} className="p-[7px] bg-primary text-white rounded-lg active:scale-95 shadow-sm">
                  <Check size={16} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 py-1 px-1.5 active:opacity-50 cursor-pointer rounded-lg hover:bg-surface/50" onClick={() => setIsEditingAnniv(true)}>
                <span className="text-[15px] font-bold text-muted/90">{couple?.anniversary_date?.replace(/-/g, '.')}</span>
                <Edit2 size={14} className="text-muted/60" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-5 h-[60px] active:bg-surface transition-colors cursor-pointer group" onClick={copyInviteCode}>
            <div className="flex items-center gap-3">
              <LinkIcon size={20} className="text-text" />
              <span className="text-[15px] font-bold text-text group-hover:text-primary transition-colors">초대 코드 복사</span>
            </div>
            <span className="text-[13px] font-bold tracking-[0.1em] text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/10 shadow-sm">
              {couple?.invite_code || "XXXXXX"}
            </span>
          </div>
        </section>

        {/* 앱 설정 섹션 */}
        <section className="bg-white rounded-[24px] shadow-sm border border-border/40 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#E5E8EB]/50 bg-gray-50/50">
            <span className="text-[13px] font-bold text-muted tracking-tight">앱 설정</span>
          </div>
          
          <div className="flex items-center justify-between px-5 h-[64px]">
            <div className="flex items-center gap-3">
              <Bell size={20} className={notifications ? "text-text" : "text-muted"} />
              <span className="text-[15px] font-bold text-text">푸시 알림</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-[46px] h-[26px] bg-[#E5E8EB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-primary shadow-inner"></div>
            </label>
          </div>
        </section>

        {/* 계정 섹션 (로그아웃) */}
        <section className="bg-white rounded-[24px] shadow-sm border border-border/40 overflow-hidden mt-1 mb-6">
          <button onClick={handleLogout} className="w-full flex items-center px-5 h-[60px] active:bg-red-50 transition-colors gap-3 group outline-none">
            <LogOut size={20} className="text-[#FF6B6B]" />
            <span className="text-[15px] font-bold text-[#FF6B6B] flex-1 text-left">로그아웃</span>
          </button>
        </section>

      </div>
    </div>
  );
}
