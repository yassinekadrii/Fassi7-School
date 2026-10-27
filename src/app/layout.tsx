import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { BrandProtection } from '@/components/BrandProtection';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Fassi7 School — Learning That Fits Your Life | Foreign Language Academy (فصيح)',
  description: 'Fassi7 Language Academy — Learn English, French, German, Spanish, Turkish, and prepare for IELTS, TCF Canada, and Goethe certifications with flexible learning tailored to your lifestyle.',
  keywords: ['Fassi7', 'Fassi7 School', 'Learning That Fits Your Life', 'Language Academy', 'Learn English Algeria', 'IELTS Algeria', 'TCF Canada', 'Goethe Deutsch', 'فصيح'],
  openGraph: {
    title: 'Fassi7 School — Learning That Fits Your Life',
    description: 'A flexible, modern language learning experience that adapts to your lifestyle and goals.',
    images: ['/images/Position 02.jpg.jpeg'],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/images/Fassi7 - Symbol PNG-01.png" />
      </head>
      <body>
        <BrandProtection />
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
