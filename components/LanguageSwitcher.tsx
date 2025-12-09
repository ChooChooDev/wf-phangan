'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [locale, setLocale] = useState(currentLocale);

  const handleChange = (newLocale: string) => {
    setLocale(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
      <button
        onClick={() => handleChange('en')}
        disabled={isPending}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          locale === 'en'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleChange('th')}
        disabled={isPending}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          locale === 'th'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        TH
      </button>
    </div>
  );
}
