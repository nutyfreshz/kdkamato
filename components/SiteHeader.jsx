'use client';

import Link from 'next/link';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

const nav = {
  th: { manga: 'MANGA', knowledge: 'KNOWLEDGE', lab: 'LAB', training: 'TRAINING', guide: 'คู่มือ', kendo: 'KENDO', menu: 'เมนู', close: 'ปิด' },
  en: { manga: 'MANGA', knowledge: 'KNOWLEDGE', lab: 'LAB', training: 'TRAINING', guide: 'GUIDE', kendo: 'KENDO', menu: 'MENU', close: 'CLOSE' }
};

export default function SiteHeader({ language = 'th' }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const c = nav[language] || nav.th;

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" onClick={close}>KDKAMATO</Link>
        <div style={{display:'flex',alignItems:'center'}}>
          <nav className="desktop-nav" aria-label={language === 'en' ? 'Primary navigation' : 'เมนูหลัก'}>
            <Link href="/manga">{c.manga}</Link>
            <Link href="/knowledge">{c.knowledge}</Link>
            <Link href="/lab">{c.lab}</Link>
            <Link href="/training">{c.training}</Link>
            <Link href="/guide">{c.guide}</Link>
          </nav>
          <LanguageSwitcher language={language} />
        </div>
        <button className="menu-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={language === 'en' ? 'Toggle navigation' : 'เปิดหรือปิดเมนู'}>
          {open ? c.close : c.menu}
        </button>
      </header>
      <div className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <Link href="/manga" onClick={close}>{c.manga}</Link>
        <Link href="/knowledge" onClick={close}>{c.knowledge}</Link>
        <Link href="/lab" onClick={close}>{c.lab}</Link>
        <Link href="/training" onClick={close}>{c.training}</Link>
        <Link href="/guide" onClick={close}>{c.guide}</Link>
        <Link href="/#kendo" onClick={close}>{c.kendo}</Link>
        <LanguageSwitcher language={language} mobile onChange={close} />
      </div>
    </>
  );
}
