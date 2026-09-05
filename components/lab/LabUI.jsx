'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackLabEvent } from '../../lib/labAnalytics';

export function ToolHeader({ id, title, question, technicalName, role = 'LAB TOOL' }) {
  return <><LabStyles/><header className="lab-tool-head"><p className="eyebrow cyan">KDKAMATO LAB / {role}</p><p className="meta">{id}{technicalName ? ` · ${technicalName}` : ''}</p><h1>{title}</h1><p className="lab-tool-question">{question}</p></header></>;
}

export function MeasurementField({ label, unit, value, onChange, step = '0.1', guide, mistake, why, type = 'length' }) {
  const [open, setOpen] = useState(false);
  return <div className="measure-field">
    {why && <p className="measure-why">{why}</p>}
    <label><span>{label}</span><b>{unit}</b><input inputMode="decimal" type="number" min="0" step={step} value={value} onChange={(e) => onChange(e.target.value)} /></label>
    <button type="button" className="measure-help" onClick={() => { const next=!open; setOpen(next); if(next) trackLabEvent('lab_measurement_help_open'); }}>{open ? 'HIDE GUIDE' : 'HOW TO MEASURE'}</button>
    {open && <div className="measure-guide">
      <div className={`measure-schematic ${type}`} aria-hidden="true"><i/><span>↔</span><i/></div>
      <p>{guide}</p><small>COMMON MISTAKE: {mistake}</small>
    </div>}
  </div>;
}

export function ResultContract({ result, metric, meaning, use, watch, nextHref, nextLabel, resultCode, children }) {
  if (!result) return <div className="lab-empty-result"><span>YOUR RESULT</span><p>กรอกข้อมูลให้ครบเพื่อดูผลแบบ deterministic</p></div>;
  return <div className="result-contract" aria-live="polite">
    <section><span>YOUR RESULT</span><h2>{result}</h2>{metric && <p className="technical-metric">{metric}</p>}{resultCode && <small>RESULT CODE: {resultCode}</small>}</section>
    <section><span>WHAT IT MEANS</span><p>{meaning}</p></section>
    <section className="use"><span>USE IT FOR</span><p>{use}</p></section>
    <section className="watch"><span>WATCH OUT</span><p>{watch}</p></section>
    {children}
    {nextHref && <Link className="lab-next" href={nextHref}>{nextLabel || 'EXPLORE NEXT'} <b>→</b></Link>}
  </div>;
}

export function PrivacyStrip({ ruleset }) {
  return <div className="lab-privacy"><b>CLIENT-SIDE ONLY</b><span>No account · No server storage · No AI interpretation</span>{ruleset && <small>{ruleset.id}</small>}</div>;
}

export function MeasurementCheckNote() {
  return <p className="measurement-check-note">ค่าที่กรอกจะไม่ถูกแก้เงียบ ๆ หากผลดูผิดปกติ ให้ตรวจ landmark และหน่วยวัดก่อนตีความ</p>;
}

export function ImportedMeasurementNote({ children }) {
  return <div className="lab-import-note"><b>เราใส่ค่าที่คุณวัดไว้ให้แล้ว</b><span>{children}</span></div>;
}

export function ShareResult({ title, text }) {
  const [status, setStatus] = useState('SHARE RESULT');
  async function share() {
    const payload = `${title}\n${text}\nKDKAMATO LAB`;
    try {
      trackLabEvent('lab_share_preview');
      if (navigator.share) { await navigator.share({ title, text: payload }); trackLabEvent('lab_share_export'); }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(payload); trackLabEvent('lab_share_export'); setStatus('COPIED'); setTimeout(() => setStatus('SHARE RESULT'), 1800); }
    } catch (_) {}
  }
  return <button type="button" className="share-result" onClick={share}>{status}</button>;
}

