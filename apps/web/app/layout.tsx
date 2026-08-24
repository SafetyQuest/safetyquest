import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";
import { Providers } from './providers';
import { OPERATOR, SITE_URL } from '@/lib/site';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SafetyQuest — Workplace Safety Training Platform",
    template: "%s | SafetyQuest",
  },
  description:
    "SafetyQuest is a workplace safety learning platform used by enterprise organizations to deliver, track and record mandatory safety training for employees and contractors. Operated by " +
    OPERATOR +
    ".",
  applicationName: "SafetyQuest",
  authors: [{ name: OPERATOR }],
  publisher: OPERATOR,
  openGraph: {
    type: "website",
    siteName: "SafetyQuest",
    url: SITE_URL,
    title: "SafetyQuest — Workplace Safety Training Platform",
    description:
      "A workplace safety learning platform used by enterprise organizations to deliver, track and record mandatory safety training.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}