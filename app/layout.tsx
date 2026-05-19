import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monolith - Edush Interactive',
  description: 'A brutalist stacking game by Edush Interactive.',
};

// YENİ: Tarayıcıyı mobil uygulama gibi kilitler (zoom engeller)
export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] overflow-hidden overscroll-none">
        {children}
      </body>
    </html>
  );
}