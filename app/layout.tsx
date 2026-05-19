import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react'; // YENİ: Radar kütüphanesi
import './globals.css';

export const metadata: Metadata = {
  title: 'Monolith - Edush Interactive',
  description: 'A brutalist stacking game by Edush Interactive.',
};

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
        <Analytics /> {/* YENİ: Radarı tüm oyunun üzerine yerleştirdik */}
      </body>
    </html>
  );
}