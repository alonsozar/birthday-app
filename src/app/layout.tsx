import type { Metadata } from 'next';
import { Assistant } from 'next/font/google';
import './globals.css';

const assistant = Assistant({ subsets: ['hebrew', 'latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Birthday Management',
  description: 'Manage and celebrate birthdays easily',
  manifest: '/manifest.json',
  themeColor: '#F9FAFB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${assistant.className} bg-[#F9FAFB] text-[#1F2937] antialiased min-h-screen pb-10`}>
        {children}
      </body>
    </html>
  );
}
