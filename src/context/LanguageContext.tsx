'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, getTranslation } from '@/lib/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: 'rtl' | 'ltr';
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  dir: 'ltr',
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Only switch language if user explicitly chose one using the language selector
    const explicitlyChosen = localStorage.getItem('fassi7_user_lang') as Locale | null;
    if (explicitlyChosen && (explicitlyChosen === 'ar' || explicitlyChosen === 'fr' || explicitlyChosen === 'en')) {
      setLocaleState(explicitlyChosen);
      document.documentElement.lang = explicitlyChosen;
      document.documentElement.dir = explicitlyChosen === 'ar' ? 'rtl' : 'ltr';
    } else {
      // Default to English first when opening the website
      setLocaleState('en');
      localStorage.setItem('fassi7_user_lang', 'en');
      localStorage.setItem('fassi7_locale', 'en');
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('fassi7_user_lang', newLocale);
    localStorage.setItem('fassi7_locale', newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
  };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const t = (key: string) => getTranslation(key, locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
