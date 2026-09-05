'use client';

import { useState } from 'react';

const items = [
  ['MEDICAL BODYBUILDING', '/assets/a06_medical.webp', 'Whole-body physiology as an interconnected living system.'],
  ['TRAINING SCIENCE', '/assets/a07_training_science.webp', 'Mechanical load, force transfer, and tissue response.'],
  ['REHAB', '/assets/a08_rehab.webp', 'Capacity, controlled loading, and biological remodeling.'],
  ['BIOLOGY & PHYSIOLOGY', '/assets/a09_biology.webp', 'Signals are received, regulated, and translated into cellular responses.']
];

export default function KnowledgeSwitcher() {
  const [active, setActive] = useState(0);
  return (
    <div className="knowledge-stage">
      <div className="knowledge-list" role="tablist" aria-label="Knowledge territories">
        {items.map((item, index) => (
          <button
            key={item[0]}
            className={`knowledge-item ${active === index ? 'is-active' : ''}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            role="tab"
            aria-selected={active === index}
          >
            <span>0{index + 1}</span>{item[0]}
          </button>
        ))}
      </div>
      <div className="knowledge-visual">
        {items.map((item, index) => (
          <img key={item[1]} className={`knowledge-image ${active === index ? 'is-active' : ''}`} src={item[1]} alt="" />
        ))}
        <div className="knowledge-caption">{items[active][2]}</div>
      </div>
    </div>
  );
}
