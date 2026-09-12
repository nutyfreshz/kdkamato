'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';

const nav = {
  th: { manga: 'MANGA', knowledge: 'KNOWLEDGE', lab: 'LAB', training: 'TRAINING', guide: 'KDKAMATO GUIDELINE', kendo: 'KENDO', menu: 'เมนู', close: 'ปิด' },
  en: { manga: 'MANGA', knowledge: 'KNOWLEDGE', lab: 'LAB', training: 'TRAINING', guide: 'KDKAMATO GUIDELINE', kendo: 'KENDO', menu: 'MENU', close: 'CLOSE' }
};

export default function SiteHeader({ language = 'th' }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef(null);
  const close = () => setOpen(false);
  const c = nav[language] || nav.th;

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const primaryLinks = [
    ['/manga', c.manga],
    ['/knowledge', c.knowledge],
    ['/lab', c.lab],
    ['/training', c.training],
    ['/guide', c.guide]
  ];

  return (
    <>
      <a className="skip-link" href="#main-content">{language === 'en' ? 'Skip to content' : 'ข้ามไปเนื้อหา'}</a>
      <header className="site-header">
        <Link className="brand" href="/" onClick={close}>KDKAMATO</Link>
        <div style={{display:'flex',alignItems:'center'}}>
          <nav className="desktop-nav" aria-label={language === 'en' ? 'Primary navigation' : 'เมนูหลัก'}>
            {primaryLinks.map(([href, label]) => (
              <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined}>{label}</Link>
            ))}
          </nav>
          <LanguageSwitcher language={language} />
        </div>
        <button
          ref={menuButtonRef}
          className="menu-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={language === 'en' ? 'Toggle navigation' : 'เปิดหรือปิดเมนู'}
        >
          {open ? c.close : c.menu}
        </button>
      </header>
      {open && (
        <nav id="mobile-navigation" className="mobile-menu is-open" aria-label={language === 'en' ? 'Mobile navigation' : 'เมนูมือถือ'}>
          {primaryLinks.map(([href, label]) => (
            <Link key={href} href={href} onClick={close} aria-current={isActive(href) ? 'page' : undefined}>{label}</Link>
          ))}
          <Link href="/#kendo" onClick={close}>{c.kendo}</Link>
          <LanguageSwitcher language={language} mobile onChange={close} />
        </nav>
      )}
    </>
  );
}
