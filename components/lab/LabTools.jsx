'use client';

import { useMemo, useState } from 'react';
import { computeApeIndex, computeFemurTibia, computeFFMI, computeKneeToWall, computeVTaper, exerciseFitResult, LAB_RULESETS, squatScenarioCopy } from '../../lib/lab';
import { useLabMeasurement } from '../../lib/labSession';
import { trackLabEvent } from '../../lib/labAnalytics';
import { ImportedMeasurementNote, MeasurementCheckNote, MeasurementField, PrivacyStrip, ResultContract, ShareResult, ToolHeader } from './LabUI';

const dictionaries = {
  th: {
    guides: {
      height: ['ยืนตรง วัดจากพื้นถึงศีรษะ และถอดรองเท้าถ้าทำได้', 'วัดบนพื้นที่เอียงหรือใส่รองเท้าบางครั้งแต่ไม่ใส่อีกครั้ง'],
      arm: ['ยืนชิดผนัง กางแขนแนวนอน แล้ววัดจากปลายนิ้วข้างหนึ่งถึงอีกข้าง', 'งอศอก ยกไหล่ หรือวัดตามแนวที่ไม่เป็นเส้นตรง'],
      femur: ['ใช้จุดอ้างอิงบนผิวหนังชุดเดิมทุกครั้ง ค่านี้เป็นค่าประมาณช่วงต้นขาจากภายนอก ไม่ใช่ความยาวกระดูกจาก X-ray', 'เปลี่ยนจุดเริ่มหรือจุดปลายระหว่างการวัดแต่ละครั้ง'],
      tibia: ['ใช้จุดอ้างอิงชุดเดิมบริเวณเข่าถึงข้อเท้า และวัดแนวเดิมทุกครั้ง', 'วัดเฉียงหรือเปลี่ยนจุดปลายระหว่างแต่ละรอบ'],
      torso: ['ใช้จุดอ้างอิงภายนอกชุดเดิมเพื่อประมาณช่วงลำตัว', 'ตีความค่านี้ว่าเป็นความยาวกระดูกสันหลังจริง'],
      shoulder: ['วัดรอบช่วงไหล่และกล้ามเนื้อ deltoid บริเวณที่กว้างที่สุด โดยใช้วิธีเดิมทุกครั้ง', 'ดึงสายวัดแน่นจนกดเนื้อเยื่อ'],
      waist: ['วัดรอบเอวที่ระดับสะดือ ในท่าผ่อนคลาย หลังหายใจออกตามปกติ', 'สลับระหว่างเอวคอดที่สุดกับระดับสะดือ'],
      weight: ['ถ้าต้องการติดตามตามเวลา ให้ชั่งภายใต้เงื่อนไขใกล้เคียงกัน', 'เปรียบเทียบน้ำหนักจากคนละช่วงเวลาและเงื่อนไขที่ต่างกันมาก'],
      bodyfat: ['ใช้วิธีประเมินเปอร์เซ็นต์ไขมันแบบเดิมเมื่อเทียบผลตามเวลา', 'มองค่าประมาณเปอร์เซ็นต์ไขมันว่าแม่นยำสมบูรณ์'],
      kneeWall: ['หันหน้าเข้าผนัง วางเท้าราบ ดันเข่าแตะผนังโดยส้นไม่ยก แล้วเลื่อนเท้าออกจนได้ระยะไกลสุดที่ทำซ้ำได้ วัดจากจุดเดิมของเท้าถึงผนัง', 'ปล่อยส้นลอย หมุนเท้าเปลี่ยนมุมมาก หรือใช้จุดวัดคนละจุดระหว่างซ้ายกับขวา']
    },
    why: {
      height:'ใช้ส่วนสูงเป็นฐานเทียบกับช่วงแขนและสัดส่วนอื่น', arm:'ใช้ช่วงแขนเพื่อดูระยะเอื้อมที่อาจเปลี่ยนช่วงการเคลื่อนไหวและการจัดท่า', femur:'ใช้ช่วงต้นขาเพื่อดูว่าตำแหน่งสะโพกและเข่าอาจต้องจัดต่างกันอย่างไรใน Squat', tibia:'ใช้ช่วงหน้าแข้งเพื่อเทียบกับช่วงต้นขาและดูสัดส่วนช่วงขา', torso:'ใช้ค่าประมาณช่วงลำตัวเพื่อให้แบบจำลอง Squat มีข้อมูลครบขึ้น', shoulder:'ใช้รอบไหล่เพื่อดูสัดส่วนช่วงบนเทียบกับเอว', waist:'ใช้รอบเอวจากจุดวัดเดิมเพื่อให้เปรียบเทียบสัดส่วนได้สม่ำเสมอ', weight:'ใช้น้ำหนักร่วมกับเปอร์เซ็นต์ไขมันโดยประมาณเพื่อคำนวณมวลไร้ไขมัน', bodyfat:'ใช้เปอร์เซ็นต์ไขมันโดยประมาณเพื่อหัก fat mass ก่อนคำนวณ FFMI', kneeWall:'ใช้ระยะเข่าถึงผนังเพื่อดูว่าแต่ละข้างให้เข่าเดินหน้าได้มากน้อยต่างกันแค่ไหนขณะลงน้ำหนัก'
    }
  },
  en: {
    guides: {
      height: ['Stand tall and measure from the floor to the top of your head. Barefoot if practical.', 'Mixing barefoot and shod measurements or measuring on an uneven floor.'],
      arm: ['Stand against a wall, extend both arms horizontally, and measure fingertip to fingertip.', 'Bending the elbows, shrugging the shoulders, or measuring along a curved path.'],
      femur: ['Use the same external landmarks every time. This is a femur segment estimate, not X-ray bone length.', 'Changing the start or end landmark between measurements.'],
      tibia: ['Use the same external landmarks from the knee region to the ankle each time.', 'Measuring diagonally or changing the endpoint.'],
      torso: ['Use the same defined external landmarks as a torso-length proxy.', 'Treating this as exact spinal or skeletal length.'],
      shoulder: ['Measure around the broadest practical shoulder/deltoid circumference using the same method.', 'Pulling the tape tight enough to compress tissue.'],
      waist: ['Measure at the navel, relaxed, after a normal exhale.', 'Switching between the narrowest waist and navel level.'],
      weight: ['For tracking, weigh under similar conditions each time.', 'Comparing measurements taken under very different conditions.'],
      bodyfat: ['Use the same body-fat estimation method when comparing over time.', 'Treating an estimate as perfectly accurate.'],
      kneeWall: ['Face a wall, keep the foot flat, move the knee to the wall without lifting the heel, then move the foot back to the farthest repeatable position. Measure from the same foot landmark to the wall.', 'Letting the heel lift, rotating the foot substantially, or using different landmarks left versus right.']
    },
    why: {
      height:'Height is the reference for comparing arm span and other segment measurements.', arm:'Arm span gives reach context that can change range of motion and setup.', femur:'Femur segment length helps explain how hip and knee position can change in Squat.', tibia:'Tibia segment length is compared with the femur to describe leg geometry.', torso:'An external torso estimate adds context to the Squat model.', shoulder:'Shoulder circumference is used to compare upper-body size with waist circumference.', waist:'Using one waist protocol makes proportion tracking more consistent.', weight:'Weight is used with body-fat estimate to calculate fat-free mass.', bodyfat:'Body-fat estimate is used to subtract estimated fat mass before calculating FFMI.', kneeWall:'Knee-to-wall distance shows how much forward knee travel each side allows while weight-bearing.'
    }
  }
};

