'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackLabEvent } from '../../lib/labAnalytics';

export function ToolHeader({ id, title, question, technicalName, role = 'LAB TOOL', language = 'th' }) {
  return <header className="lab-tool-head"><p className="eyebrow cyan">KDKAMATO LAB / {role}</p><p className="meta">{id}{technicalName ? ` · ${technicalName}` : ''}</p><h1>{title}</h1><p className="lab-tool-question">{question}</p></header>;
}

export function MeasurementField({ label, unit, value, onChange, step = '0.1', guide, mistake, why, type = 'length', language = 'th' }) {
  const [open, setOpen] = useState(false);
  return <div className="measure-field">
    {why && <p className="measure-why">{why}</p>}
    <label><span>{label}</span><b>{unit}</b><input inputMode="decimal" type="number" min="0" step={step} value={value} onChange={(e) => onChange(e.target.value)} /></label>
    <button type="button" className="measure-help" onClick={() => { const next=!open; setOpen(next); if(next) trackLabEvent('lab_measurement_help_open'); }}>{open ? (language === 'en' ? 'HIDE GUIDE' : 'ซ่อนวิธีวัด') : (language === 'en' ? 'HOW TO MEASURE' : 'วิธีวัด')}</button>
    {open && <div className="measure-guide">
      <div className={`measure-schematic ${type}`} aria-hidden="true"><i/><span>↔</span><i/></div>
      <p>{guide}</p><small>{language === 'en' ? 'COMMON MISTAKE' : 'จุดที่พลาดบ่อย'}: {mistake}</small>
    </div>}
  </div>;
}

export function ResultContract({ result, metric, meaning, use, watch, nextHref, nextLabel, resultCode, children, language = 'th' }) {
  if (!result) return <div className="lab-empty-result"><span>{language === 'en' ? 'YOUR RESULT' : 'ผลของคุณ'}</span><p>{language === 'en' ? 'Complete the required measurements to calculate your result.' : 'กรอกข้อมูลที่จำเป็นให้ครบ ระบบจะคำนวณผลตามสูตรและกฎที่กำหนดไว้'}</p></div>;
  return <div className="result-contract" aria-live="polite">
    <section><span>{language === 'en' ? 'YOUR RESULT' : 'ผลของคุณ'}</span><h2>{result}</h2>{metric && <p className="technical-metric">{metric}</p>}{resultCode && <small>RESULT CODE: {resultCode}</small>}</section>
    <section><span>{language === 'en' ? 'WHAT IT MEANS' : 'หมายความว่าอะไร'}</span><p>{meaning}</p></section>
    <section className="use"><span>{language === 'en' ? 'USE IT FOR' : 'ใช้ทำอะไร'}</span><p>{use}</p></section>
    <section className="watch"><span>{language === 'en' ? 'WATCH OUT' : 'ควรระวังอะไร'}</span><p>{watch}</p></section>
    {children}
    {nextHref && <Link className="lab-next" href={nextHref}>{nextLabel || (language === 'en' ? 'EXPLORE NEXT' : 'ดูต่อ')} <b>→</b></Link>}
  </div>;
}

export function PrivacyStrip({ ruleset, language = 'th' }) {
  return <div className="lab-privacy"><b>{language === 'en' ? 'ON-DEVICE CALCULATION' : 'คำนวณบนอุปกรณ์ของคุณ'}</b><span>{language === 'en' ? 'No account · No server storage · No AI interpretation' : 'ไม่ต้องมีบัญชี · ไม่เก็บค่าร่างกายบนเซิร์ฟเวอร์ · ไม่มี AI ตีความ'}</span>{ruleset && <small>{ruleset.id}</small>}</div>;
}

export function MeasurementCheckNote({ language = 'th' }) {
  return <p className="measurement-check-note">{language === 'en' ? 'Your entered values are never silently changed. If a result looks unusual, check your measurement landmarks and units first.' : 'ระบบจะไม่แก้ค่าที่คุณกรอกเอง หากผลดูผิดปกติ ให้ตรวจจุดที่ใช้วัดและหน่วยวัดก่อนตีความ'}</p>;
}

export function ImportedMeasurementNote({ children, language = 'th' }) {
  return <div className="lab-import-note"><b>{language === 'en' ? 'Previously measured values loaded' : 'นำค่าที่วัดไว้ก่อนหน้าเข้ามาแล้ว'}</b><span>{children}</span></div>;
}

export function ShareResult({ title, text, language = 'th' }) {
  const idle = language === 'en' ? 'SHARE RESULT' : 'แชร์ผล';
  const copied = language === 'en' ? 'COPIED' : 'คัดลอกแล้ว';
  const [status, setStatus] = useState(idle);
  async function share() {
    const payload = `${title}\n${text}\nKDKAMATO LAB`;
    try {
      trackLabEvent('lab_share_preview');
      if (navigator.share) { await navigator.share({ title, text: payload }); trackLabEvent('lab_share_export'); }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(payload); trackLabEvent('lab_share_export'); setStatus(copied); setTimeout(() => setStatus(idle), 1800); }
    } catch (_) {}
  }
  return <button type="button" className="share-result" onClick={share}>{status}</button>;
}
