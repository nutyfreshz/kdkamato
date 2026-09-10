'use client';

import { useMemo } from 'react';
import { computeApeIndex } from '../lib/lab';
import { useLabMeasurement } from '../lib/labSession';

export default function LabPreview({ language = 'th' }) {
  const [height, setHeight] = useLabMeasurement('height','178');
  const [armSpan, setArmSpan] = useLabMeasurement('armSpan','184');
  const result = useMemo(() => computeApeIndex(height, armSpan), [height, armSpan]);
  const headline = result
    ? language === 'en'
      ? (result.diff >= 0 ? `${Math.abs(result.diff)} cm longer` : `${Math.abs(result.diff)} cm shorter`)
      : (result.diff >= 0 ? `ยาวกว่า ${Math.abs(result.diff)} ซม.` : `สั้นกว่า ${Math.abs(result.diff)} ซม.`)
    : '—';

  return (
    <div className="lab-demo">
      <div className="lab-form">
        <p className="meta">{language === 'en' ? 'TRY A QUICK CHECK' : 'ลองเช็กสั้น ๆ'}</p>
        <h3>{language === 'en' ? 'How long are your arms relative to your height?' : 'แขนของคุณยาวแค่ไหนเมื่อเทียบกับส่วนสูง?'}</h3>
        <p style={{color:'#8f989b'}}>{language === 'en' ? 'Enter two measurements to see your reach, then explore how it can change movement range and setup in Bench Press or Deadlift.' : 'กรอกเพียง 2 ค่าเพื่อดูระยะเอื้อม (reach) แล้วดูว่าค่านี้อาจส่งผลต่อช่วงการเคลื่อนไหวและการจัดท่าใน Bench Press หรือ Deadlift อย่างไร'}</p>
        <label>{language === 'en' ? 'Height' : 'ส่วนสูง'} <span>cm</span><input value={height} onChange={(e) => setHeight(e.target.value)} type="number" /></label>
        <label>{language === 'en' ? 'Arm span' : 'ช่วงแขน'} <span>cm</span><input value={armSpan} onChange={(e) => setArmSpan(e.target.value)} type="number" /></label>
        <a className="lab-button" href="/lab/exercise-fit">{language === 'en' ? 'SEE HOW IT CHANGES MOVEMENT' : 'ดูว่ามีผลต่อท่าฝึกอย่างไร'} <span>→</span></a>
        <small>{language === 'en' ? 'Calculated on your device · No AI interpretation · Reach does not predict performance or genetics.' : 'คำนวณบนอุปกรณ์ของคุณ · ไม่มีการตีความด้วย AI · ระยะเอื้อมไม่ได้บ่งบอกความเก่งหรือพันธุกรรม'}</small>
      </div>
      <div className="lab-result" aria-live="polite">
        <p className="meta">{language === 'en' ? 'PLAIN RESULT FIRST' : 'ดูผลแบบเข้าใจก่อน'}</p>
        <div className="result-number" style={{fontSize:'clamp(46px,7vw,92px)'}}>{headline}</div>
        <div className="result-readout"><span>Ape Index</span><b>{result ? `${result.diff >= 0 ? '+' : ''}${result.diff} cm · ${result.ratio}×` : '—'}</b></div>
        <div className="scan-line" aria-hidden="true" />
      </div>
    </div>
  );
}
