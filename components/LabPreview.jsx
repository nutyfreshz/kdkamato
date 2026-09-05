'use client';

import { useMemo, useState } from 'react';

export default function LabPreview() {
  const [height, setHeight] = useState(178);
  const [wrist, setWrist] = useState(18);
  const [ankle, setAnkle] = useState(24);

  const score = useMemo(() => {
    const raw = ((wrist / height) * 4200 + (ankle / height) * 2200) / 2;
    return Math.max(45, Math.min(95, Math.round(raw)));
  }, [height, wrist, ankle]);

  return (
    <div className="lab-demo">
      <div className="lab-form">
        <p className="meta">INTERACTION PREVIEW</p>
        <h3>HOW GOOD IS YOUR FRAME?</h3>
        <label>HEIGHT <span>cm</span><input value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} type="number" /></label>
        <label>WRIST <span>cm</span><input value={wrist} onChange={(e) => setWrist(Number(e.target.value) || 0)} type="number" step="0.1" /></label>
        <label>ANKLE <span>cm</span><input value={ankle} onChange={(e) => setAnkle(Number(e.target.value) || 0)} type="number" step="0.1" /></label>
        <a className="lab-button" href="/lab/frame-analysis">OPEN FULL TOOL <span>→</span></a>
        <small>Preview score is UI-only. The real tool will use validated calculation logic before launch.</small>
      </div>
      <div className="lab-result" aria-live="polite">
        <p className="meta">FRAME PREVIEW</p>
        <div className="result-number">{score}</div>
        <div className="result-bar"><span style={{ width: `${score}%` }} /></div>
        <div className="result-readout"><span>INPUT PROFILE</span><b>PREVIEW</b></div>
        <div className="scan-line" aria-hidden="true" />
      </div>
    </div>
  );
}
