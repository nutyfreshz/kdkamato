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
    <b>{language === 'en' ? 'MEASURE ONCE' : "ใช้ค่าที่เคยกรอกได้"}</b>
    <span>{language === 'en'
      ? 'If you already measured this in a Quick Check, the same value is reused here automatically.'
      : "หากเคยวัดค่านี้ในเครื่องมือวัดแบบรวดเร็ว ระบบจะนำค่าเดิมมาใช้ให้ ไม่ต้องวัดใหม่"}</span>
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
      title={th ? "ควรลองปรับท่านี้อย่างไรให้เข้ากับร่างกายคุณ?" : 'What should you adjust to make this movement fit you better?'}
      question={th ? "เลือกท่าและกรอกข้อมูลที่จำเป็น ระบบจะแนะนำสิ่งที่ควรลองเปรียบเทียบ" : 'Choose the movement first, then enter only the measurements that movement needs.'}
    />

    <div className="lab-workbench">
      <div>
        <div className="scenario-tabs" aria-label="Movement">
          {['SQUAT','BENCH','DEADLIFT'].map((x)=><button type="button" key={x} className={movement===x?'active':''} onClick={()=>setMovement(x)}>{x}</button>)}
        </div>

        <ReuseNote language={language}/>

        {movement === 'SQUAT' && <InputGrid>
          <Field language={language} label={th?"ความยาวช่วงต้นขา":'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
          <Field language={language} label={th?"ความยาวช่วงหน้าแข้ง":'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
        </InputGrid>}

        {movement === 'BENCH' && <InputGrid>
          <Field language={language} label={th?"ส่วนสูง":'HEIGHT'} unit="cm" value={height} onChange={setHeight}/>
          <Field language={language} label={th?"ช่วงแขนเมื่อกางแขน":'ARM SPAN'} unit="cm" value={armSpan} onChange={setArmSpan}/>
        </InputGrid>}

        {movement === 'DEADLIFT' && <InputGrid>
          <Field language={language} label={th?"ส่วนสูง":'HEIGHT'} unit="cm" value={height} onChange={setHeight}/>
          <Field language={language} label={th?"ช่วงแขนเมื่อกางแขน":'ARM SPAN'} unit="cm" value={armSpan} onChange={setArmSpan}/>
          <Field language={language} label={th?"ความยาวช่วงต้นขา":'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
          <Field language={language} label={th?"ความยาวช่วงหน้าแข้ง":'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
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
    result: th ? `กำลังเปรียบเทียบ ${variantName} ตามการจัดท่าที่เลือก` : `Comparing ${variantName} with your selected setup`,
    metric:`Femur:Tibia ${ft.ratio}`,
    meaning: th
      ? `ช่วงต้นขากับหน้าแข้งของคุณต่างกันประมาณ ${Math.abs(ft.percent)}% ${copy.kneeCopy} ${copy.variantCopy}`
      : `Your measured femur and tibia segments differ by about ${Math.abs(ft.percent)}%. ${copy.kneeCopy} ${copy.variantCopy}`,
    use: th
      ? `${copy.heelCopy} ${copy.stanceCopy} เปลี่ยนทีละอย่าง แล้วนำแบบที่คุมท่าได้ง่ายไปลองฝึกจริง${ankle ? ` · Knee-to-Wall ที่วัดไว้: ซ้าย ${ankle.left} ซม. / ขวา ${ankle.right} ซม.` : ''}`
      : `${copy.heelCopy} ${copy.stanceCopy} Change one thing at a time, then test the easiest-to-control setup in training${ankle ? ` · Saved Knee-to-Wall: L ${ankle.left} cm / R ${ankle.right} cm` : ''}.`,
    watch: th
      ? "ใช้แบบจำลองนี้เปรียบเทียบการจัดท่า ไม่ใช่ภาพกระดูกจริง และยังสรุปไม่ได้ว่าท่าใดดีที่สุดจนกว่าจะลองฝึก"
      : 'This is a comparison scenario, not a skeletal simulation, and it cannot decide the best setup before you test it in training.',
    resultCode:'C2_SCENARIO_COMPARE'
  } : null;

  return <>
    <ToolHeader language={language} id="C2_SQUAT_GEOMETRY" role="CORE" technicalName="Squat Setup Explorer" title={th?"ควรลองจัดท่าสควอตแบบไหนก่อน?":'Which Squat setup is worth trying first?'} question={th?"ใช้สัดส่วนขาที่วัดไว้เปรียบเทียบการจัดท่าทีละอย่าง โดยไม่ต้องอ่านภาพเวกเตอร์หรือมุมข้อต่อ":'Reuse your leg measurements and change one setup variable at a time. No joint-angle diagram required.'}/>
    <div className="lab-workbench">
      <div>
        <ReuseNote language={language}/>
        <InputGrid>
          <Field language={language} label={th?'ช่วงต้นขา':'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
          <Field language={language} label={th?'ช่วงหน้าแข้ง':'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
        </InputGrid>

        {ankle && <div className="lab-import-note"><b>KNEE-TO-WALL</b><span>{th?`ใช้ค่าที่วัดไว้แล้ว: ซ้าย ${ankle.left} ซม. · ขวา ${ankle.right} ซม.`:`Reusing saved values: left ${ankle.left} cm · right ${ankle.right} cm`}</span></div>}

        <div className="control-stack">
          <SelectButtons label={th?'รูปแบบ Squat':'SQUAT VARIANT'} value={variant} onChange={setVariant} options={[["front","FRONT"],["highbar","HIGH-BAR"],["lowbar","LOW-BAR"]]}/>
          <SelectButtons label={th?'ส้นเท้า':'HEEL'} value={heel} onChange={setHeel} options={[["flat",th?"พื้นราบ":"FLAT"],["small",th?"ยกเล็กน้อย":"SMALL LIFT"],["moderate",th?"ยกปานกลาง":"MODERATE LIFT"]]}/>
          <SelectButtons label={th?"ระยะห่างระหว่างเท้า":'STANCE'} value={stance} onChange={setStance} options={[["narrow",th?"แคบ":"NARROW"],["medium",th?"กลาง":"MEDIUM"],["wide",th?"กว้าง":"WIDE"]]}/>
          <SelectButtons label={th?"ระยะที่เข่าเคลื่อนไปข้างหน้า":'KNEE TRAVEL'} value={kneeTravel} onChange={setKneeTravel} options={[["less",th?"น้อย":"LESS"],["mid",th?"กลาง":"MID"],["more",th?"มาก":"MORE"]]}/>
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
      ? `ฐานปัจจุบันคือไหล่ ${shoulder} ซม. / เอว ${waist} ซม. ตัวอย่างที่เลือกจะเป็นไหล่ ${targetShoulder} ซม. / เอว ${targetWaist} ซม.`
      : `Current baseline: shoulder ${shoulder} cm / waist ${waist} cm. Selected scenario: shoulder ${targetShoulder} cm / waist ${targetWaist} cm.`,
    use: th
      ? "ใช้ดูว่าการเปลี่ยนช่วงบน เอว หรือทั้งสองอย่างส่งผลต่อสัดส่วนอย่างไร โดยไม่ได้กำหนดเป้าหมายให้คุณ"
      : 'Use this to compare how upper-body, waist, or combined changes affect proportion. It is not a prescribed target.',
    watch: th
      ? "อัตราส่วนไหล่ต่อเอวใช้เปรียบเทียบสัดส่วน ไม่ใช่คะแนนความน่าดึงดูดหรือคำแนะนำว่าควรเพิ่มกล้ามหรือลดไขมันเท่าไร"
      : 'V-Taper ratio is not an attractiveness score, and these example numbers do not prescribe how much muscle to gain or fat to lose.',
    resultCode:'C3_SCENARIO_RATIO'
  } : null;

  return <>
    <ToolHeader language={language} id="C3_PHYSIQUE_GOAL" role="CORE" technicalName="Physique Goal Explorer" title={th?"ถ้าอยากให้หุ่นดูเป็นตัววี ลองเปลี่ยนส่วนไหนได้บ้าง?":'Want a stronger V-shape? Which side of the ratio changes it?'} question={th?"ใช้รอบไหล่และเอวที่วัดไว้ลองปรับค่าในแบบจำลอง โดยไม่ต้องคำนวณใหม่":'Reuse your shoulder and waist measurements as the baseline, then compare simple scenarios.'}/>
    <div className="lab-workbench">
      <div>
        <ReuseNote language={language}/>
        <InputGrid>
          <Field language={language} label={th?'รอบไหล่':'SHOULDER'} unit="cm" value={shoulder} onChange={setShoulder}/>
          <Field language={language} label={th?'รอบเอวที่สะดือ':'WAIST @ NAVEL'} unit="cm" value={waist} onChange={setWaist}/>
        </InputGrid>

        <SelectButtons label={th?'อยากลองเปลี่ยนด้านไหน':'SCENARIO'} value={route} onChange={setRoute} options={[["upper",th?"ช่วงบน":"UPPER BODY"],["waist",th?"เอว":"WAIST"],["both",th?"ทั้งสอง":"BOTH"]]}/>

        <div className="scenario-editor">
          {(route === 'upper' || route === 'both') && <label>{th?'ลองเพิ่มรอบไหล่':'ADD TO SHOULDER'} <input type="number" min="0" step="0.5" value={shoulderDelta} onChange={e=>setShoulderDelta(e.target.value)}/><span>{th?'ซม.':'cm'}</span></label>}
          {(route === 'waist' || route === 'both') && <label>{th?'ลองลดรอบเอว':'REDUCE WAIST'} <input type="number" min="0" step="0.5" value={waistDelta} onChange={e=>setWaistDelta(e.target.value)}/><span>{th?'ซม.':'cm'}</span></label>}
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
      ? `ช่วงแขนของคุณ${x.diff >= 0 ? 'ยาวกว่า' : 'สั้นกว่า'}ส่วนสูง ${Math.abs(x.diff)} ซม.`
      : `Your arm span is ${Math.abs(x.diff)} cm ${x.diff >= 0 ? 'longer' : 'shorter'} than your height`,
    metric: th ? `Ape Index ${x.diff >= 0 ? '+' : ''}${x.diff} ซม. · ${x.ratio}×` : `Ape Index ${x.diff >= 0 ? '+' : ''}${x.diff} cm · ${x.ratio}×`,
    meaning: th
      ? "ค่านี้เปรียบเทียบช่วงแขนเมื่อกางแขนกับส่วนสูงเท่านั้น"
      : 'This is simply your reach relative to height.',
    use: th
      ? "เปิดเครื่องมือเลือกท่าฝึกเพื่อดูว่าระยะเอื้อมอาจเกี่ยวข้องกับ Bench Press หรือ Deadlift อย่างไร ระบบจะใช้ค่าเดิมให้"
      : 'To apply this to Bench Press or Deadlift, open Exercise Fit. The same measurement will be reused automatically.',
    watch: th
      ? "อัตราส่วนช่วงแขนต่อส่วนสูงใช้ทำนายผลฝึกหรือตัดสินท่าที่เหมาะที่สุดไม่ได้"
      : 'Ape Index does not predict performance or decide the best exercise for you.',
    nextHref:'/lab/exercise-fit',
    nextLabel: th ? 'นำค่านี้ไปใช้กับท่าฝึก' : 'APPLY THIS TO A MOVEMENT',
    resultCode:'Q4_APE_INDEX'
  } : null;

  return <>
    <ToolHeader language={language} id="Q4_APE_INDEX" role="QUICK" technicalName="Ape Index" title={th?'แขนของคุณยาวแค่ไหนเมื่อเทียบกับส่วนสูง?':'How long are your arms relative to height?'} question={th?"ส่วนนี้ใช้วัดระยะเอื้อม หากต้องการเลือกหรือปรับท่า ให้ใช้เครื่องมือเลือกท่าฝึกต่อ":'This Quick Check measures reach only. Movement application belongs in Exercise Fit.'}/>
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
      ? "ค่านี้เปรียบเทียบความยาวช่วงต้นขากับหน้าแข้งเท่านั้น"
      : 'This is simply the relationship between your thigh and lower-leg segments.',
    use: th
      ? "เปิดเครื่องมือเลือกท่าฝึกหรือทดลองสควอต เพื่อดูว่าสัดส่วนขาอาจเกี่ยวข้องกับท่าสควอตอย่างไร ระบบจะใช้ค่าเดิมให้"
      : 'To apply this to Squat, open Exercise Fit or Squat Geometry. The same measurements will be reused automatically.',
    watch: th
      ? "อัตราส่วนนี้เพียงค่าเดียวยังตัดสินไม่ได้ว่าควรใช้ Front Squat หรือ Back Squat"
      : 'This ratio alone cannot decide whether Front or Back Squat is better for you.',
    nextHref:'/lab/exercise-fit',
    nextLabel: th ? 'นำค่านี้ไปใช้กับท่า Squat' : 'APPLY THIS TO SQUAT',
    resultCode:'Q5_FEMUR_TIBIA'
  } : null;

  return <>
    <ToolHeader language={language} id="Q5_FEMUR_TIBIA" role="QUICK" technicalName="Femur:Tibia" title={th?'ต้นขาของคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง?':'How long is your thigh relative to your lower leg?'} question={th?"ส่วนนี้ใช้วัดสัดส่วนขา หากต้องการปรับท่า ให้ใช้เครื่องมือเลือกท่าฝึกหรือทดลองสควอตต่อ":'This Quick Check measures leg proportions only. Squat application belongs in Exercise Fit / Squat Geometry.'}/>
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
