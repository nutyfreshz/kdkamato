'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackLabEvent } from '../../lib/labAnalytics';
import { LabSaveResult } from './LabSaveResult';

function simpleMeasurementCopy(label, language, guide, mistake, why) {
  const text = String(label || '').toLowerCase();
  const th = language !== 'en';
  const has = (...terms) => terms.some((term) => text.includes(term.toLowerCase()));

  if (has('femur', 'ต้นขา')) return th ? {
    why: 'ใช้ดูว่าสัดส่วนต้นขาของคุณมีผลต่อท่า Squat อย่างไร',
    path: 'ปุ่มกระดูกสะโพกด้านข้าง → กึ่งกลางหัวเข่าด้านข้าง',
    guide: 'ยืนตรง แล้ววัดด้านข้างของขาเป็นเส้นตรงจากสะโพกถึงหัวเข่า หน่วยเป็น ซม.',
    mistake: 'อย่าวัดจากขอบกางเกง หรือจุดที่เปลี่ยนตำแหน่งได้ง่าย',
  } : {
    why: 'Used to understand how your thigh proportion can affect Squat setup.',
    path: 'Side hip bone → center of the outside of the knee',
    guide: 'Stand tall and measure a straight line down the side of the leg from hip to knee in cm.',
    mistake: 'Do not use clothing edges or landmarks that move between measurements.',
  };

  if (has('tibia', 'หน้าแข้ง')) return th ? {
    why: 'ใช้เปรียบเทียบความยาวหน้าแข้งกับต้นขา เพื่อดูสัดส่วนช่วงขา',
    path: 'กึ่งกลางหัวเข่าด้านข้าง → ปุ่มกระดูกข้อเท้าด้านนอก',
    guide: 'ยืนตรง แล้ววัดด้านข้างของขาเป็นเส้นตรงจากหัวเข่าถึงข้อเท้า หน่วยเป็น ซม.',
    mistake: 'อย่าวัดเฉียง และใช้จุดหัวเข่าหรือข้อเท้าคนละจุดในแต่ละครั้ง',
  } : {
    why: 'Used with femur length to describe your leg proportions.',
    path: 'Center of the outside of the knee → outer ankle bone',
    guide: 'Stand tall and measure a straight line down the side of the lower leg from knee to ankle in cm.',
    mistake: 'Do not measure diagonally or change the knee/ankle landmarks.',
  };

  if (has('torso', 'ลำตัว')) return th ? {
    why: 'ใช้ประมาณความยาวลำตัวเพื่อช่วยดูตำแหน่งในท่า Squat',
    path: 'ปุ่มกระดูกสะโพกด้านข้าง → ปลายหัวไหล่ด้านข้าง',
    guide: 'ยืนตรง แล้ววัดด้านข้างลำตัวจากสะโพกขึ้นไปถึงปลายหัวไหล่ หน่วยเป็น ซม.',
    mistake: 'อย่าวัดอ้อมตามลำตัว หรือเปลี่ยนจุดสะโพกและหัวไหล่ระหว่างครั้ง',
  } : {
    why: 'A simple torso estimate used as extra context for Squat geometry.',
    path: 'Side hip bone → outer tip of the shoulder',
    guide: 'Stand tall and measure up the side of the torso from hip to shoulder in cm.',
    mistake: 'Do not wrap the tape around the body or change the landmarks between measurements.',
  };

  if (has('arm span', 'ช่วงแขน')) return th ? {
    why: 'ใช้ดูระยะเอื้อม (reach) ของคุณเทียบกับส่วนสูง',
    path: 'ปลายนิ้วกลางซ้าย → ปลายนิ้วกลางขวา',
    guide: 'ยืนชิดผนัง กางแขนตรงระดับไหล่ แล้ววัดจากปลายนิ้วกลางข้างหนึ่งถึงอีกข้าง หน่วยเป็น ซม.',
    mistake: 'อย่างอศอก อย่ายกไหล่ หรือวัดตามแนวโค้ง',
  } : {
    why: 'Used to compare your reach with your height.',
    path: 'Left middle fingertip → right middle fingertip',
    guide: 'Stand against a wall, arms straight at shoulder height, and measure fingertip to fingertip in cm.',
    mistake: 'Do not bend the elbows, shrug, or measure along a curved path.',
  };

  if (has('height', 'ส่วนสูง')) return th ? {
    why: 'ใช้เป็นค่าฐานสำหรับเปรียบเทียบกับสัดส่วนอื่น',
    path: 'พื้น → จุดสูงสุดของศีรษะ',
    guide: 'ถอดรองเท้า ยืนตรงชิดผนัง มองตรง แล้ววัดจากพื้นถึงจุดสูงสุดของศีรษะ หน่วยเป็น ซม.',
    mistake: 'อย่าวัดขณะใส่รองเท้า หรือยืนบนพื้นเอียง',
  } : {
    why: 'Used as the reference for your other body proportions.',
    path: 'Floor → top of head',
    guide: 'Barefoot, stand tall against a wall, look straight ahead, and measure floor to top of head in cm.',
    mistake: 'Do not measure in shoes or on an uneven floor.',
  };

  if (has('shoulder', 'ไหล่')) return th ? {
    why: 'ใช้เปรียบเทียบขนาดช่วงไหล่กับรอบเอว',
    path: 'พันสายวัดรอบส่วนที่กว้างที่สุดของหัวไหล่หรือกล้ามเนื้อเดลต์',
    guide: 'ยืนผ่อนคลาย ให้สายวัดผ่านส่วนที่กว้างที่สุดของหัวไหล่ทั้งสองข้าง แล้วอ่านค่าเป็น ซม.',
    mistake: 'อย่าดึงสายวัดแน่นจนกดเนื้อ และอย่าวัดคนละระดับในแต่ละครั้ง',
  } : {
    why: 'Used to compare shoulder size with waist size.',
    path: 'Tape around the widest part of both shoulders/delts',
    guide: 'Stand relaxed, keep the tape level around the widest shoulder/delt area, and read the circumference in cm.',
    mistake: 'Do not pull the tape tight enough to compress tissue or change the measuring level.',
  };

  if (has('waist', 'เอว')) return th ? {
    why: 'ใช้เปรียบเทียบกับรอบไหล่ และติดตามสัดส่วนเดิมอย่างสม่ำเสมอ',
    path: 'พันสายวัดรอบเอวที่ระดับสะดือ',
    guide: 'ยืนผ่อนคลาย หายใจออกตามปกติ แล้ววัดรอบเอวระดับสะดือ หน่วยเป็น ซม.',
    mistake: 'อย่าแขม่วท้อง และอย่าสลับไปวัดตรงเอวคอดที่สุดในครั้งอื่น',
  } : {
    why: 'Used with shoulder circumference and for consistent tracking.',
    path: 'Tape around the waist at navel level',
    guide: 'Stand relaxed, exhale normally, and measure the waist circumference at navel level in cm.',
    mistake: 'Do not suck in your stomach or switch to the narrowest waist point later.',
  };

  if (has('knee-to-wall', 'เข่าถึงผนัง', 'knee to wall')) return th ? {
    why: 'ใช้ระยะเข่าถึงผนังเพื่อเปรียบเทียบว่าแต่ละข้างสามารถเข่าเดินหน้าได้มากน้อยต่างกันแค่ไหนขณะลงน้ำหนัก',
    path: 'ปลายนิ้วโป้งเท้า → กำแพง',
    guide: 'หันหน้าเข้าผนัง วางเท้าราบ ดันเข่าแตะผนังโดยส้นเท้าไม่ยก แล้วเลื่อนเท้าออกจนได้ระยะไกลที่สุดที่ทำซ้ำได้ วัดจากจุดเดิมของเท้าถึงผนัง',
    mistake: 'อย่าปล่อยส้นเท้าลอย อย่าหมุนเท้าเปลี่ยนมุมมากเกินไป หรือใช้จุดวัดคนละจุดระหว่างซ้ายและขวา',
  } : {
    why: 'Shows how far the knee can travel forward while the foot stays flat.',
    path: 'Big toe → wall',
    guide: 'Face a wall, keep the foot flat, touch the knee to the wall without lifting the heel, then move the foot back to the farthest repeatable distance. Measure big toe to wall.',
    mistake: 'The result is not valid if the heel lifts or the foot rotates substantially.',
  };

  if (has('body fat', 'bodyfat', 'ไขมัน')) return th ? {
    why: 'ใช้ร่วมกับน้ำหนักเพื่อคำนวณมวลไร้ไขมันและ FFMI',
    path: 'กรอกเปอร์เซ็นต์ไขมันจากวิธีที่คุณใช้จริง',
    guide: 'ใช้ค่าจากเครื่องหรือวิธีประเมินที่คุณใช้จริง และหากต้องการเปรียบเทียบในครั้งต่อไป ควรใช้วิธีเดิม',
    mistake: 'อย่าถือว่าค่าเปอร์เซ็นต์ไขมันเป็นค่าที่แม่นยำ 100%',
  } : {
    why: 'Used with body weight to estimate fat-free mass and FFMI.',
    path: 'Enter the body-fat % from the method you actually use',
    guide: 'Use your real estimate from your current method, and use the same method for future comparisons.',
    mistake: 'Do not treat body-fat estimates as perfectly accurate.',
  };

  if (has('weight', 'น้ำหนัก')) return th ? {
    why: 'ใช้คำนวณ FFMI และติดตามการเปลี่ยนแปลง',
    path: 'ชั่งด้วยเครื่องชั่งตามปกติ',
    guide: 'หากต้องการติดตาม ให้ชั่งในช่วงเวลาและเงื่อนไขใกล้เคียงกัน เช่น ตอนเช้าหลังเข้าห้องน้ำ',
    mistake: 'อย่าเปรียบเทียบน้ำหนักที่ชั่งคนละช่วงเวลาและคนละสภาพ แล้วตีความมากเกินไป',
  } : {
    why: 'Used for FFMI and progress tracking.',
    path: 'Use a normal body-weight scale',
    guide: 'For tracking, weigh under similar conditions each time, such as in the morning after using the bathroom.',
    mistake: 'Avoid overinterpreting readings taken under very different conditions.',
  };

  return { why, path: null, guide, mistake };
}

