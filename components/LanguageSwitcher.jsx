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
    <div className={mobile ? 'mobile-language-switch' : 'language-switch'} aria-label="Language">
      <button type="button" className={language === 'th' ? 'is-active' : ''} onClick={() => setLanguage('th')}>TH</button>
      <button type="button" className={language === 'en' ? 'is-active' : ''} onClick={() => setLanguage('en')}>EN</button>
    </div>
  );
}
