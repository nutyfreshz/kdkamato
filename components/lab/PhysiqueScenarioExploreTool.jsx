'use client';

import { useState } from 'react';
import { computeVTaper, LAB_RULESETS } from '../../lib/lab';
import { useLabMeasurement } from '../../lib/labSession';
import { MeasurementCheckNote, MeasurementField, PrivacyStrip, ResultContract, ToolHeader } from './LabUI';

function Field(props) {
  return <MeasurementField {...props} />;
}

function SelectButtons({ label, value, onChange, options }) {
  return <div className="selector-row"><span>{label}</span><div>{options.map(([key, text]) => <button type="button" key={key} className={value === key ? 'active' : ''} onClick={() => onChange(key)}>{text}</button>)}</div></div>;
}

export function PhysiqueScenarioExploreTool({ language = 'th' }) {
  const th = language !== 'en';
  const [shoulder, setShoulder] = useLabMeasurement('shoulder');
  const [waist, setWaist] = useLabMeasurement('waist');
  const [route, setRoute] = useState('both');
  const [shoulderDelta, setShoulderDelta] = useState('3');
  const [waistDelta, setWaistDelta] = useState('3');

  const current = computeVTaper(shoulder, waist);
  const s = Number(shoulder);
  const w = Number(waist);
  const ds = Math.max(0, Number(shoulderDelta) || 0);
  const dw = Math.max(0, Number(waistDelta) || 0);
  const targetShoulder = Number.isFinite(s) && s > 0 ? s + (route === 'upper' || route === 'both' ? ds : 0) : null;
  const targetWaist = Number.isFinite(w) && w > 0 ? Math.max(1, w - (route === 'waist' || route === 'both' ? dw : 0)) : null;
  const target = targetShoulder && targetWaist ? computeVTaper(targetShoulder, targetWaist) : null;

  const result = current && target ? {
    result: th ? `สถานการณ์จำลองนี้ทำให้สัดส่วนเปลี่ยนจาก ${current.ratio} เท่า → ${target.ratio} เท่า` : `This scenario changes the ratio from ${current.ratio}× → ${target.ratio}×`,
    metric: `V-Taper ${current.ratio} → ${target.ratio}`,
    meaning: th
      ? `ค่าปัจจุบันคือไหล่ ${shoulder} ซม. / เอว ${waist} ซม. ตัวอย่างที่เลือกจะเป็นไหล่ ${targetShoulder} ซม. / เอว ${targetWaist} ซม.`
      : `Current baseline: shoulder ${shoulder} cm / waist ${waist} cm. Selected scenario: shoulder ${targetShoulder} cm / waist ${targetWaist} cm.`,
    use: th
      ? 'ใช้เพื่อเข้าใจว่าตัวเลขสัดส่วนตอบสนองต่อการเปลี่ยนช่วงบน เอว หรือทั้งสองด้านอย่างไรเท่านั้น ไม่ได้ใช้เลือก Program หรือกำหนดเป้าหมายให้คุณ'
      : 'Use this only to understand how the ratio responds to upper-body, waist, or combined changes. It does not select your Program or prescribe a target.',
    watch: th
      ? 'รอบไหล่และรอบเอวเปลี่ยนแปลงจากหลายปัจจัย และการเพิ่มรอบไหล่ 3 ซม. กับการลดรอบเอว 3 ซม. ไม่มีความยากหรือระยะเวลาเท่ากัน จึงไม่ควรตีความสถานการณ์จำลองนี้เป็นคำแนะนำ'
      : 'Shoulder and waist measurements change for many reasons, and +3 cm at the shoulders is not equivalent in difficulty or time to -3 cm at the waist. Do not read this scenario as a prescription.',
    resultCode: 'C3_SCENARIO_RATIO'
  } : null;

  return <>
    <ToolHeader
      language={language}
      id="C3_PHYSIQUE_GOAL"
      role="EXPLORE"
      technicalName="Physique Scenario Explorer"
      title={th ? 'ถ้าไหล่หรือเอวเปลี่ยน สัดส่วน V (V-shape) จะเปลี่ยนไปแค่ไหน?' : 'If shoulder or waist measurements changed, how would the V-ratio change?'}
      question={th ? 'นี่คือการคำนวณสถานการณ์จำลองเพื่อทำความเข้าใจสัดส่วน ไม่ใช่คำแนะนำว่าควรเพิ่มหรือลดกี่เซนติเมตร' : 'This is scenario math for understanding the ratio, not a recommendation for how many centimeters you should gain or lose.'}
    />

    <div className="lab-workbench">
      <div>
        <div className="lab-import-note">
          <b>{th ? 'กรอกครั้งเดียวพอ' : 'MEASURE ONCE'}</b>
          <span>{th ? 'หากคุณเคยวัดสัดส่วน V (V-Taper) แล้ว ระบบจะใช้ค่ารอบไหล่และรอบเอวเดิมที่นี่โดยอัตโนมัติ' : 'If you already measured V-Taper, the same shoulder and waist values are reused automatically.'}</span>
        </div>

        <div className="lab-input-grid">
          <Field language={language} label={th ? 'รอบไหล่' : 'SHOULDER'} unit="cm" value={shoulder} onChange={setShoulder}/>
          <Field language={language} label={th ? 'รอบเอวระดับสะดือ' : 'WAIST @ NAVEL'} unit="cm" value={waist} onChange={setWaist}/>
        </div>

        <SelectButtons label={th ? 'ต้องการลองเปลี่ยนด้านไหน' : 'SCENARIO'} value={route} onChange={setRoute} options={[["upper", th ? "ช่วงบน" : "UPPER BODY"], ["waist", th ? "เอว" : "WAIST"], ["both", th ? "ทั้งสองด้าน" : "BOTH"]]}/>

        <div className="scenario-editor">
          {(route === 'upper' || route === 'both') && <label>{th ? 'ลองเพิ่มรอบไหล่' : 'ADD TO SHOULDER'} <input type="number" min="0" step="0.5" value={shoulderDelta} onChange={e => setShoulderDelta(e.target.value)}/><span>{th ? 'ซม.' : 'cm'}</span></label>}
          {(route === 'waist' || route === 'both') && <label>{th ? 'ลองลดรอบเอว' : 'REDUCE WAIST'} <input type="number" min="0" step="0.5" value={waistDelta} onChange={e => setWaistDelta(e.target.value)}/><span>{th ? 'ซม.' : 'cm'}</span></label>}
        </div>

        <MeasurementCheckNote language={language}/>
        <PrivacyStrip language={language} ruleset={LAB_RULESETS.C3}/>
      </div>
      <ResultContract language={language} {...result}/>
    </div>
  </>;
}
