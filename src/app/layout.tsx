'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { detectBrowserExtensions } from '@/lib/client-utils';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
