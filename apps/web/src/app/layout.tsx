import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { APP_NAME } from '@ibase/constants';
import { Toaster } from '@ibase/ui/components/ui/sonner';
import { AuthProvider } from '../features/auth/components/auth-provider';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME} web application`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
