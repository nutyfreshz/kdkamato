'use client';

import { useRouter } from 'next/navigation';

export default function LanguageSwitcher({ language = 'th', mobile = false, onChange }) {
  const router = useRouter();

  function setLanguage(next) {
    if (next === language) return;
    document.cookie = `kdkamato_language=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
    onChange?.();
    router.refresh();
  }

  return (
    <div className={mobile ? 'mobile-language-switch' : 'language-switch'} aria-label={language === 'en' ? 'Language' : 'ภาษา'}>
      <button type="button" aria-label="ภาษาไทย" aria-pressed={language === 'th'} className={language === 'th' ? 'is-active' : ''} onClick={() => setLanguage('th')}>TH</button>
      <button type="button" aria-label="English" aria-pressed={language === 'en'} className={language === 'en' ? 'is-active' : ''} onClick={() => setLanguage('en')}>EN</button>
    </div>
  );
}