function InputGrid({ children }) { return <div className="lab-input-grid">{children}</div>; }
function valid(...values) { return values.every(v => Number.isFinite(Number(v)) && Number(v) > 0); }
function SelectButtons({label,value,setValue,options,onChange}) { return <div className="selector-row"><span>{label}</span><div>{options.map(([v,l])=><button type="button" key={v} className={value===v?'active':''} onClick={()=>{setValue(v);onChange?.(v)}}>{l}</button>)}</div></div>; }

function useCopy(language) {
  return dictionaries[language] || dictionaries.th;
}

function Field({ language='th', kind, ...props }) {
  const c = useCopy(language);
  return <MeasurementField language={language} why={c.why[kind]} guide={c.guides[kind][0]} mistake={c.guides[kind][1]} {...props} />;
}

export function ExerciseFitTool({ language='th' }) {
  const [height,setHeight]=useLabMeasurement('height','178');
  const [arm,setArm]=useLabMeasurement('armSpan','184');
  const [femur,setFemur]=useLabMeasurement('femur','47');
  const [tibia,setTibia]=useLabMeasurement('tibia','39');
  const [torso,setTorso]=useLabMeasurement('torso','58');
  const [movement,setMovement]=useState('SQUAT');
  const result = useMemo(() => valid(height,arm,femur,tibia,torso) ? exerciseFitResult({height,armSpan:arm,femur,tibia,torso,movement},language) : null,[height,arm,femur,tibia,torso,movement,language]);
  const th = language !== 'en';
  return <>
    <ToolHeader language={language} id="C1_EXERCISE_FIT" role="CORE" technicalName="Exercise Fit Explorer" title={th?'ทำไมบางท่ารู้สึกไม่เข้ากับโครงคุณ?':'Why do some exercises feel awkward for your structure?'} question={th?'วัดช่วงแขน ขา และลำตัว แล้วดูว่าสัดส่วนเหล่านี้อาจเปลี่ยนตำแหน่งและช่วงการเคลื่อนไหวใน Squat, Bench Press และ Deadlift อย่างไร พร้อมสิ่งที่ควรลองปรับก่อน':'Measure your arms, legs, and torso to see how proportions can change position and range of motion in Squat, Bench Press, and Deadlift, plus what to test first.'}/>
    <div className="lab-workbench"><div>
      <InputGrid>
        <Field language={language} kind="height" label={th?'ส่วนสูง (Height)':'HEIGHT'} unit="cm" value={height} onChange={setHeight}/>
        <Field language={language} kind="arm" label={th?'ช่วงแขน (Arm span)':'ARM SPAN'} unit="cm" value={arm} onChange={setArm}/>
        <Field language={language} kind="femur" label={th?'ช่วงต้นขา (Femur segment)':'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
        <Field language={language} kind="tibia" label={th?'ช่วงหน้าแข้ง (Tibia segment)':'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
        <Field language={language} kind="torso" label={th?'ช่วงลำตัวโดยประมาณ (Torso)':'TORSO ESTIMATE'} unit="cm" value={torso} onChange={setTorso}/>
      </InputGrid>
      <div className="scenario-tabs" aria-label="Movement">{['SQUAT','BENCH','DEADLIFT'].map(x=><button type="button" key={x} className={movement===x?'active':''} onClick={()=>{setMovement(x);trackLabEvent('c1_movement_selected',{tool_id:'C1_EXERCISE_FIT',movement:x})}}>{x}</button>)}</div>
      <MeasurementCheckNote language={language}/><PrivacyStrip language={language} ruleset={LAB_RULESETS.C1}/>
    </div>
    <ResultContract language={language} {...result}>{result && <ShareResult language={language} title={th?'ข้อมูลโครงสร้างและการเคลื่อนไหวของฉัน':'MY BODY / MOVEMENT PROFILE'} text={`${result.result}. ${result.use}`}/>}</ResultContract></div>
  </>;
}

function SquatSchematic({ kneeTravel, heel, stance, variant, language }) {
  const heelLift = heel==='moderate'?14:heel==='small'?7:0;
  const kneeX = 250 + (kneeTravel-50)*0.7 + heelLift*0.45;
  const hipX = 175 - (kneeTravel-50)*0.24;
  const torsoLean = variant==='lowbar'?38:variant==='front'?12:24;
  const shoulderX = hipX - torsoLean + (kneeTravel-50)*0.18 - heelLift*0.5;
  const barX = variant==='front'?shoulderX+18:shoulderX-2;
  return <div className="squat-viz"><svg viewBox="0 0 420 340" role="img" aria-label={language==='en'?'Squat geometry schematic':'ภาพจำลองตำแหน่ง Squat'}>
    <line className="floor" x1="40" y1="300" x2="390" y2="300"/>
    <line className="tibia-line" x1="270" y1="295" x2={kneeX} y2="205"/><line className="femur-line" x1={kneeX} y1="205" x2={hipX} y2="170"/><line className="torso-line" x1={hipX} y1="170" x2={shoulderX} y2="82"/><line className="arm-line" x1={shoulderX} y1="95" x2={barX} y2="110"/>
    <line className="bar-line" x1={barX-48} y1="78" x2={barX+48} y2="78"/>
    {[['ankle',270,295],['knee',kneeX,205],['hip',hipX,170],['shoulder',shoulderX,82]].map(([k,x,y])=><circle key={k} cx={x} cy={y} r="7"/>)}
    <text x="48" y="44">{language==='en'?'POSITION MODEL':'ภาพจำลองตำแหน่ง'}</text><text x="48" y="62">{language==='en'?'not calculated joint angles':'ไม่ใช่การคำนวณมุมข้อต่อจริง'}</text><text x="48" y="320">{stance.toUpperCase()} · {heel.toUpperCase()}</text>
  </svg></div>;
}

export function SquatGeometryTool({ language='th' }) {
  const [height,setHeight]=useLabMeasurement('height','178');
  const [femur,setFemur]=useLabMeasurement('femur','47');
  const [tibia,setTibia]=useLabMeasurement('tibia','39');
  const [torso,setTorso]=useLabMeasurement('torso','58');
  const [kneeLeft]=useLabMeasurement('kneeWallLeft','');
  const [kneeRight]=useLabMeasurement('kneeWallRight','');
  const ankleContext = computeKneeToWall(kneeLeft,kneeRight);
  const [kneeTravel,setKneeTravel]=useState(55),[heel,setHeel]=useState('flat'),[stance,setStance]=useState('medium'),[variant,setVariant]=useState('highbar');
  const ft = useMemo(()=>computeFemurTibia(femur,tibia),[femur,tibia]);
  const copy = squatScenarioCopy({heel,stance,variant,kneeTravel},language);
  const th = language !== 'en';
  const result = ft && valid(height,torso) ? {
    result: th ? `กำลังดูตำแหน่ง ${variant==='front'?'Front Squat':variant==='lowbar'?'Low-Bar Back Squat':'High-Bar Back Squat'} จากสัดส่วนที่คุณกรอก` : `Viewing ${variant==='front'?'Front Squat':variant==='lowbar'?'Low-Bar Back Squat':'High-Bar Back Squat'} with your entered proportions`,
    metric:`Femur:Tibia ${ft.ratio} · ${variant.toUpperCase()}`,
    meaning: th ? `ช่วงต้นขากับหน้าแข้งต่างกันประมาณ ${Math.abs(ft.percent)}% ในการวัดนี้ ${copy.kneeCopy} ${copy.variantCopy}` : `Your measured femur and tibia segments differ by about ${Math.abs(ft.percent)}%. ${copy.kneeCopy} ${copy.variantCopy}`,
    use:`${copy.heelCopy} ${copy.stanceCopy} ${th?'ลองเปลี่ยนทีละอย่างเพื่อดูว่าตำแหน่งที่จำลองเปลี่ยนอย่างไร':'Change one control at a time and observe how the modeled position changes.'}`,
    watch: th ? 'ภาพนี้เป็นแบบจำลองเพื่อใช้เปรียบเทียบตำแหน่ง ไม่ใช่การคำนวณมุมข้อต่อจริง ไม่ได้ตัดสินว่า Front หรือ Back Squat แบบไหนดีที่สุด และไม่ได้ประเมินอาการปวด ข้อจำกัดการเคลื่อนไหว หรือความเสี่ยงบาดเจ็บ' : 'This is a position model for comparison, not a calculation of true joint angles. It does not decide which Squat is best or assess pain, mobility restriction, or injury risk.',
    resultCode:'C2_SCENARIO_COMPARE'
  } : null;
  return <><ToolHeader language={language} id="C2_SQUAT_GEOMETRY" role="CORE" technicalName="Squat Geometry & Variant Explorer" title={th?'Squat แบบไหนควรลองก่อน?':'Which Squat setup is worth testing first?'} question={th?'ลองเปลี่ยนรูปแบบ Squat การยกส้น ความกว้างเท้า และการเดินหน้าของเข่า แล้วดูว่าตำแหน่งของร่างกายเปลี่ยนอย่างไร':'Change Squat variant, heel elevation, stance, and knee travel to see how the modeled position changes.'}/>
    <div className="lab-workbench"><div><InputGrid>
      <Field language={language} kind="height" label={th?'ส่วนสูง (Height)':'HEIGHT'} unit="cm" value={height} onChange={setHeight}/>
      <Field language={language} kind="femur" label={th?'ช่วงต้นขา (Femur segment)':'FEMUR SEGMENT'} unit="cm" value={femur} onChange={setFemur}/>
      <Field language={language} kind="tibia" label={th?'ช่วงหน้าแข้ง (Tibia segment)':'TIBIA SEGMENT'} unit="cm" value={tibia} onChange={setTibia}/>
      <Field language={language} kind="torso" label={th?'ช่วงลำตัวโดยประมาณ (Torso)':'TORSO ESTIMATE'} unit="cm" value={torso} onChange={setTorso}/>
    </InputGrid>
    {ankleContext && <ImportedMeasurementNote language={language}>{th?`Knee-to-Wall: ซ้าย ${ankleContext.left} cm · ขวา ${ankleContext.right} cm ใช้เป็นข้อมูลประกอบเรื่องการเคลื่อนไหวของข้อเท้าเท่านั้น`:`Knee-to-Wall: left ${ankleContext.left} cm · right ${ankleContext.right} cm. Used only as ankle-motion context.`}</ImportedMeasurementNote>}
    <div className="control-stack"><label>{th?'การเดินหน้าของเข่า':'KNEE TRAVEL'} <span>{kneeTravel<35?(th?'น้อย':'LESS'):kneeTravel>65?(th?'มาก':'MORE'):(th?'กลาง':'MID')}</span><input type="range" min="0" max="100" value={kneeTravel} onChange={e=>{setKneeTravel(Number(e.target.value));trackLabEvent('c2_knee_travel_changed',{tool_id:'C2_SQUAT_GEOMETRY'})}}/></label>
      <SelectButtons label={th?'ส้นเท้า':'HEEL'} value={heel} setValue={setHeel} onChange={()=>trackLabEvent('c2_heel_scenario_changed',{tool_id:'C2_SQUAT_GEOMETRY'})} options={[["flat",th?"พื้นราบ":"FLAT"],["small",th?"ยกเล็กน้อย":"SMALL"],["moderate",th?"ยกปานกลาง":"MODERATE"]]}/>
      <SelectButtons label={th?'ความกว้างเท้า':'STANCE'} value={stance} setValue={setStance} onChange={()=>trackLabEvent('c2_stance_changed',{tool_id:'C2_SQUAT_GEOMETRY'})} options={[["narrow",th?"แคบ":"NARROW"],["medium",th?"กลาง":"MEDIUM"],["wide",th?"กว้าง":"WIDE"]]}/>
      <SelectButtons label={th?'รูปแบบ Squat':'VARIANT'} value={variant} setValue={setVariant} onChange={()=>trackLabEvent('c2_variant_changed',{tool_id:'C2_SQUAT_GEOMETRY'})} options={[["front","FRONT"],["highbar","HIGH-BAR"],["lowbar","LOW-BAR"]]}/>
    </div><MeasurementCheckNote language={language}/><PrivacyStrip language={language} ruleset={LAB_RULESETS.C2}/></div>
    <div><SquatSchematic language={language} kneeTravel={kneeTravel} heel={heel} stance={stance} variant={variant}/><ResultContract language={language} {...result}/></div></div></>;
}

export function PhysiqueGoalTool({ language='th' }) {
  const [shoulder,setShoulder]=useLabMeasurement('shoulder','118');
  const [waist,setWaist]=useLabMeasurement('waist','82');
  const [targetShoulder,setTargetShoulder]=useState('124'),[targetWaist,setTargetWaist]=useState('82'),[goal,setGoal]=useState('v'),[phi,setPhi]=useState(false);
  const current=computeVTaper(shoulder,waist), target=computeVTaper(targetShoulder,targetWaist);
  const th = language !== 'en';
  const result=current&&target?{
    result: th?`ปัจจุบัน ${current.ratio}× → ตัวอย่างเป้าหมาย ${target.ratio}×`:`Current ${current.ratio}× → example target ${target.ratio}×`,
    metric:`V-Taper Ratio ${current.ratio} → ${target.ratio}`,
    meaning: th?`ตอนนี้รอบไหล่ ${shoulder} cm และรอบเอว ${waist} cm ตัวอย่างที่คุณตั้งไว้คือ ${targetShoulder}/${targetWaist} cm อัตราส่วนจึงเปลี่ยนตามมิติที่คุณเลือก ไม่ใช่เพราะมีเลขวิเศษเพียงค่าเดียว`:`Current shoulder ${shoulder} cm and waist ${waist} cm. Your example target is ${targetShoulder}/${targetWaist} cm. The ratio changes with the dimensions you change; there is no single magical number.`,
    use:goal==='upper'?(th?'ถ้าอยากให้ช่วงบนดูกว้างขึ้น ใช้ตัวอย่างนี้เพื่อเห็นผลเชิงสัดส่วน แล้วเชื่อมกับการพัฒนา delts, lats และ upper back':'If you want a broader upper body, use this scenario to see the proportion change, then connect it to delt, lat, and upper-back development'):goal==='waist'?(th?'ถ้าอยากให้เอวดูเล็กลง ใช้ตัวอย่างนี้เพื่อเห็นผลเชิงคณิตศาสตร์ แต่เครื่องมือนี้ไม่ได้ตัดสินว่าคุณควรลดไขมันหรือไม่':'If you want a smaller-looking waist, use this to see the mathematical effect. The tool does not decide whether fat loss is appropriate for you'):(th?'ลองเปลี่ยนรอบไหล่และรอบเอวแยกกัน จะเห็นว่า V-shape ที่คล้ายกันเกิดได้จากหลายทาง':'Change shoulder and waist separately to see that a similar V-shape can come from different routes'),
    watch:th?'รอบเอวไม่ได้ขึ้นกับไขมันอย่างเดียว และอัตราส่วนไหล่ต่อเอวไม่ใช่คะแนนความน่าดึงดูดหรือคะแนนศักยภาพทางพันธุกรรม':'Waist circumference is not determined by body fat alone, and shoulder-to-waist ratio is not an attractiveness or genetic-potential score',resultCode:'C3_SCENARIO_RATIO'}:null;
  return <><ToolHeader language={language} id="C3_PHYSIQUE_GOAL" role="CORE" technicalName="Physique Goal Explorer" title={th?'อยากให้หุ่นดู V ขึ้น ควรพัฒนาอะไร?':'Want a stronger V-shape? What should change?'} question={th?'ลองเปลี่ยนรอบไหล่ รอบเอว หรือทั้งสองอย่าง เพื่อดูว่าแต่ละทางเปลี่ยนสัดส่วนที่มองเห็นอย่างไร':'Change shoulder circumference, waist circumference, or both to see how each route changes the visible proportion.'}/>
    <div className="lab-workbench"><div><InputGrid>
      <Field language={language} kind="shoulder" label={th?'รอบไหล่ (Shoulder circumference)':'SHOULDER CIRCUMFERENCE'} unit="cm" value={shoulder} onChange={setShoulder}/>
      <Field language={language} kind="waist" label={th?'รอบเอวที่สะดือ (Waist)':'WAIST @ NAVEL'} unit="cm" value={waist} onChange={setWaist}/>
    </InputGrid>
    <SelectButtons label={th?'เป้าหมาย':'GOAL'} value={goal} setValue={setGoal} onChange={()=>trackLabEvent('c3_goal_selected',{tool_id:'C3_PHYSIQUE_GOAL'})} options={[["v",th?"V-SHAPE มากขึ้น":"MORE V-TAPER"],["upper",th?"ช่วงบนกว้างขึ้น":"BROADER UPPER"],["waist",th?"เอวดูเล็กลง":"SMALLER WAIST LOOK"]]}/>
    <div className="scenario-editor"><label>{th?'ตัวอย่างรอบไหล่':'TARGET SHOULDER'} <input type="number" step="0.5" value={targetShoulder} onChange={e=>{setTargetShoulder(e.target.value);trackLabEvent('c3_scenario_route_changed',{tool_id:'C3_PHYSIQUE_GOAL'})}}/><span>cm</span></label><label>{th?'ตัวอย่างรอบเอว':'TARGET WAIST'} <input type="number" step="0.5" value={targetWaist} onChange={e=>{setTargetWaist(e.target.value);trackLabEvent('c3_scenario_route_changed',{tool_id:'C3_PHYSIQUE_GOAL'})}}/><span>cm</span></label></div>
    <label className="phi-toggle"><input type="checkbox" checked={phi} onChange={e=>{setPhi(e.target.checked);trackLabEvent('c3_phi_reference_toggled',{tool_id:'C3_PHYSIQUE_GOAL'})}}/> {th?'แสดงค่า 1.618 ที่นิยมใช้อ้างอิง':'SHOW 1.618 POPULAR REFERENCE'}</label><PrivacyStrip language={language} ruleset={LAB_RULESETS.C3}/></div>
    <ResultContract language={language} {...result}>{phi&&<div className="popular-reference"><b>{th?'ค่าอ้างอิงยอดนิยม 1.618':'POPULAR REFERENCE 1.618'}</b><p>{th?'1.618 เป็นค่าที่นิยมพูดถึงในสาย physique แต่ยังไม่มีหลักฐานว่าค่านี้คืออัตราส่วนไหล่ต่อเอวที่ดีที่สุดสำหรับทุกคน':'1.618 is a popular physique reference, but there is no evidence that it is the optimal shoulder-to-waist ratio for everyone.'}</p></div>}</ResultContract></div></>;
}

function QuickShell({id,title,technicalName,question,ruleset,result,children,language}){
  return <><ToolHeader language={language} id={id} role="QUICK" title={title} technicalName={technicalName} question={question}/><div className="lab-workbench"><div>{children}<MeasurementCheckNote language={language}/><PrivacyStrip language={language} ruleset={ruleset}/></div><ResultContract language={language} {...result}>{result&&<ShareResult language={language} title={title} text={`${result.result} — ${result.meaning}`}/>}</ResultContract></div></>;
}

export function VTaperTool({ language='th' }){
  const[s,setS]=useLabMeasurement('shoulder','118'),[w,setW]=useLabMeasurement('waist','82'); const x=computeVTaper(s,w); const th=language!=='en';
  const result=x?{result:th?`รอบไหล่ประมาณ ${x.ratio} เท่าของรอบเอว`:`Shoulder circumference is about ${x.ratio}× waist circumference`,metric:`V-Taper Ratio ${x.ratio}`,meaning:th?`จากวิธีวัดนี้ รอบไหล่ของคุณมีค่าประมาณ ${x.ratio} เท่าของรอบเอว`:`With this measurement method, your shoulder circumference is about ${x.ratio} times your waist circumference.`,use:th?'ใช้ติดตามสัดส่วนของตัวเองตามเวลา หรือเปิด C3 เพื่อดูว่าอัตราส่วนนี้เปลี่ยนได้จากทางไหนบ้าง':'Use it to track your own proportion over time, or open C3 to see different ways the ratio can change.',watch:th?'ค่านี้ไม่ใช่คะแนนความน่าดึงดูด และ 1.618 ไม่ใช่ค่าที่พิสูจน์ว่าเหมาะที่สุดสำหรับทุกคน':'This is not an attractiveness score, and 1.618 is not a scientifically proven optimum for everyone.',nextHref:'/lab/physique-goal',nextLabel:th?'ลองเป้าหมาย V-shape':'EXPLORE V-SHAPE GOALS',resultCode:'Q1_VTAPER_RATIO'}:null;
  return <QuickShell language={language} id="Q1_VTAPER" technicalName="V-Taper Snapshot" title={th?'สัดส่วน V ของคุณตอนนี้เป็นอย่างไร?':'What is your current V-taper proportion?'} question={th?'วัดรอบไหล่กับรอบเอว แล้วดูสัดส่วนปัจจุบันก่อนคิดเรื่องเป้าหมาย':'Measure shoulder and waist circumference to see your current proportion before exploring targets.'} ruleset={LAB_RULESETS.Q1} result={result}><InputGrid><Field language={language} kind="shoulder" label={th?'รอบไหล่':'SHOULDER'} unit="cm" value={s} onChange={setS}/><Field language={language} kind="waist" label={th?'รอบเอวที่สะดือ':'WAIST @ NAVEL'} unit="cm" value={w} onChange={setW}/></InputGrid></QuickShell>;
}

export function FFMITool({ language='th' }){
  const[h,setH]=useLabMeasurement('height','178'),[w,setW]=useLabMeasurement('weight','85'),[bf,setBf]=useLabMeasurement('bodyFat','18'); const x=computeFFMI(h,w,bf); const th=language!=='en';
  const result=x?{result:`FFMI ${x.ffmi}`,metric:`FFMI ${x.ffmi} · ${th?'มวลไร้ไขมันโดยประมาณ':'Estimated FFM'} ${x.ffm} kg`,meaning:th?`หลังหักมวลไขมันตามเปอร์เซ็นต์ไขมันที่คุณกรอก ระบบประมาณมวลไร้ไขมันและปรับตามส่วนสูงเพื่อให้เทียบตัวเองตามเวลาได้ง่ายขึ้น`:`After subtracting estimated fat mass from your body weight, FFMI adjusts the estimated fat-free mass for height.`,use:th?'เหมาะที่สุดสำหรับติดตามตัวเองตามเวลา โดยใช้วิธีประเมินเปอร์เซ็นต์ไขมันที่ใกล้เคียงเดิม':'Best used for self-tracking over time while keeping the body-fat estimation method similar.',watch:th?'ถ้าเปอร์เซ็นต์ไขมันที่ประเมินคลาดเคลื่อน FFMI ก็เปลี่ยนตาม FFMI ไม่ใช่ขีดจำกัดทางพันธุกรรม และค่า 25 ไม่ใช่กฎธรรมชาติที่ห้ามเกิน':'If body-fat estimate is off, FFMI changes with it. FFMI is not a genetic ceiling, and 25 is not a natural law that cannot be exceeded.',nextHref:'/lab/physique-goal',nextLabel:th?'สำรวจเป้าหมายรูปร่าง':'EXPLORE PHYSIQUE GOALS',resultCode:'Q2_FFMI'}:null;
  return <QuickShell language={language} id="Q2_FFMI" technicalName="FFMI Snapshot" title={th?'มวลไร้ไขมันของคุณมากแค่ไหนเมื่อเทียบกับส่วนสูง?':'How much fat-free mass do you carry for your height?'} question={th?'ใช้ FFMI เพื่อติดตามตัวเองตามเวลา ไม่ใช่ใช้ตัดสินขีดจำกัดทางพันธุกรรม':'Use FFMI for self-tracking over time, not as a genetic ceiling.'} ruleset={LAB_RULESETS.Q2} result={result}><InputGrid><Field language={language} kind="height" label={th?'ส่วนสูง':'HEIGHT'} unit="cm" value={h} onChange={setH}/><Field language={language} kind="weight" label={th?'น้ำหนัก':'WEIGHT'} unit="kg" value={w} onChange={setW}/><Field language={language} kind="bodyfat" label={th?'เปอร์เซ็นต์ไขมันโดยประมาณ':'BODY FAT ESTIMATE'} unit="%" value={bf} onChange={setBf}/></InputGrid></QuickShell>;
}

function KneeToWallVisual({language}){return <div className="ankle-test-viz" aria-label={language==='en'?'Knee-to-wall test illustration':'ภาพสาธิต Knee-to-Wall'}><div className="wall"/><div className="floor"/><div className="foot"/><div className="shin"/><div className="knee"/><p>{language==='en'?'Heel stays down → knee touches wall → move foot back to the farthest repeatable distance':'ส้นติดพื้น → ดันเข่าแตะผนัง → เลื่อนเท้าออกจนได้ระยะไกลสุดที่ทำซ้ำได้'}</p><small>{language==='en'?'SAME LANDMARK BOTH SIDES':'ใช้จุดวัดเดียวกันทั้งสองข้าง'}</small></div>}

export function KneeToWallTool({ language='th' }){
  const[l,setL]=useLabMeasurement('kneeWallLeft','9.5'),[r,setR]=useLabMeasurement('kneeWallRight','6.5'); const x=computeKneeToWall(l,r); const th=language!=='en';
  const sideTh = x?.lowerSideKey==='left'?'ซ้าย':x?.lowerSideKey==='right'?'ขวา':'เท่ากัน';
  const sideEn = x?.lowerSideKey==='left'?'left':x?.lowerSideKey==='right'?'right':'equal';
  const headline = x ? (x.lowerSideKey==='equal' ? (th?'ซ้ายและขวาได้ระยะเท่ากันในการทดสอบนี้':'Left and right reached the same distance in this test') : (th?`${sideTh}เดินหน้าได้น้อยกว่าอีกข้าง ${x.difference} cm`:`The ${sideEn} side reached ${x.difference} cm less than the other side`)) : '';
  const result=x?{result:headline,metric:`Knee-to-Wall: ${th?'ซ้าย':'L'} ${x.left} cm · ${th?'ขวา':'R'} ${x.right} cm`,meaning:th?`${x.lowerSideKey==='equal'?'สองข้างได้ระยะเท่ากัน':`ด้าน${sideTh}ให้เข่าเดินหน้าได้น้อยกว่าอีกข้าง`} ขณะลงน้ำหนักในการทดสอบนี้ คำทางเทคนิคที่เกี่ยวข้องคือ ankle dorsiflexion (การกระดกข้อเท้าให้เข่าเดินหน้าโดยส้นยังติดพื้น)`:`${x.lowerSideKey==='equal'?'Both sides reached the same distance':`The ${sideEn} side allowed less forward knee travel`} in this weight-bearing test. The relevant technical term is ankle dorsiflexion.`,use:th?'ถ้า Squat แล้วรู้สึกติดหรือจำเป็นต้องก้มลำตัวมาก ข้อเท้าอาจเป็นหนึ่งในปัจจัยที่ควรทดลองต่อ เปิด C2 แล้วเทียบพื้นราบกับการยกส้น โดยไม่สรุปว่าข้อเท้าเป็นสาเหตุแน่นอน':'If Squat feels restricted or requires more forward torso lean, ankle motion may be one factor worth testing. Open C2 and compare flat versus heel-elevated setups without assuming the ankle is definitely the cause.',watch:th?'ค่านี้ไม่ใช่การวินิจฉัยข้อเท้าติดหรือการบาดเจ็บ ความต่างเล็กน้อยอาจเกิดจากความคลาดเคลื่อนในการวัด ถ้ามีอาการปวด บวม หรืออาการผิดปกติ อย่าใช้เครื่องมือนี้แทนการประเมินทางคลินิก':'This does not diagnose an ankle restriction or injury. Small differences may be measurement noise. If you have pain, swelling, or abnormal symptoms, do not use this tool as a substitute for clinical assessment.',nextHref:'/lab/squat-geometry',nextLabel:th?'ลองผลกับ Squat ของฉัน':'TEST IT IN SQUAT GEOMETRY',resultCode:'Q3_KNEE_TO_WALL'}:null;
  return <><ToolHeader language={language} id="Q3_KNEE_TO_WALL" role="QUICK" technicalName="Knee-to-Wall Ankle Mobility Check" title={th?'เข่าคุณเดินหน้าได้แค่ไหน?':'How far can your knee travel forward?'} question={th?'ใช้ผนังและไม้บรรทัดเทียบซ้ายกับขวา เพื่อดูว่าการเคลื่อนไหวของข้อเท้าอาจเป็นหนึ่งในปัจจัยที่มีผลต่อ Squat หรือไม่':'Use a wall and ruler to compare left and right, and see whether ankle motion may be one useful piece of Squat context.'}/><div className="lab-workbench"><div><KneeToWallVisual language={language}/><InputGrid><Field language={language} kind="kneeWall" label={th?'ซ้าย':'LEFT'} unit="cm" value={l} onChange={v=>{setL(v);trackLabEvent('q3_test_side_completed',{side:'left'})}}/><Field language={language} kind="kneeWall" label={th?'ขวา':'RIGHT'} unit="cm" value={r} onChange={v=>{setR(v);trackLabEvent('q3_test_side_completed',{side:'right'})}}/></InputGrid><MeasurementCheckNote language={language}/><PrivacyStrip language={language} ruleset={LAB_RULESETS.Q3}/></div><ResultContract language={language} {...result}>{result&&<ShareResult language={language} title="KNEE-TO-WALL" text={`${result.result}. ${result.metric}`}/>}</ResultContract></div></>;
}

export function ApeIndexTool({ language='th' }){
  const[h,setH]=useLabMeasurement('height','178'),[a,setA]=useLabMeasurement('armSpan','184'); const x=computeApeIndex(h,a); const th=language!=='en';
  const result=x?{result:th?`ช่วงแขนของคุณ${x.diff>=0?'ยาวกว่า':'สั้นกว่า'}ส่วนสูง ${Math.abs(x.diff)} cm`:`Your arm span is ${Math.abs(x.diff)} cm ${x.diff>=0?'longer':'shorter'} than your height`,metric:`Ape Index ${x.diff>=0?'+':''}${x.diff} cm · ${x.ratio}×`,meaning:th?`Ape Index คือการเทียบช่วงแขนกับส่วนสูง ในการวัดนี้ปลายนิ้วถึงปลายนิ้วของคุณ${x.diff>=0?'ยาวกว่า':'สั้นกว่า'}ส่วนสูงประมาณ ${Math.abs(x.diff)} cm`:`Ape Index compares arm span with height. In this measurement, your fingertip-to-fingertip span is about ${Math.abs(x.diff)} cm ${x.diff>=0?'longer':'shorter'} than your height.`,use:th?'ใช้เป็นข้อมูลเรื่องระยะเอื้อมเมื่อเข้า C1 เพื่อดูว่าช่วงแขนอาจเปลี่ยนช่วงการเคลื่อนไหวและการจัดท่าอย่างไร':'Use it as reach context in C1 to see how arm span can change range of motion and setup.',watch:th?'Ape Index ไม่ได้ทำนายว่าคุณจะเก่ง Deadlift, Bench Press, Climbing หรือกีฬาใดแน่นอน':'Ape Index does not guarantee performance in Deadlift, Bench Press, climbing, or any sport.',nextHref:'/lab/exercise-fit',nextLabel:th?'ดูว่ามีผลกับท่าอย่างไร':'SEE HOW IT CHANGES MOVEMENT',resultCode:'Q4_APE_INDEX'}:null;
  return <QuickShell language={language} id="Q4_APE_INDEX" technicalName="Ape Index" title={th?'แขนคุณยาวแค่ไหนเมื่อเทียบกับส่วนสูง?':'How long are your arms relative to your height?'} question={th?'วัดช่วงแขนกับส่วนสูงก่อน แล้วค่อยใช้คำว่า Ape Index เป็นชื่อของค่าที่ได้':'Measure arm span and height first. Ape Index is simply the name for the relationship.'} ruleset={LAB_RULESETS.Q4} result={result}><InputGrid><Field language={language} kind="height" label={th?'ส่วนสูง':'HEIGHT'} unit="cm" value={h} onChange={setH}/><Field language={language} kind="arm" label={th?'ช่วงแขน':'ARM SPAN'} unit="cm" value={a} onChange={setA}/></InputGrid></QuickShell>;
}

export function FemurTibiaTool({ language='th' }){
  const[f,setF]=useLabMeasurement('femur','47'),[t,setT]=useLabMeasurement('tibia','39'); const x=computeFemurTibia(f,t); const th=language!=='en';
  const result=x?{result:th?`ช่วงต้นขาของคุณ${x.percent>=0?'ยาวกว่า':'สั้นกว่า'}ช่วงหน้าแข้งประมาณ ${Math.abs(x.percent)}%`:`Your femur segment is about ${Math.abs(x.percent)}% ${x.percent>=0?'longer':'shorter'} than your tibia segment`,metric:`Femur:Tibia ${x.ratio} · ${x.percent>=0?'+':''}${x.percent}%`,meaning:th?`Femur (กระดูกต้นขา) และ Tibia (กระดูกหน้าแข้ง) เป็นชื่อทางกายวิภาคของสองช่วงขา ความสัมพันธ์ของความยาวสองช่วงนี้มีผลต่อว่าตำแหน่งสะโพก เข่า และลำตัวต้องจัดอย่างไรเวลา Squat`:`Femur and tibia are the anatomical names for the thigh and lower-leg bones. Their relative segment lengths affect how the hip, knee, and torso must arrange during a Squat.`,use:th?'เปิด C2 แล้วลองเปลี่ยนการเดินหน้าของเข่า การยกส้น และรูปแบบ Squat เพื่อดูว่าตำแหน่งที่จำลองเปลี่ยนอย่างไร':'Open C2 and change knee travel, heel elevation, and Squat variant to see how the modeled position changes.',watch:th?'อัตราส่วนนี้อย่างเดียวไม่สามารถบอกว่าคุณควร Front หรือ Back Squat และค่าจากสายวัดเป็นเพียงค่าประมาณช่วงขาจากภายนอก':'This ratio alone cannot tell you whether to Front or Back Squat, and tape measurements are external segment estimates.',nextHref:'/lab/squat-geometry',nextLabel:th?'ลอง Squat Geometry':'OPEN SQUAT GEOMETRY',resultCode:'Q5_FEMUR_TIBIA'}:null;
  return <QuickShell language={language} id="Q5_FEMUR_TIBIA" technicalName="Femur:Tibia Snapshot" title={th?'ต้นขาคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง?':'How long is your thigh relative to your lower leg?'} question={th?'วัดสองช่วงของขา แล้วดูต่อว่าความสัมพันธ์นี้อาจเปลี่ยนตำแหน่งใน Squat อย่างไร':'Measure two leg segments, then explore how their relationship can change Squat position.'} ruleset={LAB_RULESETS.Q5} result={result}><InputGrid><Field language={language} kind="femur" label={th?'ช่วงต้นขา':'FEMUR SEGMENT'} unit="cm" value={f} onChange={setF}/><Field language={language} kind="tibia" label={th?'ช่วงหน้าแข้ง':'TIBIA SEGMENT'} unit="cm" value={t} onChange={setT}/></InputGrid></QuickShell>;
}
