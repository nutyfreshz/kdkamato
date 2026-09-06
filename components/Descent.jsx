'use client';

import { useEffect, useRef, useState } from 'react';

const content = {
  th: [
    { image: '/assets/a02_body.webp', eyebrow: 'ใต้สิ่งที่มองเห็น / 01', title: <>การฝึก<br/>มองเห็นได้</> },
    { image: '/assets/a03_signal.webp', eyebrow: 'ใต้สิ่งที่มองเห็น / 02', title: <>แต่สัญญาณที่ร่างกายรับ<br/>มองไม่เห็น</> },
    { image: '/assets/a04_cell.webp', eyebrow: 'ใต้สิ่งที่มองเห็น / 03', title: <>การปรับตัว<br/>เริ่มจากข้างใน</> },
    { image: '/assets/a05_tissue.webp', eyebrow: 'ใต้สิ่งที่มองเห็น / 04', title: <>เราเข้าไปดู<br/>ว่ามันเกิดขึ้นอย่างไร</> }
  ],
  en: [
    { image: '/assets/a02_body.webp', eyebrow: 'BENEATH THE SURFACE / 01', title: <>TRAINING<br/>IS VISIBLE.</> },
    { image: '/assets/a03_signal.webp', eyebrow: 'BENEATH THE SURFACE / 02', title: <>THE SIGNAL<br/>ISN&apos;T.</> },
    { image: '/assets/a04_cell.webp', eyebrow: 'BENEATH THE SURFACE / 03', title: <>ADAPTATION<br/>HAPPENS HERE.</> },
    { image: '/assets/a05_tissue.webp', eyebrow: 'BENEATH THE SURFACE / 04', title: <>WE GO<br/>INSIDE.</> }
  ]
};

export default function Descent({ language = 'th' }) {
  const root = useRef(null);
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const stages = content[language] || content.th;

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const el = root.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / travel));
      setProgress(p);
      setStage(Math.min(stages.length - 1, Math.floor(p * stages.length)));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [stages.length]);

  return (
    <section className="descent" ref={root} id="descent" aria-label={language === 'en' ? 'Beneath the surface' : 'สิ่งที่เกิดขึ้นใต้สิ่งที่มองเห็น'}>
      <div className="descent-sticky">
        <div className="descent-media" aria-hidden="true">
          {stages.map((item, index) => (
            <img key={item.image} className={`descent-frame ${stage === index ? 'is-active' : ''}`} src={item.image} alt="" />
          ))}
          <div className="descent-shade" />
        </div>
        <div className="shell descent-copy-wrap">
          {stages.map((item, index) => (
            <div key={item.eyebrow} className={`descent-copy ${stage === index ? 'is-active' : ''}`}>
              <p className="eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
            </div>
          ))}
        </div>
        <div className="descent-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
      </div>
    </section>
  );
}
