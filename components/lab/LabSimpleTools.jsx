'use client';

import { useMemo, useState } from 'react';
import { computeApeIndex, computeFemurTibia, computeKneeToWall, computeVTaper, LAB_RULESETS, squatScenarioCopy } from '../../lib/lab';
import { exerciseFitApplicationResult } from '../../lib/labApplication';
import { useLabMeasurement } from '../../lib/labSession';
import { MeasurementCheckNote, MeasurementField, PrivacyStrip, ResultContract, ToolHeader } from './LabUI';

function InputGrid({ children }) {
  return <div className="lab-input-grid">{children}</div>;
}

function Field(props) {
  return <MeasurementField {...props} />;
}

function SelectButtons({ label, value, onChange, options }) {
  return <div className="selector-row"><span>{label}</span><div>{options.map(([key, text])=><button type="button" key={key} className={value===key?'active':''} onClick={()=>onChange(key)}>{text}</button>)}</div></div>;
}

function ReuseNote({ language }) {
  return <div className="lab-import-note">
    <b>{language === 'en' ? 'MEASURE ONCE' : 'กรอกครั้งเดียวพอ'}</b>
    <span>{language === 'en'
      ? 'If you already measured this in a Quick Check, the same value is reused here automatically.'
      : 'ถ้าเคยวัดค่านี้ใน Quick Check แล้ว ค่าเดิมจะถูกใช้ที่นี่อัตโนมัติ ไม่ต้องวัดใหม่'}</span>
  </div>;
}

