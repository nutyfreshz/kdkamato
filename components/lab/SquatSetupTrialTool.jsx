'use client';

import { useMemo, useState } from 'react';
import { computeFemurTibia, computeKneeToWall } from '../../lib/lab';
import { useLabMeasurement } from '../../lib/labSession';
import { MeasurementCheckNote, MeasurementField, PrivacyStrip, ResultContract, ToolHeader } from './LabUI';

const C2_RULESET = {
  id: 'LAB_RULESET_C2_v1.2',
  version: '1.2',
  evidenceClass: 'GEOMETRY + EVIDENCE-SUPPORTED TRIAL PRIORITY',
  lastReviewed: '2026-09-09'
};

function Field(props) {
  return <MeasurementField {...props} />;
}

function SelectButtons({ label, value, onChange, options }) {
  return <div className="selector-row"><span>{label}</span><div>{options.map(([key, text]) => <button type="button" key={key} className={value === key ? 'active' : ''} onClick={() => onChange(key)}>{text}</button>)}</div></div>;
}

function variantLabel(variant, th) {
  if (variant === 'front') return 'Front Squat';
  if (variant === 'lowbar') return 'Low-Bar Back Squat';
  return 'High-Bar Back Squat';
}

function buildTrialPlan(ft, ankle, variant, language) {
  if (!ft) return null;
  const th = language !== 'en';
  const name = variantLabel(variant, th);
  const clearlyLonger = ft.percent >= 5;

  const step1 = clearlyLonger
    ? (th
      ? `${name}: คงส้นเท้าราบ แล้วเปรียบเทียบท่ากว้างปานกลางกับท่ากว้าง`
      : `${name}: keep the heel flat and compare medium ↔ wide stance`)
    : (th
      ? `${name}: คงท่ายืนกว้างปานกลาง แล้วเปรียบเทียบส้นเท้าราบกับการยกส้นเล็กน้อย`
      : `${name}: keep a medium stance and compare flat heel ↔ small heel lift`);

  const step2 = clearlyLonger
    ? (th
      ? 'เลือกท่าที่ยืนได้มั่นคงกว่า แล้วคงท่านั้นเพื่อเปรียบเทียบส้นเท้าราบกับการยกส้นเล็กน้อย'
      : 'Keep the stance you control better, then compare flat heel ↔ small heel lift')
    : (th
      ? 'หากสมดุลหรือความลึกยังไม่ลงตัว ให้คงการยกส้นแบบที่ดีกว่า แล้วเปรียบเทียบท่ายืนกว้างปานกลางกับท่ายืนกว้าง'
      : 'If balance or depth still feels limited, keep the better heel setup and compare medium ↔ wide stance');

  const rationale = clearlyLonger
    ? (th
      ? "สัดส่วนต้นขายาวกว่าหน้าแข้งมากพอให้เริ่มลองเปรียบเทียบระยะห่างเท้าก่อน งานด้านกลศาสตร์การเคลื่อนไหวพบว่า ผู้ที่ต้นขายาวอาจต้องใช้การเคลื่อนไหวข้อเท้าและเข่ามากขึ้นเมื่อยืนแคบ การยืนกว้างขึ้นจึงเป็นอีกแบบที่น่าลองเทียบ"
      : 'Your thigh segment is clearly longer relative to the lower leg, so stance is the first variable worth comparing. Biomechanical data suggest relatively longer thighs can require more ankle/knee motion in narrower stances, making a wider stance a reasonable comparison.')
    : (th
      ? "สัดส่วนขาอย่างเดียวยังเลือกความกว้างเท้าให้คุณไม่ได้ จึงเริ่มจากลองยกส้นซึ่งมีผลต่อช่วงการเคลื่อนไหวข้อเท้าและเข่า แล้วค่อยเทียบความกว้างเท้าหากจำเป็น"
      : 'Leg proportions alone do not justify declaring a narrow or wide stance best, so start with heel elevation, which has a clearer effect on ankle/knee ROM, then compare stance if needed.');

  const ankleText = ankle
    ? (th
      ? `Knee-to-Wall ที่วัดไว้: ซ้าย ${ankle.left} ซม. / ขวา ${ankle.right} ซม.`
      : `Saved Knee-to-Wall: L ${ankle.left} cm / R ${ankle.right} cm`)
    : null;

  const asymmetryNote = ankle && ankle.difference >= 1.5
    ? (th
      ? `สองข้างต่างกัน ${ankle.difference} ซม. ควรวัดซ้ำด้วยวิธีเดิมก่อนใช้ผลนี้เลือกการจัดท่า`
      : `Left-right difference is ${ankle.difference} cm — repeat the same measurement before using the asymmetry to guide setup.`)
    : null;

  return { name, step1, step2, rationale, ankleText, asymmetryNote };
}

