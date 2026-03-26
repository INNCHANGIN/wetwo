"use client";

import { useEffect, useState } from "react";
import { X, Share, MoreVertical } from "lucide-react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [os, setOs] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    // 독립실행 모드(앱)로 이미 실행중인지 확인
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 배너를 이미 닫은 적이 있는지 기록 확인
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    // OS 판별
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs("ios");
      setShow(true);
    } else if (/android/.test(userAgent)) {
      setOs("android");
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setShow(false);
  };

  if (!show || !os) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-[100] px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom flex flex-col gap-3 rounded-t-[24px]">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-[16px] text-text">앱으로 더 편하게!</h3>
        <button onClick={handleClose} className="p-1 -mr-2 -mt-1 text-muted active:bg-surface rounded-full transition-colors outline-none cursor-pointer">
          <X size={20} />
        </button>
      </div>
      
      {os === "ios" ? (
        <div className="bg-[#F9FAFB] p-3.5 rounded-xl flex flex-col gap-1.5 text-[14px] font-medium text-text">
          <span className="flex items-center">
            1. 하단의 <Share size={18} className="text-primary mx-1.5" /> <strong>공유</strong> 버튼을 누르세요
          </span>
          <span className="flex items-center">
            2. 메뉴에서 <strong>'홈 화면에 추가'</strong>를 누르세요
          </span>
        </div>
      ) : (
        <div className="bg-[#F9FAFB] p-3.5 rounded-xl flex flex-col gap-1.5 text-[14px] font-medium text-text">
          <span className="flex items-center">
            1. 브라우저 우측 상단 <MoreVertical size={18} className="text-primary mx-1" /> <strong>메뉴</strong>를 누르세요
          </span>
          <span className="flex items-center">
            2. <strong>'홈 화면에 추가'</strong>를 선택하세요
          </span>
        </div>
      )}
    </div>
  );
}