export function ToolHeader({ id, title, question, technicalName, role = 'LAB TOOL', language = 'th' }) {
  return <header className="lab-tool-head"><p className="eyebrow cyan">KDKAMATO LAB / {role}</p><p className="meta">{id}{technicalName ? ` · ${technicalName}` : ''}</p><h1>{title}</h1><p className="lab-tool-question">{question}</p></header>;
}

export function MeasurementField({ label, unit, value, onChange, step = '0.1', guide, mistake, why, language = 'th' }) {
  const [open, setOpen] = useState(false);
  const copy = simpleMeasurementCopy(label, language, guide, mistake, why);
  const displayUnit = language !== 'en' && unit === 'cm' ? 'ซม.' : unit;
  return <div className="measure-field">
    {copy.why && <p className="measure-why">{copy.why}</p>}
    <label><span>{label}</span><b>{displayUnit}</b><input inputMode="decimal" type="number" min="0" step={step} value={value} onChange={(e) => onChange(e.target.value)} /></label>
    <button type="button" className="measure-help" onClick={() => { const next=!open; setOpen(next); if(next) trackLabEvent('lab_measurement_help_open'); }}>{open ? (language === 'en' ? 'HIDE GUIDE' : 'ซ่อนวิธีวัด') : (language === 'en' ? 'SIMPLE MEASURING GUIDE' : 'วิธีวัดอย่างง่าย')}</button>
    {open && <div className="measure-guide">
      {copy.path && <p><strong>{language === 'en' ? 'MEASURE:' : 'วัดจาก:'}</strong> {copy.path}</p>}
      <p>{copy.guide}</p>
      <small><strong>{language === 'en' ? 'AVOID' : 'ข้อควรระวัง'}:</strong> {copy.mistake}</small>
    </div>}
  </div>;
}