export function LabStyles() {
  return <style jsx global>{`
    .lab-tool-head{max-width:1020px;margin-bottom:56px}.lab-tool-head .meta{margin-top:18px}.lab-tool-head h1{font-size:clamp(48px,7vw,96px);margin-bottom:22px}.lab-tool-question{font-size:clamp(20px,2.3vw,30px);max-width:820px;color:#cfd3d4}.lab-workbench{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start;padding-bottom:120px}.lab-workbench>div{min-width:0}.lab-input-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.measure-field{border:1px solid rgba(72,220,232,.16);background:#0d1214;padding:16px}.measure-why{margin:0 0 12px;color:#8d9699;font-size:12px;line-height:1.55}.measure-field label{display:grid;grid-template-columns:1fr auto;gap:8px;font-size:11px;letter-spacing:.1em;color:#bac0c2}.measure-field label>b{color:#6f797d;font-weight:600}.measure-field input,.scenario-editor input{grid-column:1/-1;width:100%;margin-top:8px;background:#080a0b;color:#f4f4f1;border:1px solid rgba(72,220,232,.18);padding:12px 13px;font-size:22px;outline:none}.measure-field input:focus,.scenario-editor input:focus{border-color:#48dce8}.measure-help{margin-top:11px;padding:0;background:none;color:#48dce8;border:0;font-size:10px;letter-spacing:.1em;cursor:pointer}.measure-guide{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.11);color:#aeb5b7;font-size:13px}.measure-guide p{margin:8px 0}.measure-guide small{color:#71797c}.measure-schematic{height:46px;border:1px solid rgba(72,220,232,.14);display:flex;align-items:center;justify-content:center;gap:12px;background:linear-gradient(90deg,rgba(72,220,232,.025),rgba(255,106,26,.025))}.measure-schematic i{display:block;width:9px;height:9px;border:1px solid #48dce8;border-radius:50%}.measure-schematic span{color:#48dce8;font-size:22px}.scenario-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}.scenario-tabs button,.selector-row button{appearance:none;border:1px solid rgba(255,255,255,.11);background:#0d1113;color:#9aa2a5;padding:12px;cursor:pointer;font-weight:700;font-size:11px;letter-spacing:.08em}.scenario-tabs button.active,.selector-row button.active{border-color:#48dce8;color:#081012;background:#48dce8}.measurement-check-note{color:#737d80;font-size:12px;margin:18px 0}.lab-import-note{display:flex;flex-direction:column;gap:5px;margin:18px 0;padding:14px 16px;border:1px solid rgba(72,220,232,.2);background:rgba(72,220,232,.05);font-size:12px;color:#9ea8ab}.lab-import-note b{color:#48dce8}.lab-privacy{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;padding:14px 0;border-top:1px solid rgba(255,255,255,.11);font-size:11px;letter-spacing:.08em;color:#7c8588}.lab-privacy b{color:#48dce8}.lab-privacy small{margin-left:auto;color:#5e676a}.result-contract{border:1px solid rgba(72,220,232,.2);background:#0c1113}.result-contract section{padding:24px;border-bottom:1px solid rgba(255,255,255,.11)}.result-contract section>span,.lab-empty-result>span{font-size:10px;letter-spacing:.15em;color:#48dce8}.result-contract section h2{font-size:clamp(34px,4.5vw,62px);margin:10px 0 4px;letter-spacing:-.04em;line-height:1.02}.result-contract section small{color:#687174;font-size:10px}.result-contract section p{margin:9px 0 0;color:#c2c7c9}.technical-metric{color:#48dce8!important;font-size:13px!important;letter-spacing:.04em}.result-contract .use{border-left:3px solid #ff6a1a}.result-contract .watch{border-left:3px solid #6f7478}.lab-next{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;background:#48dce8;color:#061012;font-size:12px;letter-spacing:.1em;font-weight:900}.lab-empty-result{min-height:260px;border:1px solid rgba(72,220,232,.16);display:flex;flex-direction:column;justify-content:center;padding:30px;color:#768083}.share-result{margin:18px 22px 22px;background:none;border:1px solid rgba(255,255,255,.11);color:#d7dbdc;padding:12px 14px;font-size:11px;letter-spacing:.12em;cursor:pointer}.share-result:hover{border-color:#48dce8;color:#48dce8}.control-stack{margin-top:18px;border-top:1px solid rgba(255,255,255,.11);padding-top:18px}.control-stack>label{display:grid;grid-template-columns:1fr auto;gap:12px;color:#aeb4b6;font-size:11px;letter-spacing:.1em}.control-stack input[type=range]{grid-column:1/-1;width:100%;accent-color:#48dce8}.selector-row{margin-top:16px}.selector-row>span{display:block;font-size:10px;letter-spacing:.12em;color:#777f82;margin-bottom:8px}.selector-row>div{display:flex;gap:8px;flex-wrap:wrap}.squat-viz{border:1px solid rgba(72,220,232,.18);background:radial-gradient(circle at 60% 40%,rgba(72,220,232,.08),transparent 45%),#0b1012;margin-bottom:18px}.squat-viz svg{display:block;width:100%;height:auto}.squat-viz .floor,.squat-viz .bar-line{stroke:#5c666a;stroke-width:3}.squat-viz .tibia-line,.squat-viz .femur-line,.squat-viz .torso-line{stroke:#48dce8;stroke-width:6;stroke-linecap:round}.squat-viz .arm-line{stroke:#ff6a1a;stroke-width:4}.squat-viz circle{fill:#081012;stroke:#f2f4f4;stroke-width:2}.squat-viz text{fill:#6f7b7f;font-size:11px;letter-spacing:1px}.scenario-editor{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.scenario-editor label{display:grid;grid-template-columns:1fr auto;color:#899295;font-size:10px;letter-spacing:.1em}.scenario-editor label span{align-self:end;padding:0 8px 12px}.phi-toggle{display:flex;gap:10px;align-items:center;margin:18px 0;color:#a7aeb0;font-size:11px;letter-spacing:.08em}.phi-toggle input{accent-color:#48dce8}.popular-reference{margin:20px 22px;padding:18px;border:1px solid rgba(255,106,26,.28);background:rgba(255,106,26,.05)}.popular-reference b{color:#ff6a1a;font-size:11px;letter-spacing:.1em}.popular-reference p{margin:8px 0 0;color:#b7bdbe}.ankle-test-viz{position:relative;height:240px;border:1px solid rgba(72,220,232,.18);background:#0b1012;margin-bottom:18px;overflow:hidden}.ankle-test-viz .wall{position:absolute;right:18%;top:20px;bottom:28px;width:3px;background:#626b6e}.ankle-test-viz .floor{position:absolute;left:12%;right:8%;bottom:28px;height:3px;background:#626b6e}.ankle-test-viz .foot{position:absolute;right:22%;bottom:30px;width:130px;height:8px;background:#ff6a1a;transform:rotate(-2deg);transform-origin:right}.ankle-test-viz .shin{position:absolute;right:35%;bottom:36px;width:7px;height:130px;background:#48dce8;transform:rotate(-18deg);transform-origin:bottom}.ankle-test-viz .knee{position:absolute;right:21%;top:66px;width:20px;height:20px;border:3px solid #f4f4f1;border-radius:50%;animation:kneeWall 2.8s ease-in-out infinite}.ankle-test-viz p{position:absolute;left:20px;top:18px;max-width:190px;color:#7f898c;font-size:11px}.ankle-test-viz small{position:absolute;left:20px;bottom:45px;color:#48dce8;letter-spacing:.08em}@keyframes kneeWall{0%,100%{transform:translateX(-26px)}50%{transform:translateX(0)}}
    @media(max-width:900px){.lab-workbench{grid-template-columns:1fr;padding-bottom:90px}.lab-input-grid{grid-template-columns:1fr}.lab-privacy small{width:100%;margin-left:0}.scenario-editor{grid-template-columns:1fr}.tool-page{padding-top:130px}.lab-tool-head{margin-bottom:36px}}
    @media(prefers-reduced-motion:reduce){.ankle-test-viz .knee{animation:none}}
  `}</style>;
}
