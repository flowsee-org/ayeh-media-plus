import { Suspense } from 'react';
import '@/index.css';
import Providers from './providers';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'آیه مدیا پلاس — تدبّر در قرآن کریم',
  description: 'مجتمع قرآنی: مصحف، تلاوت، تفسیر، تدبّر، هنر، جامعه و دستیار هوشمند — همه در یکجا',
  manifest: '/manifest.json',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%230e4a3f' d='M50 5 L61 18 L78 15 L72 32 L88 39 L72 50 L88 61 L72 68 L78 85 L61 82 L50 95 L39 82 L22 85 L28 68 L12 61 L28 50 L12 39 L28 32 L22 15 L39 18 Z'/%3E%3Ccircle cx='50' cy='50' r='18' fill='%23d48806'/%3E%3Cpath fill='%23ffffff' d='M40 38 Q50 34 50 48 Q50 34 60 38 L60 62 Q50 58 50 48 Q50 58 40 62 Z'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: 'آیه مدیا پلاس',
    description: 'مجتمع قرآنی: تلاوت، تفسیر، تدبّر، هنر و جامعه',
  },
};

export const viewport = {
  themeColor: '#064e3b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/doran/Doran-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/rokh/Rokh-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/tajrid/Tajrid-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/falsafeh/Falsafeh-Bold.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%230e4a3f' d='M50 5 L61 18 L78 15 L72 32 L88 39 L72 50 L88 61 L72 68 L78 85 L61 82 L50 95 L39 82 L22 85 L28 68 L12 61 L28 50 L12 39 L28 32 L22 15 L39 18 Z'/%3E%3Ccircle cx='50' cy='50' r='18' fill='%23d48806'/%3E%3Cpath fill='%23ffffff' d='M40 38 Q50 34 50 48 Q50 34 60 38 L60 62 Q50 58 50 48 Q50 58 40 62 Z'/%3E%3C/svg%3E" />
      </head>
      <body className="bg-background text-foreground font-body antialiased selection:bg-accent/20 selection:text-accent min-h-screen">
        <Providers>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
