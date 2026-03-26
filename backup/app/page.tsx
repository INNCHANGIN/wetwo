import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-surface">
      <h1 className="text-3xl font-bold text-primary mb-2">We Two</h1>
      <p className="text-muted mb-8">우리를 위한 특별한 공간</p>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link 
          href="/login" 
          className="w-full py-3 px-4 bg-primary text-white text-center rounded-xl font-medium shadow-sm active:scale-95 transition-transform"
        >
          로그인
        </Link>
        <Link 
          href="/signup" 
          className="w-full py-3 px-4 bg-white text-primary text-center rounded-xl font-medium border border-primary shadow-sm active:scale-95 transition-transform"
        >
          회원가입
        </Link>
        <div className="mt-8 pt-4 border-t border-border flex flex-col items-center gap-2">
          <span className="text-sm text-muted">앱 둘러보기</span>
          <Link href="/home" className="text-sm text-primary underline underline-offset-2">
            메인 홈으로 이동하기
          </Link>
        </div>
      </div>
    </div>
  );
}
