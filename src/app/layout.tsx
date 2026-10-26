import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Fassi7 (فصيح) — Learning That Fits Your Life | أكاديمية تعليم اللغات',
  description: 'أكاديمية فصيح لتعليم اللغات الأجنبية (الإنجليزية، الفرنسية، الألمانية، الإسبانية، التركية) والتحضير لشهادات IELTS و TCF و Goethe بأحدث المناهج التفاعلية التي تتكيف مع نمط حياتك.',
  keywords: ['Fassi7', 'فصيح', 'Learning That Fits Your Life', 'Multilinguo', 'تعليم اللغات', 'IELTS الجزائر', 'TCF Canada الجزائر', 'Goethe Allemand', 'تعلم الإنجليزية الجزائر'],
  openGraph: {
    title: 'Fassi7 (فصيح) — Learning That Fits Your Life',
    description: 'De Multilinguo à Fassi7 : Une expérience d\'apprentissage linguistique flexible qui s\'adapte à votre vie.',
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/images/Fassi7 - Symbol PNG-01.png" />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
