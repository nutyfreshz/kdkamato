'use client';

import { useMemo, useState } from 'react';
import { computeApeIndex } from '../lib/lab';

export default function LabPreview() {
  const [height, setHeight] = useState(178);
  const [armSpan, setArmSpan] = useState(184);
  const result = useMemo(() => computeApeIndex(height, armSpan), [height, armSpan]);

  return (
    <div className="lab-demo">
      <div className="lab-form">
        <p className="meta">LIVE DETERMINISTIC PREVIEW</p>
        <h3>HOW DOES YOUR REACH CHANGE THE SETUP?</h3>
        <label>HEIGHT <span>cm</span><input value={height} onChange={(e) => setHeight(e.target.value)} type="number" /></label>
        <label>ARM SPAN <span>cm</span><input value={armSpan} onChange={(e) => setArmSpan(e.target.value)} type="number" /></label>
        <a className="lab-button" href="/lab/exercise-fit">OPEN EXERCISE FIT <span>→</span></a>
        <small>Client-side calculation only. No AI interpretation. Ape Index is reach context, not a performance or genetics score.</small>
      </div>
      <div className="lab-result" aria-live="polite">
        <p className="meta">APE INDEX PREVIEW</p>
        <div className="result-number">{result ? `${result.diff >= 0 ? '+' : ''}${result.diff}` : '—'}</div>
        <div className="result-unit">CM vs HEIGHT</div>
        <div className="result-bar"><span style={{ width: result ? `${Math.max(10, Math.min(90, 50 + result.diff * 3))}%` : '50%' }} /></div>
        <div className="result-readout"><span>ARM SPAN / HEIGHT</span><b>{result ? `${result.ratio}×` : '—'}</b></div>
        <div className="scan-line" aria-hidden="true" />
      </div>
    </div>
  );
}
