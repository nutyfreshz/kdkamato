'use client';

import { useMemo, useState } from 'react';
import { computeApeIndex, computeFemurTibia, LAB_RULESETS } from '../../lib/lab';
import { exerciseFitApplicationResult } from '../../lib/labApplication';
import { useLabMeasurement } from '../../lib/labSession';
import { MeasurementCheckNote, MeasurementField, PrivacyStrip, ResultContract, ToolHeader } from './LabUI';

function InputGrid({ children }) {
  return <div className="lab-input-grid">{children}</div>;
}

function Field(props) {
  return <MeasurementField {...props} />;
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
      title={th ? 'ท่านี้ควรปรับอะไรให้เข้ากับโครงคุณมากขึ้น?' : 'What should you adjust to make this movement fit you better?'}
      question={th ? 'เลือกท่าก่อน แล้วกรอกเฉพาะค่าที่ท่านั้นต้องใช้ ระบบจะบอกสิ่งที่ควรลองเปรียบเทียบต่อ' : 'Choose the movement first, then enter only the measurements that movement needs.'}
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
