'use client';

import { useState } from 'react';

const items = {
  th: [
    ['MEDICAL BODYBUILDING', '/assets/a06_medical.webp', 'มองร่างกายทั้งระบบ ตั้งแต่การควบคุมภายในจนถึงผลลัพธ์ที่เห็นภายนอก'],
    ['TRAINING SCIENCE', '/assets/a07_training_science.webp', 'เข้าใจแรง การเคลื่อนไหว ภาระที่เนื้อเยื่อได้รับ และเหตุผลที่การจัดท่าแตกต่างกัน'],
    ['REHAB', '/assets/a08_rehab.webp', 'เข้าใจความสามารถของเนื้อเยื่อ การเพิ่มภาระอย่างเป็นขั้นตอน และการกลับไปใช้งานจริง'],
    ['BIOLOGY & PHYSIOLOGY', '/assets/a09_biology.webp', 'ติดตามว่าสัญญาณถูกส่ง รับ และเปลี่ยนเป็นการตอบสนองของเซลล์ได้อย่างไร']
  ],
  en: [
    ['MEDICAL BODYBUILDING', '/assets/a06_medical.webp', 'Whole-body physiology as an interconnected living system.'],
    ['TRAINING SCIENCE', '/assets/a07_training_science.webp', 'Mechanical load, force transfer, movement, and tissue response.'],
    ['REHAB', '/assets/a08_rehab.webp', 'Capacity, progressive loading, recovery, and return to performance.'],
    ['BIOLOGY & PHYSIOLOGY', '/assets/a09_biology.webp', 'How signals are received, regulated, and translated into cellular responses.']
  ]
};

export default function KnowledgeSwitcher({ language = 'th' }) {
  const [active, setActive] = useState(0);
  const content = items[language] || items.th;
  return (
    <div className="knowledge-stage">
      <div className="knowledge-list" role="group" aria-label={language === 'en' ? 'Knowledge territories' : 'หมวดความรู้'}>
        {content.map((item, index) => (
          <button
            key={item[0]}
            className={`knowledge-item ${active === index ? 'is-active' : ''}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            aria-pressed={active === index}
          >
            <span>0{index + 1}</span>{item[0]}
          </button>
        ))}
      </div>
      <div className="knowledge-visual" aria-live="polite">
        {content.map((item, index) => (
          <img key={item[1]} className={`knowledge-image ${active === index ? 'is-active' : ''}`} src={item[1]} alt="" />
        ))}
        <div className="knowledge-caption">{content[active][2]}</div>
      </div>
    </div>
  );
}
