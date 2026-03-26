import type { Metadata, Viewport } from 'next';
import './globals.css';
import InstallBanner from '@/components/ui/InstallBanner';

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
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-surface text-text antialiased">
        <main className="min-h-screen bg-white shadow-sm flex flex-col relative w-full h-full max-w-[390px] mx-auto overflow-hidden">
          {children}
          <InstallBanner />
        </main>
      </body>
    </html>
  );
}
