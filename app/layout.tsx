import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'DiagramSVG – High-Quality Diagramming, Draw.io & SVG Export Studio',
  description:
    'Interactive diagramming studio integrating Draw.io editor and yFiles engine with automated layouts, live SVG preview, and high-resolution export. Powered by Next.js.',
  keywords: [
    'diagram',
    'svg',
    'drawio',
    'draw.io',
    'yfiles',
    'architecture',
    'flowchart',
    'vector export',
    'graph',
    'next.js'
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full w-full overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
        {children}
      </body>
    </html>
  );
}
