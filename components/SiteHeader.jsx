'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" onClick={close}>KDKAMATO</Link>
        <nav className="desktop-nav" aria-label="Primary">
          <Link href="/manga">MANGA</Link>
          <Link href="/knowledge">KNOWLEDGE</Link>
          <Link href="/lab">LAB</Link>
          <Link href="/training">TRAINING</Link>
        </nav>
        <button className="menu-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle navigation">
          {open ? 'CLOSE' : 'MENU'}
        </button>
      </header>
      <div className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <Link href="/manga" onClick={close}>MANGA</Link>
        <Link href="/knowledge" onClick={close}>KNOWLEDGE</Link>
        <Link href="/lab" onClick={close}>LAB</Link>
        <Link href="/training" onClick={close}>TRAINING</Link>
        <Link href="/#kendo" onClick={close}>KENDO</Link>
      </div>
    </>
  );
}
