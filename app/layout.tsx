import type { Metadata, Viewport } from 'next';
import './globals.css';
import InstallBanner from '@/components/ui/InstallBanner';
import QueryProvider from '@/components/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'We Two - Couple App',
  description: '우리 둘만의 공간',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'We Two',
    statusBarStyle: 'default',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F06292',
};

// Service Worker 등록을 위한 클라이언트 스크립트
function SWRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('SW registered: ', registration);
              }, function(err) {
                console.log('SW registration failed: ', err);
              });
            });
          }
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-surface text-text antialiased">
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <main className="min-h-screen bg-white shadow-sm flex flex-col relative w-full h-full max-w-[390px] mx-auto overflow-hidden">
                {children}
                {/* <InstallBanner /> */}
              </main>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
        <SWRegistration />
      </body>
    </html>
  );
}