export function ResultContract({ result, metric, meaning, use, watch, nextHref, nextLabel, resultCode, children, language = 'th' }) {
  if (!result) return <div className="lab-empty-result"><span>{language === 'en' ? 'YOUR RESULT' : 'ผลของคุณ'}</span><p>{language === 'en' ? 'Complete the required measurements to calculate your result.' : 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน ระบบจะคำนวณผลตามสูตรและเงื่อนไขที่กำหนดไว้'}</p></div>;
  return <div className="result-contract" aria-live="polite">
    <section><span>{language === 'en' ? 'YOUR RESULT' : 'ผลของคุณ'}</span><h2>{result}</h2>{metric && <p className="technical-metric">{metric}</p>}{resultCode && <small>RESULT CODE: {resultCode}</small>}</section>
    <section><span>{language === 'en' ? 'WHAT IT MEANS' : 'หมายความว่าอะไร'}</span><p>{meaning}</p></section>
    <section className="use"><span>{language === 'en' ? 'USE IT FOR' : 'ใช้ทำอะไร'}</span><p>{use}</p></section>
    <section className="watch"><span>{language === 'en' ? 'WATCH OUT' : 'ควรระวังอะไร'}</span><p>{watch}</p></section>
    {children}
    <LabSaveResult language={language} result={result} metric={metric} meaning={meaning} use={use} watch={watch} resultCode={resultCode} />
    {nextHref && <Link className="lab-next" href={nextHref}>{nextLabel || (language === 'en' ? 'EXPLORE NEXT' : 'ดูต่อ')} <b>→</b></Link>}
  </div>;
}

export function PrivacyStrip({ ruleset, language = 'th' }) {
  return <div className="lab-privacy"><b>{language === 'en' ? 'ON-DEVICE CALCULATION' : 'คำนวณบนอุปกรณ์ของคุณ'}</b><span>{language === 'en' ? 'No account required · Server storage only when you choose Save to account' : 'ไม่ต้องมีบัญชีก็ใช้ได้ · บันทึกลงเซิร์ฟเวอร์เฉพาะเมื่อคุณกดบันทึกเข้าบัญชี'}</span>{ruleset && <small>{ruleset.id}</small>}</div>;
}

export function MeasurementCheckNote({ language = 'th' }) {
  return <p className="measurement-check-note">{language === 'en' ? 'Your entered values are never silently changed. If a result looks unusual, check your measurement landmarks and units first.' : 'ระบบจะไม่แก้ไขค่าที่คุณกรอกเอง หากผลดูผิดปกติ ให้ตรวจสอบจุดวัดและหน่วยวัดก่อนตีความ'}</p>;
}

export function ImportedMeasurementNote({ children, language = 'th' }) {
  return <div className="lab-import-note"><b>{language === 'en' ? 'Previously measured values loaded' : 'ระบบนำค่าที่วัดไว้ก่อนหน้ามาใช้แล้ว'}</b><span>{children}</span></div>;
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