export function SquatSetupTrialTool({ language = 'th' }) {
  const th = language !== 'en';
  const [femur, setFemur] = useLabMeasurement('femur');
  const [tibia, setTibia] = useLabMeasurement('tibia');
  const [kneeLeft] = useLabMeasurement('kneeWallLeft');
  const [kneeRight] = useLabMeasurement('kneeWallRight');
  const [variant, setVariant] = useState('highbar');

  const ft = computeFemurTibia(femur, tibia);
  const ankle = computeKneeToWall(kneeLeft, kneeRight);
  const plan = useMemo(() => buildTrialPlan(ft, ankle, variant, language), [ft?.ratio, ft?.percent, ankle?.left, ankle?.right, ankle?.difference, variant, language]);

  const result = ft && plan ? {
    result: th ? `เริ่มจากการเปรียบเทียบ 2 แบบนี้ก่อนสำหรับ ${plan.name}` : `Start with these two comparisons for ${plan.name}`,
    metric: `Femur:Tibia ${ft.ratio}${ankle ? ` · KTW ${ankle.left}/${ankle.right} ${th ? 'ซม.' : 'cm'}` : ''}`,
    meaning: th
      ? `1) ${plan.step1}  2) ${plan.step2}`
      : `1) ${plan.step1}.  2) ${plan.step2}.`,
    use: th
      ? `${plan.rationale} ทดสอบด้วยน้ำหนักเบาหรือน้ำหนักเดิม ใช้ความลึกใกล้เคียงกัน และเปลี่ยนทีละ 1 อย่าง จากนั้นเลือกแบบที่ทรงตัวและคุมท่าได้ดีกว่า`
      : `${plan.rationale} Test with a light or fixed load, keep depth similar, change one variable at a time, and keep the setup you can balance and control better.`,
    watch: th
      ? `เครื่องมือ C2 ไม่ได้ตัดสินว่า Front Squat, High-Bar หรือ Low-Bar แบบไหนดีที่สุด คุณเลือกท่าที่ต้องการทดสอบ แล้วระบบจะจัดลำดับการปรับภายในท่านั้น${plan.asymmetryNote ? ` · ${plan.asymmetryNote}` : ''}`
      : `C2 does not use body proportions to declare Front / High-Bar / Low-Bar best. Choose the variant you actually want to test; C2 prioritizes setup comparisons inside it.${plan.asymmetryNote ? ` ${plan.asymmetryNote}` : ''}`,
    nextHref: ankle ? undefined : '/lab/knee-to-wall',
    nextLabel: ankle ? undefined : (th ? 'วัด Knee-to-Wall เพิ่มเติม (ไม่บังคับ)' : 'ADD KNEE-TO-WALL (OPTIONAL)'),
    resultCode: 'C2_SCENARIO_COMPARE'
  } : null;

  return <>
    <ToolHeader
      language={language}
      id="C2_SQUAT_GEOMETRY"
      role="CORE"
      technicalName="Squat Setup Trial"
      title={th ? "ควรลองปรับสควอตแบบไหนก่อน?" : 'Which Squat setup should you test first?'}
      question={th
        ? "เลือกสควอตที่ใช้อยู่ ระบบจะใช้สัดส่วนขาจัดลำดับการจัดท่า 2 แบบให้ลองเปรียบเทียบ โดยเปลี่ยนทีละอย่าง"
        : 'Choose the Squat variant you actually use. The system prioritizes two setup comparisons from your leg proportions, changing one thing at a time.'}
    />

    <div className="lab-workbench">
      <div>
        <div className="lab-import-note">
          <b>{th ? "ใช้ค่าที่เคยกรอกได้" : 'MEASURE ONCE'}</b>
          <span>{th ? "หากเคยวัดสัดส่วนต้นขาต่อหน้าแข้ง หรือระยะเท้าถึงผนังแล้ว ระบบจะนำค่าเดิมมาใช้ให้" : 'Existing Femur:Tibia and Knee-to-Wall measurements are reused automatically.'}</span>
        </div>

        <div className="lab-input-grid">
          <Field language={language} label={th ? 'ช่วงต้นขา' : 'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
          <Field language={language} label={th ? 'ช่วงหน้าแข้ง' : 'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
        </div>

        <SelectButtons
          label={th ? 'ท่า Squat ที่คุณจะทดสอบ' : 'SQUAT TO TEST'}
          value={variant}
          onChange={setVariant}
          options={[["front", "FRONT"], ["highbar", "HIGH-BAR"], ["lowbar", "LOW-BAR"]]}
        />

        {plan && <div className="lab-import-note" style={{ marginTop: 16 }}>
          <b>{th ? 'ลำดับการทดลอง' : 'TEST ORDER'}</b>
          <span>1. {plan.step1}<br/>2. {plan.step2}</span>
        </div>}

        {plan?.ankleText && <div className="lab-import-note"><b>KNEE-TO-WALL</b><span>{plan.ankleText}</span></div>}

        <MeasurementCheckNote language={language}/>
        <PrivacyStrip language={language} ruleset={C2_RULESET}/>
      </div>
      <ResultContract language={language} {...result}/>
    </div>
  </>;
}