export function ExerciseFitSimpleTool({ language='th' }) {
  const th = language !== 'en';
  const [movement, setMovement] = useState('SQUAT');
  const [height, setHeight] = useLabMeasurement('height');
  const [armSpan, setArmSpan] = useLabMeasurement('armSpan');
  const [femur, setFemur] = useLabMeasurement('femur');
  const [tibia, setTibia] = useLabMeasurement('tibia');

  const result = useMemo(() => exerciseFitApplicationResult({ movement, height, armSpan, femur, tibia }, language), [movement, height, armSpan, femur, tibia, language]);

  return <>
    <ToolHeader
      language={language}
      id="C1_EXERCISE_FIT"
      role="CORE"
      technicalName="Exercise Fit Explorer"
      title={th ? 'ท่านี้มีอะไรที่คุณควรลองปรับ?' : 'What should you adjust to make this movement fit you better?'}
      question={th ? 'เลือก Squat, Bench Press หรือ Deadlift แล้วกรอกเฉพาะค่าที่จำเป็น เพื่อดูว่าควรลองปรับอะไรต่อ' : 'Choose the movement first, then enter only the measurements that movement needs.'}
    />

    <div className="lab-workbench">
      <div>
        <div className="scenario-tabs" aria-label="Movement">
          {['SQUAT','BENCH','DEADLIFT'].map((x)=><button type="button" key={x} className={movement===x?'active':''} onClick={()=>setMovement(x)}>{x}</button>)}
        </div>

        <ReuseNote language={language}/>

        {movement === 'SQUAT' && <InputGrid>
          <Field language={language} label={th?'ช่วงต้นขา (Femur segment)':'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
          <Field language={language} label={th?'ช่วงหน้าแข้ง (Tibia segment)':'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
        </InputGrid>}

        {movement === 'BENCH' && <InputGrid>
          <Field language={language} label={th?'ส่วนสูง (Height)':'HEIGHT'} unit="cm" value={height} onChange={setHeight}/>
          <Field language={language} label={th?'ช่วงแขน (Arm span)':'ARM SPAN'} unit="cm" value={armSpan} onChange={setArmSpan}/>
        </InputGrid>}

        {movement === 'DEADLIFT' && <InputGrid>
          <Field language={language} label={th?'ส่วนสูง (Height)':'HEIGHT'} unit="cm" value={height} onChange={setHeight}/>
          <Field language={language} label={th?'ช่วงแขน (Arm span)':'ARM SPAN'} unit="cm" value={armSpan} onChange={setArmSpan}/>
          <Field language={language} label={th?'ช่วงต้นขา (Femur segment)':'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
          <Field language={language} label={th?'ช่วงหน้าแข้ง (Tibia segment)':'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
        </InputGrid>}

        <MeasurementCheckNote language={language}/>
        <PrivacyStrip language={language} ruleset={LAB_RULESETS.C1}/>
      </div>
      <ResultContract language={language} {...result}/>
    </div>
  </>;
}

export function SquatGeometrySimpleTool({ language='th' }) {
  const th = language !== 'en';
  const [femur, setFemur] = useLabMeasurement('femur');
  const [tibia, setTibia] = useLabMeasurement('tibia');
  const [kneeLeft] = useLabMeasurement('kneeWallLeft');
  const [kneeRight] = useLabMeasurement('kneeWallRight');
  const [heel, setHeel] = useState('flat');
  const [stance, setStance] = useState('medium');
  const [variant, setVariant] = useState('highbar');
  const [kneeTravel, setKneeTravel] = useState('mid');

  const ft = computeFemurTibia(femur, tibia);
  const ankle = computeKneeToWall(kneeLeft, kneeRight);
  const kneeTravelValue = kneeTravel === 'less' ? 25 : kneeTravel === 'more' ? 75 : 50;
  const copy = squatScenarioCopy({ heel, stance, variant, kneeTravel: kneeTravelValue }, language);

  const variantName = variant === 'front' ? 'Front Squat' : variant === 'lowbar' ? 'Low-Bar Back Squat' : 'High-Bar Back Squat';
  const result = ft ? {
    result: th ? `กำลังเทียบ ${variantName} กับ setup ที่คุณเลือก` : `Comparing ${variantName} with your selected setup`,
    metric:`Femur:Tibia ${ft.ratio}`,
    meaning: th
      ? `ช่วงต้นขากับหน้าแข้งของคุณต่างกันประมาณ ${Math.abs(ft.percent)}% ${copy.kneeCopy} ${copy.variantCopy}`
      : `Your measured femur and tibia segments differ by about ${Math.abs(ft.percent)}%. ${copy.kneeCopy} ${copy.variantCopy}`,
    use: th
      ? `${copy.heelCopy} ${copy.stanceCopy} เปลี่ยนทีละอย่าง แล้วเอา setup ที่รู้สึกควบคุมง่ายไปลองจริงในยิม${ankle ? ` · Knee-to-Wall ที่วัดไว้: ซ้าย ${ankle.left} cm / ขวา ${ankle.right} cm` : ''}`
      : `${copy.heelCopy} ${copy.stanceCopy} Change one thing at a time, then test the easiest-to-control setup in training${ankle ? ` · Saved Knee-to-Wall: L ${ankle.left} cm / R ${ankle.right} cm` : ''}.`,
    watch: th
      ? 'นี่คือ scenario สำหรับเปรียบเทียบ ไม่ใช่ภาพจำลองกระดูกจริง และไม่ได้ฟันธงว่า setup ไหนดีที่สุดก่อนที่คุณจะลองฝึกจริง'
      : 'This is a comparison scenario, not a skeletal simulation, and it cannot decide the best setup before you test it in training.',
    resultCode:'C2_SCENARIO_COMPARE'
  } : null;

  return <>
    <ToolHeader language={language} id="C2_SQUAT_GEOMETRY" role="CORE" technicalName="Squat Setup Explorer" title={th?'Squat setup แบบไหนควรลองก่อน?':'Which Squat setup is worth trying first?'} question={th?'ใช้สัดส่วนช่วงขาที่วัดไว้ แล้วเปลี่ยน setup ทีละอย่าง ไม่ต้องอ่านภาพ vector หรือมุมข้อต่อ':'Reuse your leg measurements and change one setup variable at a time. No joint-angle diagram required.'}/>
    <div className="lab-workbench">
      <div>
        <ReuseNote language={language}/>
        <InputGrid>
          <Field language={language} label={th?'ช่วงต้นขา':'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
          <Field language={language} label={th?'ช่วงหน้าแข้ง':'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
        </InputGrid>}

        {ankle && <div className="lab-import-note"><b>KNEE-TO-WALL</b><span>{th?`ใช้ค่าที่วัดไว้แล้ว: ซ้าย ${ankle.left} cm · ขวา ${ankle.right} cm`:`Reusing saved values: left ${ankle.left} cm · right ${ankle.right} cm`}</span></div>}

        <div className="control-stack">
          <SelectButtons label={th?'รูปแบบ Squat':'SQUAT VARIANT'} value={variant} onChange={setVariant} options={[["front","FRONT"],["highbar","HIGH-BAR"],["lowbar","LOW-BAR"]]}/>
          <SelectButtons label={th?'ส้นเท้า':'HEEL'} value={heel} onChange={setHeel} options={[["flat",th?"พื้นราบ":"FLAT"],["small",th?"ยกเล็กน้อย":"SMALL LIFT"],["moderate",th?"ยกปานกลาง":"MODERATE LIFT"]]}/>
          <SelectButtons label={th?'ความกว้างเท้า':'STANCE'} value={stance} onChange={setStance} options={[["narrow",th?"แคบ":"NARROW"],["medium",th?"กลาง":"MEDIUM"],["wide",th?"กว้าง":"WIDE"]]}/>
          <SelectButtons label={th?'ให้เข่าเดินหน้า':'KNEE TRAVEL'} value={kneeTravel} onChange={setKneeTravel} options={[["less",th?"น้อย":"LESS"],["mid",th?"กลาง":"MID"],["more",th?"มาก":"MORE"]]}/>
        </div>

        <MeasurementCheckNote language={language}/>
        <PrivacyStrip language={language} ruleset={LAB_RULESETS.C2}/>
      </div>
      <ResultContract language={language} {...result}/>
    </div>
  </>;
}

export function PhysiqueGoalSimpleTool({ language='th' }) {
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
    result: th ? `ตัวอย่างนี้ทำให้สัดส่วนเปลี่ยนจาก ${current.ratio}× → ${target.ratio}×` : `This scenario changes the ratio from ${current.ratio}× → ${target.ratio}×`,
    metric:`V-Taper ${current.ratio} → ${target.ratio}`,
    meaning: th
      ? `ฐานปัจจุบันคือไหล่ ${shoulder} cm / เอว ${waist} cm ตัวอย่างที่เลือกจะเป็นไหล่ ${targetShoulder} cm / เอว ${targetWaist} cm`
      : `Current baseline: shoulder ${shoulder} cm / waist ${waist} cm. Selected scenario: shoulder ${targetShoulder} cm / waist ${targetWaist} cm.`,
    use: th
      ? 'ใช้เพื่อดูว่าการเปลี่ยนช่วงบน เอว หรือทั้งสองทางให้ผลเชิงสัดส่วนต่างกันอย่างไร ไม่ใช่เป้าหมายที่ระบบบังคับให้คุณต้องทำ'
      : 'Use this to compare how upper-body, waist, or combined changes affect proportion. It is not a prescribed target.',
    watch: th
      ? 'V-Taper ratio ไม่ใช่คะแนนความน่าดึงดูด และตัวเลขตัวอย่างไม่ได้บอกว่าคุณควรเพิ่มกล้ามหรือลดไขมันเท่าไรจริง'
      : 'V-Taper ratio is not an attractiveness score, and these example numbers do not prescribe how much muscle to gain or fat to lose.',
    resultCode:'C3_SCENARIO_RATIO'
  } : null;

  return <>
    <ToolHeader language={language} id="C3_PHYSIQUE_GOAL" role="CORE" technicalName="Physique Goal Explorer" title={th?'อยากให้หุ่นดู V ขึ้น ควรเปลี่ยนด้านไหน?':'Want a stronger V-shape? Which side of the ratio changes it?'} question={th?'ใช้รอบไหล่และเอวที่วัดไว้เป็นฐาน แล้วลอง scenario แบบง่าย ๆ โดยไม่ต้องคำนวณซ้ำ':'Reuse your shoulder and waist measurements as the baseline, then compare simple scenarios.'}/>
    <div className="lab-workbench">
      <div>
        <ReuseNote language={language}/>
        <InputGrid>
          <Field language={language} label={th?'รอบไหล่':'SHOULDER'} unit="cm" value={shoulder} onChange={setShoulder}/>
          <Field language={language} label={th?'รอบเอวที่สะดือ':'WAIST @ NAVEL'} unit="cm" value={waist} onChange={setWaist}/>
        </InputGrid>}

        <SelectButtons label={th?'อยากลองเปลี่ยนด้านไหน':'SCENARIO'} value={route} onChange={setRoute} options={[["upper",th?"ช่วงบน":"UPPER BODY"],["waist",th?"เอว":"WAIST"],["both",th?"ทั้งสอง":"BOTH"]]}/>

        <div className="scenario-editor">
          {(route === 'upper' || route === 'both') && <label>{th?'ลองเพิ่มรอบไหล่':'ADD TO SHOULDER'} <input type="number" min="0" step="0.5" value={shoulderDelta} onChange={e=>setShoulderDelta(e.target.value)}/><span>cm</span></label>}
          {(route === 'waist' || route === 'both') && <label>{th?'ลองลดรอบเอว':'REDUCE WAIST'} <input type="number" min="0" step="0.5" value={waistDelta} onChange={e=>setWaistDelta(e.target.value)}/><span>cm</span></label>}
        </div>

        <MeasurementCheckNote language={language}/>
        <PrivacyStrip language={language} ruleset={LAB_RULESETS.C3}/>
      </div>
      <ResultContract language={language} {...result}/>
    </div>
  </>;
}

export function ApeIndexSimpleTool({ language='th' }) {
  const th = language !== 'en';
  const [height, setHeight] = useLabMeasurement('height');
  const [armSpan, setArmSpan] = useLabMeasurement('armSpan');
  const x = computeApeIndex(height, armSpan);
  const result = x ? {
    result: th
      ? `ช่วงแขนของคุณ${x.diff >= 0 ? 'ยาวกว่า' : 'สั้นกว่า'}ส่วนสูง ${Math.abs(x.diff)} cm`
      : `Your arm span is ${Math.abs(x.diff)} cm ${x.diff >= 0 ? 'longer' : 'shorter'} than your height`,
    metric:`Ape Index ${x.diff >= 0 ? '+' : ''}${x.diff} cm · ${x.ratio}×`,
    meaning: th
      ? 'นี่คือค่าระยะเอื้อมเทียบกับส่วนสูงเท่านั้น'
      : 'This is simply your reach relative to height.',
    use: th
      ? 'ถ้าอยากรู้ว่าค่านี้มีผลกับ Bench Press หรือ Deadlift อย่างไร ให้เปิด Exercise Fit แล้วระบบจะใช้ค่าเดิมต่อทันที'
      : 'To apply this to Bench Press or Deadlift, open Exercise Fit. The same measurement will be reused automatically.',
    watch: th
      ? 'Ape Index ไม่ได้ทำนาย performance หรือบอกว่าท่าไหนดีที่สุดสำหรับคุณ'
      : 'Ape Index does not predict performance or decide the best exercise for you.',
    nextHref:'/lab/exercise-fit',
    nextLabel: th ? 'เอาค่านี้ไปใช้กับท่าฝึก' : 'APPLY THIS TO A MOVEMENT',
    resultCode:'Q4_APE_INDEX'
  } : null;

  return <>
    <ToolHeader language={language} id="Q4_APE_INDEX" role="QUICK" technicalName="Ape Index" title={th?'แขนคุณยาวแค่ไหนเมื่อเทียบกับส่วนสูง?':'How long are your arms relative to height?'} question={th?'Quick Check นี้มีหน้าที่วัด reach อย่างเดียว การเลือกหรือปรับท่าจะอยู่ใน Exercise Fit':'This Quick Check measures reach only. Movement application belongs in Exercise Fit.'}/>
    <div className="lab-workbench">
      <div>
        <InputGrid>
          <Field language={language} label={th?'ส่วนสูง':'HEIGHT'} unit="cm" value={height} onChange={setHeight}/>
          <Field language={language} label={th?'ช่วงแขน':'ARM SPAN'} unit="cm" value={armSpan} onChange={setArmSpan}/>
        </InputGrid>
        <MeasurementCheckNote language={language}/>
        <PrivacyStrip language={language} ruleset={LAB_RULESETS.Q4}/>
      </div>
      <ResultContract language={language} {...result}/>
    </div>
  </>;
}

export function FemurTibiaSimpleTool({ language='th' }) {
  const th = language !== 'en';
  const [femur, setFemur] = useLabMeasurement('femur');
  const [tibia, setTibia] = useLabMeasurement('tibia');
  const x = computeFemurTibia(femur, tibia);
  const result = x ? {
    result: th
      ? `ช่วงต้นขาของคุณ${x.percent >= 0 ? 'ยาวกว่า' : 'สั้นกว่า'}ช่วงหน้าแข้งประมาณ ${Math.abs(x.percent)}%`
      : `Your femur segment is about ${Math.abs(x.percent)}% ${x.percent >= 0 ? 'longer' : 'shorter'} than your tibia segment`,
    metric:`Femur:Tibia ${x.ratio} · ${x.percent >= 0 ? '+' : ''}${x.percent}%`,
    meaning: th
      ? 'นี่คือความสัมพันธ์ของช่วงต้นขากับหน้าแข้งเท่านั้น'
      : 'This is simply the relationship between your thigh and lower-leg segments.',
    use: th
      ? 'ถ้าอยากรู้ว่าค่านี้มีผลกับ Squat อย่างไร ให้เปิด Exercise Fit หรือ Squat Geometry ค่าเดิมจะถูกใช้ต่ออัตโนมัติ'
      : 'To apply this to Squat, open Exercise Fit or Squat Geometry. The same measurements will be reused automatically.',
    watch: th
      ? 'อัตราส่วนนี้อย่างเดียวไม่สามารถบอกว่า Front หรือ Back Squat เหมาะกว่าคุณ'
      : 'This ratio alone cannot decide whether Front or Back Squat is better for you.',
    nextHref:'/lab/exercise-fit',
    nextLabel: th ? 'เอาค่านี้ไปใช้กับ Squat' : 'APPLY THIS TO SQUAT',
    resultCode:'Q5_FEMUR_TIBIA'
  } : null;

  return <>
    <ToolHeader language={language} id="Q5_FEMUR_TIBIA" role="QUICK" technicalName="Femur:Tibia" title={th?'ต้นขาคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง?':'How long is your thigh relative to your lower leg?'} question={th?'Quick Check นี้มีหน้าที่วัดสัดส่วนช่วงขาอย่างเดียว การปรับ Squat จะอยู่ใน Exercise Fit / Squat Geometry':'This Quick Check measures leg proportions only. Squat application belongs in Exercise Fit / Squat Geometry.'}/>
    <div className="lab-workbench">
      <div>
        <InputGrid>
          <Field language={language} label={th?'ช่วงต้นขา':'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
          <Field language={language} label={th?'ช่วงหน้าแข้ง':'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
        </InputGrid>
        <MeasurementCheckNote language={language}/>
        <PrivacyStrip language={language} ruleset={LAB_RULESETS.Q5}/>
      </div>
      <ResultContract language={language} {...result}/>
    </div>
  </>;
}