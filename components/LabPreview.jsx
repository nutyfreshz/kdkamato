'use client';

import { useMemo } from 'react';
import { computeApeIndex } from '../lib/lab';
import { useLabMeasurement } from '../lib/labSession';

export default function LabPreview({ language = 'th' }) {
  const [height, setHeight] = useLabMeasurement('height');
  const [armSpan, setArmSpan] = useLabMeasurement('armSpan');
  const result = useMemo(() => computeApeIndex(height, armSpan), [height, armSpan]);
  const hasInvalidValue = [height, armSpan].some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) <= 0));
  const status = hasInvalidValue
    ? (language === 'en' ? 'Enter measurements greater than zero.' : 'กรอกค่าที่มากกว่าศูนย์')
    : (language === 'en' ? 'Enter both measurements to see your result.' : 'กรอกให้ครบทั้งสองค่าเพื่อดูผลของคุณ');
  const headline = result
    ? result.diff === 0
      ? (language === 'en' ? 'Equal' : 'เท่ากัน')
      : language === 'en'
      ? (result.diff >= 0 ? `${Math.abs(result.diff)} cm longer` : `${Math.abs(result.diff)} cm shorter`)
      : (result.diff >= 0 ? `ยาวกว่า ${Math.abs(result.diff)} ซม.` : `สั้นกว่า ${Math.abs(result.diff)} ซม.`)
    : '—';

  return (
    <div className="lab-demo">
      <div className="lab-form">
        <p className="meta">{language === 'en' ? 'TRY A QUICK CHECK' : 'ลองเช็กสั้น ๆ'}</p>
        <h3>{language === 'en' ? 'How does your arm span compare with your height?' : 'ช่วงแขนเมื่อกางแขนเทียบกับส่วนสูงเป็นอย่างไร?'}</h3>
        <p style={{color:'#8f989b'}}>{language === 'en' ? 'Enter two measurements to see your reach, then explore how it can change movement range and setup in Bench Press or Deadlift.' : 'กรอกเพียง 2 ค่าเพื่อดูระยะเอื้อม (reach) แล้วดูว่าค่านี้อาจส่งผลต่อช่วงการเคลื่อนไหวและการจัดท่าใน Bench Press หรือ Deadlift อย่างไร'}</p>
        <label>{language === 'en' ? 'Height' : 'ส่วนสูง'} <span>{language === 'en' ? 'cm' : 'ซม.'}</span><input value={height} onChange={(e) => setHeight(e.target.value)} type="number" inputMode="decimal" step="any" /></label>
        <label>{language === 'en' ? 'Arm span' : 'ช่วงแขนเมื่อกางแขน'} <span>{language === 'en' ? 'cm' : 'ซม.'}</span><input value={armSpan} onChange={(e) => setArmSpan(e.target.value)} type="number" inputMode="decimal" step="any" aria-describedby="home-arm-span-help" /></label>
        <small id="home-arm-span-help">{language === 'en' ? 'Measure fingertip to fingertip with both arms extended horizontally.' : 'กางแขนทั้งสองข้างในแนวราบ วัดจากปลายนิ้วมือข้างหนึ่งถึงอีกข้าง'}</small>
        <a className="lab-button" href="/lab/exercise-fit">{language === 'en' ? 'SEE HOW IT CHANGES MOVEMENT' : 'ดูว่ามีผลต่อท่าฝึกอย่างไร'} <span>→</span></a>
        <small>{language === 'en' ? 'Calculated on your device · Reach does not predict performance or genetics.' : 'คำนวณบนอุปกรณ์ของคุณ · ระยะเอื้อมไม่ได้บ่งบอกความเก่งหรือพันธุกรรม'}</small>
      </div>
      <div className="lab-result" aria-live="polite">
        <p className="meta">{language === 'en' ? 'ARM SPAN VS HEIGHT' : 'ช่วงแขนเทียบกับส่วนสูง'}</p>
        <div className="result-number" style={{fontSize:'clamp(46px,7vw,92px)'}}>{headline}</div>
        <div className="result-readout"><span>Ape Index</span><b>{result ? `${result.diff >= 0 ? '+' : ''}${result.diff} ${language === 'en' ? 'cm' : 'ซม.'} · ${result.ratio}×` : '—'}</b></div>
        {!result && <p role="status">{status}</p>}
        <div className="scan-line" aria-hidden="true" />
      </div>
    </div>
  );
}
