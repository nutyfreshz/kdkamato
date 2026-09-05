'use client';

import { useMemo } from 'react';
import { computeApeIndex } from '../lib/lab';
import { useLabMeasurement } from '../lib/labSession';

export default function LabPreview() {
  const [height, setHeight] = useLabMeasurement('height','178');
  const [armSpan, setArmSpan] = useLabMeasurement('armSpan','184');
  const result = useMemo(() => computeApeIndex(height, armSpan), [height, armSpan]);
  const headline = result ? (result.diff >= 0 ? `ยาวกว่า ${Math.abs(result.diff)} cm` : `สั้นกว่า ${Math.abs(result.diff)} cm`) : '—';

  return (
    <div className="lab-demo">
      <div className="lab-form">
        <p className="meta">ลองของเล่นชิ้นแรก</p>
        <h3>แขนคุณยาวแค่ไหนเมื่อเทียบกับตัว?</h3>
        <p style={{color:'#8f989b'}}>วัด 2 ค่าแล้วดู reach context ก่อนเปิดดูว่ามันอาจเปลี่ยน setup ของ Bench / Deadlift ยังไง</p>
        <label>ส่วนสูง <span>cm</span><input value={height} onChange={(e) => setHeight(e.target.value)} type="number" /></label>
        <label>ช่วงแขน <span>cm</span><input value={armSpan} onChange={(e) => setArmSpan(e.target.value)} type="number" /></label>
        <a className="lab-button" href="/lab/exercise-fit">ดูว่ามีผลกับท่ายังไง <span>→</span></a>
        <small>Client-side only · ไม่มี AI interpretation · ค่านี้เป็น reach context ไม่ใช่ performance หรือ genetics score</small>
      </div>
      <div className="lab-result" aria-live="polite">
        <p className="meta">ผลแบบภาษาง่ายก่อน</p>
        <div className="result-number" style={{fontSize:'clamp(46px,7vw,92px)'}}>{headline}</div>
        <div className="result-readout"><span>Ape Index</span><b>{result ? `${result.diff >= 0 ? '+' : ''}${result.diff} cm · ${result.ratio}×` : '—'}</b></div>
        <div className="scan-line" aria-hidden="true" />
      </div>
    </div>
  );
}
