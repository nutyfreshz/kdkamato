'use client';

import { useMemo, useState } from 'react';
import { computeApeIndex, computeFemurTibia, computeFFMI, computeFrame, computeVTaper, exerciseFitResult, LAB_RULESETS, squatScenarioCopy } from '../../lib/lab';
import { trackLabEvent } from '../../lib/labAnalytics';
import { MeasurementCheckNote, MeasurementField, PrivacyStrip, ResultContract, ShareResult, ToolHeader } from './LabUI';

const guides = {
  height: ['ยืนตรงและวัดส่วนสูงจากพื้นถึงศีรษะ โดยถอดรองเท้าถ้าทำได้', 'วัดทั้งที่ใส่รองเท้าหรือพื้นไม่เรียบ'],
  arm: ['กางแขนแนวนอนชิดผนัง วัดปลายนิ้วถึงปลายนิ้ว', 'งอศอกหรือยกไหล่ขึ้นระหว่างวัด'],
  femur: ['ใช้ landmark ผิวหนังชุดเดิมทุกครั้ง วัดเป็น Femur segment estimate ไม่ใช่ความยาวกระดูกจาก X-ray', 'เปลี่ยน landmark ระหว่างรอบ'],
  tibia: ['ใช้ landmark ผิวหนังชุดเดิมทุกครั้งจากบริเวณเข่าถึงข้อเท้า', 'วัดเฉียงหรือเปลี่ยนจุดปลาย'],
  torso: ['ใช้ external torso proxy จาก landmark ที่กำหนดเดิมทุกครั้ง', 'ตีความว่าเป็นความยาวกระดูกสันหลังจริง'],
  shoulder: ['วัดรอบช่วงไหล่/เดลทอยด์ที่กว้างที่สุดด้วยวิธีเดิมทุกครั้ง', 'ดึงสายวัดแน่นจนกดเนื้อเยื่อ'],
  waist: ['วัดที่ระดับสะดือ ท่าผ่อนคลาย หลังหายใจออกตามปกติ', 'สลับระหว่างเอวคอดสุดกับระดับสะดือ'],
  wrist: ['วัดรอบข้อมือที่ landmark เดิมและให้สายวัดแนบผิวแต่ไม่กด', 'วัดคนละตำแหน่งในแต่ละครั้ง'],
  ankle: ['วัดรอบข้อเท้าที่ landmark เดิมและใช้ tension ของสายวัดใกล้เคียงเดิม', 'วัดสูง/ต่ำต่างตำแหน่งกัน'],
  weight: ['ชั่งด้วยวิธีและช่วงเวลาที่ใกล้เคียงกันเมื่อต้องการ track', 'เทียบค่าที่มาจากเงื่อนไขชั่งต่างกันมาก'],
  bodyfat: ['ใช้ body-fat estimate จากวิธีเดิมเมื่อเทียบตามเวลา', 'มองค่า estimate เป็นค่าจริงที่แม่นยำสมบูรณ์']
};

function InputGrid({ children }) { return <div className="lab-input-grid">{children}</div>; }
function Field(props) { return <MeasurementField {...props} />; }
function valid(...values) { return values.every(v => Number.isFinite(Number(v)) && Number(v) > 0); }

export function ExerciseFitTool() {
  const [height,setHeight]=useState('178'),[arm,setArm]=useState('184'),[femur,setFemur]=useState('47'),[tibia,setTibia]=useState('39'),[torso,setTorso]=useState('58'),[movement,setMovement]=useState('SQUAT');
  const result = useMemo(() => valid(height,arm,femur,tibia,torso) ? exerciseFitResult({height,armSpan:arm,femur,tibia,torso,movement}) : null,[height,arm,femur,tibia,torso,movement]);
  return <>
    <ToolHeader id="C1_EXERCISE_FIT" role="CORE / HERO" title="EXERCISE FIT EXPLORER" question="ทำไมบางท่าคนอื่นทำแล้วธรรมชาติ แต่ผมทำแล้วรู้สึกฝืน?"/>
    <div className="lab-workbench"><div>
      <InputGrid>
        <Field label="HEIGHT" unit="cm" value={height} onChange={setHeight} guide={guides.height[0]} mistake={guides.height[1]}/>
        <Field label="ARM SPAN" unit="cm" value={arm} onChange={setArm} guide={guides.arm[0]} mistake={guides.arm[1]}/>
        <Field label="FEMUR SEGMENT" unit="cm" value={femur} onChange={setFemur} guide={guides.femur[0]} mistake={guides.femur[1]}/>
        <Field label="TIBIA SEGMENT" unit="cm" value={tibia} onChange={setTibia} guide={guides.tibia[0]} mistake={guides.tibia[1]}/>
        <Field label="TORSO PROXY" unit="cm" value={torso} onChange={setTorso} guide={guides.torso[0]} mistake={guides.torso[1]}/>
      </InputGrid>
      <div className="scenario-tabs" aria-label="Movement">{['SQUAT','BENCH','DEADLIFT'].map(x=><button key={x} className={movement===x?'active':''} onClick={()=>{setMovement(x);trackLabEvent('c1_movement_selected',{tool_id:'C1_EXERCISE_FIT',movement:x})}}>{x}</button>)}</div>
      <MeasurementCheckNote/><PrivacyStrip ruleset={LAB_RULESETS.C1}/>
    </div>
    <ResultContract {...result}>{result && <ShareResult title="MY EXERCISE FIT" text={`${movement}: ${result.result}. ${result.use}`}/>}</ResultContract></div>
  </>;
}

function SquatSchematic({ kneeTravel, heel, stance, variant }) {
  const heelLift = heel==='moderate'?14:heel==='small'?7:0;
  const kneeX = 250 + (kneeTravel-50)*0.7 + heelLift*0.45;
  const hipX = 175 - (kneeTravel-50)*0.24;
  const torsoLean = variant==='lowbar'?38:variant==='front'?12:24;
  const shoulderX = hipX - torsoLean + (kneeTravel-50)*0.18 - heelLift*0.5;
  const barX = variant==='front'?shoulderX+18:shoulderX-2;
  return <div className="squat-viz"><svg viewBox="0 0 420 340" role="img" aria-label="Squat geometry schematic">
    <line className="floor" x1="40" y1="300" x2="390" y2="300"/>
    <line className="tibia-line" x1="270" y1="295" x2={kneeX} y2="205"/><line className="femur-line" x1={kneeX} y1="205" x2={hipX} y2="170"/><line className="torso-line" x1={hipX} y1="170" x2={shoulderX} y2="82"/><line className="arm-line" x1={shoulderX} y1="95" x2={barX} y2="110"/>
    <line className="bar-line" x1={barX-48} y1="78" x2={barX+48} y2="78"/>
    {[['ankle',270,295],['knee',kneeX,205],['hip',hipX,170],['shoulder',shoulderX,82]].map(([k,x,y])=><circle key={k} cx={x} cy={y} r="7"/>)}
    <text x="48" y="44">SCHEMATIC ONLY</text><text x="48" y="62">not calculated joint angles</text><text x="48" y="320">STANCE: {stance.toUpperCase()} · HEEL: {heel.toUpperCase()}</text>
  </svg></div>;
}

export function SquatGeometryTool() {
  const [height,setHeight]=useState('178'),[femur,setFemur]=useState('47'),[tibia,setTibia]=useState('39'),[torso,setTorso]=useState('58');
  const [kneeTravel,setKneeTravel]=useState(55),[heel,setHeel]=useState('flat'),[stance,setStance]=useState('medium'),[variant,setVariant]=useState('highbar');
  const ft = useMemo(()=>computeFemurTibia(femur,tibia),[femur,tibia]); const copy = squatScenarioCopy({heel,stance,variant,kneeTravel});
  const result = ft && valid(height,torso) ? { result:`Femur:Tibia ${ft.ratio} · ${variant.toUpperCase()} scenario`, meaning:`Femur เทียบ Tibia ต่างกัน ${Math.abs(ft.percent)}% ในการวัดนี้. ${copy.kneeCopy}. ${copy.variantCopy}`, use:`${copy.heelCopy}. ${copy.stanceCopy}. ใช้ controls เพื่อเปรียบเทียบ geometry tendency ทีละอย่าง`, watch:'ภาพเป็น deterministic schematic เพื่อเปรียบเทียบ scenario ไม่ใช่การคำนวณ joint angle จริง ไม่ได้ตัดสินว่า Front/Back แบบไหนดีที่สุด และไม่ประเมิน pain, mobility หรือ injury risk', resultCode:'C2_SCENARIO_COMPARE' } : null;
  return <><ToolHeader id="C2_SQUAT_GEOMETRY" role="CORE / DEEP" title="SQUAT GEOMETRY" question="ถ้าอยากพัฒนาขา geometry ฉันควรลอง Front / Back / heel / stance แบบไหนก่อน?"/>
    <div className="lab-workbench"><div><InputGrid>
      <Field label="HEIGHT" unit="cm" value={height} onChange={setHeight} guide={guides.height[0]} mistake={guides.height[1]}/><Field label="FEMUR SEGMENT" unit="cm" value={femur} onChange={setFemur} guide={guides.femur[0]} mistake={guides.femur[1]}/><Field label="TIBIA SEGMENT" unit="cm" value={tibia} onChange={setTibia} guide={guides.tibia[0]} mistake={guides.tibia[1]}/><Field label="TORSO PROXY" unit="cm" value={torso} onChange={setTorso} guide={guides.torso[0]} mistake={guides.torso[1]}/>
    </InputGrid><div className="control-stack"><label>KNEE TRAVEL <span>{kneeTravel<35?'LESS':kneeTravel>65?'MORE':'MID'}</span><input type="range" min="0" max="100" value={kneeTravel} onChange={e=>{setKneeTravel(Number(e.target.value));trackLabEvent('c2_knee_travel_changed',{tool_id:'C2_SQUAT_GEOMETRY'})}}/></label>
    <SelectButtons label="HEEL" value={heel} setValue={setHeel} options={[['flat','FLAT'],['small','SMALL'],['moderate','MODERATE']]}/><SelectButtons label="STANCE" value={stance} setValue={setStance} options={[['narrow','NARROW'],['medium','MEDIUM'],['wide','WIDE']]}/><SelectButtons label="VARIANT" value={variant} setValue={setVariant} options={[['front','FRONT'],['highbar','HIGH-BAR'],['lowbar','LOW-BAR']]}/></div><MeasurementCheckNote/><PrivacyStrip ruleset={LAB_RULESETS.C2}/></div>
    <div><SquatSchematic kneeTravel={kneeTravel} heel={heel} stance={stance} variant={variant}/><ResultContract {...result}/></div></div></>;
}

function SelectButtons({label,value,setValue,options}) { return <div className="selector-row"><span>{label}</span><div>{options.map(([v,l])=><button key={v} className={value===v?'active':''} onClick={()=>setValue(v)}>{l}</button>)}</div></div>; }

export function PhysiqueGoalTool() {
  const [shoulder,setShoulder]=useState('118'),[waist,setWaist]=useState('82'),[targetShoulder,setTargetShoulder]=useState('124'),[targetWaist,setTargetWaist]=useState('82'),[goal,setGoal]=useState('v'),[phi,setPhi]=useState(false);
  const current=computeVTaper(shoulder,waist), target=computeVTaper(targetShoulder,targetWaist);
  const result=current&&target?{result:`${current.ratio} → ${target.ratio}`,meaning:`Current shoulder circumference = ${shoulder} cm, waist = ${waist} cm. Scenario = ${targetShoulder}/${targetWaist}. Ratio เปลี่ยนตาม dimension ที่คุณเลือก ไม่ใช่ magical number`,use:goal==='upper'?'ถ้าเป้าหมายคือ upper body กว้างขึ้น ให้ใช้ scenario นี้เชื่อมกับการพัฒนา delts / lats / upper back':goal==='waist'?'ถ้าเป้าหมายคือ waist ดูเล็กลง ให้ใช้ scenario เพื่อเห็นผลทางคณิตศาสตร์ แต่ tool นี้ไม่ตัดสินว่าคุณควรลดไขมันหรือไม่':'ลองเปลี่ยน shoulder และ waist แยกกันเพื่อดูว่า V-shape เดียวกันไปได้หลาย route',watch:'Waist circumference ไม่ได้มาจาก body fat อย่างเดียว และ shoulder:waist ratio ไม่ใช่ attractiveness score หรือ genetic potential score',resultCode:'C3_SCENARIO_RATIO'}:null;
  return <><ToolHeader id="C3_PHYSIQUE_GOAL" role="CORE" title="PHYSIQUE GOAL EXPLORER" question="ถ้าอยากให้หุ่นดู V ขึ้น จริง ๆ ต้องเปลี่ยนอะไร?"/><div className="lab-workbench"><div><InputGrid><Field label="SHOULDER CIRCUMFERENCE" unit="cm" value={shoulder} onChange={setShoulder} guide={guides.shoulder[0]} mistake={guides.shoulder[1]}/><Field label="WAIST @ NAVEL" unit="cm" value={waist} onChange={setWaist} guide={guides.waist[0]} mistake={guides.waist[1]}/></InputGrid><SelectButtons label="GOAL" value={goal} setValue={setGoal} options={[['v','MORE V-TAPER'],['upper','BROADER UPPER'],['waist','SMALLER WAIST LOOK']]}/><div className="scenario-editor"><label>TARGET SHOULDER <input type="number" step="0.5" value={targetShoulder} onChange={e=>setTargetShoulder(e.target.value)}/><span>cm</span></label><label>TARGET WAIST <input type="number" step="0.5" value={targetWaist} onChange={e=>setTargetWaist(e.target.value)}/><span>cm</span></label></div><label className="phi-toggle"><input type="checkbox" checked={phi} onChange={e=>setPhi(e.target.checked)}/> SHOW 1.618 POPULAR REFERENCE</label><PrivacyStrip ruleset={LAB_RULESETS.C3}/></div><ResultContract {...result}>{phi&&<div className="popular-reference"><b>POPULAR REFERENCE 1.618</b><p>1.618 เป็น reference ที่นิยมในสาย physique แต่ยังไม่มีหลักฐานว่าค่านี้คือ shoulder-to-waist ratio ที่ดีที่สุดสำหรับทุกคน</p></div>}</ResultContract></div></>;
}

export function VTaperTool(){const[s,setS]=useState('118'),[w,setW]=useState('82');const x=computeVTaper(s,w);const result=x?{result:String(x.ratio),meaning:`Shoulder circumference ของคุณประมาณ ${x.ratio} เท่าของ waist ในวิธีวัดนี้`,use:'ใช้ track proportion ของตัวเอง หรือเปิด C3 เพื่อดูว่า ratio เปลี่ยนได้จากทางไหนบ้าง',watch:'นี่ไม่ใช่ attractiveness score และ 1.618 ไม่ใช่ scientific optimum',nextHref:'/lab/physique-goal',nextLabel:'OPEN PHYSIQUE GOAL',resultCode:'Q1_VTAPER_RATIO'}:null;return <QuickShell id="Q1_VTAPER" title="V-TAPER SNAPSHOT" question="Shoulder เทียบ Waist ของฉันตอนนี้เป็นเท่าไร?" ruleset={LAB_RULESETS.Q1} result={result}><InputGrid><Field label="SHOULDER" unit="cm" value={s} onChange={setS} guide={guides.shoulder[0]} mistake={guides.shoulder[1]}/><Field label="WAIST @ NAVEL" unit="cm" value={w} onChange={setW} guide={guides.waist[0]} mistake={guides.waist[1]}/></InputGrid></QuickShell>}

export function FFMITool(){const[h,setH]=useState('178'),[w,setW]=useState('85'),[bf,setBf]=useState('18');const x=computeFFMI(h,w,bf);const result=x?{result:`FFMI ${x.ffmi}`,meaning:`Fat-free mass estimate = ${x.ffm} kg. FFMI คือ fat-free mass ที่ normalize ตามส่วนสูง`,use:'เหมาะที่สุดกับการ track ตัวเองตามเวลา โดยใช้วิธีประเมิน body fat ที่ใกล้เคียงเดิม',watch:'ถ้า body-fat estimate ผิด FFMI ก็เปลี่ยนตาม. FFMI ไม่ใช่ genetic ceiling และ 25 ไม่ใช่กฎธรรมชาติที่ห้ามเกิน',nextHref:'/lab/physique-goal',nextLabel:'EXPLORE PHYSIQUE GOALS',resultCode:'Q2_FFMI'}:null;return <QuickShell id="Q2_FFMI" title="FFMI SNAPSHOT" question="Fat-free mass ของฉันเมื่อปรับตามส่วนสูงเป็นเท่าไร?" ruleset={LAB_RULESETS.Q2} result={result}><InputGrid><Field label="HEIGHT" unit="cm" value={h} onChange={setH} guide={guides.height[0]} mistake={guides.height[1]}/><Field label="WEIGHT" unit="kg" value={w} onChange={setW} guide={guides.weight[0]} mistake={guides.weight[1]}/><Field label="BODY FAT ESTIMATE" unit="%" value={bf} onChange={setBf} guide={guides.bodyfat[0]} mistake={guides.bodyfat[1]}/></InputGrid></QuickShell>}

export function FrameSnapshotTool(){const[h,setH]=useState('178'),[w,setW]=useState('17.5'),[a,setA]=useState('23');const x=computeFrame(h,w,a);const result=x?{result:`H/W ${x.heightWrist} · H/A ${x.heightAnkle}`,meaning:`Wrist ${w} cm และ ankle ${a} cm เป็น direct frame markers. Height/Wrist และ Height/Ankle เป็น derived markers ไม่ใช่การสแกนขนาดกระดูกโดยตรง`,use:'ใช้เป็น frame context เวลาดู physique, FFMI หรือ exercise geometry โดยควรวัด landmark เดิมทุกครั้ง',watch:'ไม่มี universal adult cutoff ที่ดีพอให้เรา invent Small/Medium/Large. Marker เล็กหรือใหญ่ไม่ได้คำนวณ genetic potential',nextHref:'/lab/exercise-fit',nextLabel:'OPEN EXERCISE FIT',resultCode:'Q3_FRAME_MARKERS'}:null;return <QuickShell id="Q3_FRAME" title="FRAME SNAPSHOT" question="ข้อมือและข้อเท้าบอกอะไรได้จริง และอะไรที่ไม่ควรเดาเกินไป?" ruleset={LAB_RULESETS.Q3} result={result}><InputGrid><Field label="HEIGHT" unit="cm" value={h} onChange={setH} guide={guides.height[0]} mistake={guides.height[1]}/><Field label="WRIST" unit="cm" value={w} onChange={setW} guide={guides.wrist[0]} mistake={guides.wrist[1]}/><Field label="ANKLE" unit="cm" value={a} onChange={setA} guide={guides.ankle[0]} mistake={guides.ankle[1]}/></InputGrid></QuickShell>}

export function ApeIndexTool(){const[h,setH]=useState('178'),[a,setA]=useState('184');const x=computeApeIndex(h,a);const result=x?{result:`${x.diff>=0?'+':''}${x.diff} cm · ${x.ratio}×`,meaning:`ปลายนิ้วถึงปลายนิ้วของคุณ${x.diff>=0?'ยาวกว่า':'สั้นกว่า'}ส่วนสูงประมาณ ${Math.abs(x.diff)} cm`,use:'ใช้เป็น reach context เวลาเข้า C1 เพื่อดูว่าระยะของแขนอาจเปลี่ยน ROM / setup ของ movement ยังไง',watch:'Ape Index ไม่ได้ทำนายว่าคุณจะเก่ง Deadlift, Bench, Climbing หรือกีฬาใดแน่นอน',nextHref:'/lab/exercise-fit',nextLabel:'SEE MY EXERCISE FIT',resultCode:'Q4_APE_INDEX'}:null;return <QuickShell id="Q4_APE_INDEX" title="APE INDEX" question="ช่วงแขนของฉันยาวหรือสั้นกว่าส่วนสูงเท่าไร?" ruleset={LAB_RULESETS.Q4} result={result}><InputGrid><Field label="HEIGHT" unit="cm" value={h} onChange={setH} guide={guides.height[0]} mistake={guides.height[1]}/><Field label="ARM SPAN" unit="cm" value={a} onChange={setA} guide={guides.arm[0]} mistake={guides.arm[1]}/></InputGrid></QuickShell>}

export function FemurTibiaTool(){const[f,setF]=useState('47'),[t,setT]=useState('39');const x=computeFemurTibia(f,t);const result=x?{result:`${x.ratio} · ${x.percent>=0?'+':''}${x.percent}%`,meaning:`Femur (กระดูกต้นขา) ของคุณ${x.percent>=0?'ยาวกว่า':'สั้นกว่า'} Tibia (กระดูกหน้าแข้ง) ประมาณ ${Math.abs(x.percent)}% ในการวัดนี้`,use:'เปิด C2 แล้วลอง knee travel / heel elevation / squat variant เพื่อดูผลใน schematic model',watch:'Ratio นี้อย่างเดียวไม่สามารถบอกว่าคุณควร Front หรือ Back Squat และค่าจากสายวัดเป็น segment estimate',nextHref:'/lab/squat-geometry',nextLabel:'OPEN SQUAT GEOMETRY',resultCode:'Q5_FEMUR_TIBIA'}:null;return <QuickShell id="Q5_FEMUR_TIBIA" title="FEMUR:TIBIA SNAPSHOT" question="ต้นขาเทียบหน้าแข้งของฉันสัมพันธ์กันยังไง?" ruleset={LAB_RULESETS.Q5} result={result}><InputGrid><Field label="FEMUR SEGMENT" unit="cm" value={f} onChange={setF} guide={guides.femur[0]} mistake={guides.femur[1]}/><Field label="TIBIA SEGMENT" unit="cm" value={t} onChange={setT} guide={guides.tibia[0]} mistake={guides.tibia[1]}/></InputGrid></QuickShell>}

function QuickShell({id,title,question,ruleset,result,children}){return <><ToolHeader id={id} role="QUICK" title={title} question={question}/><div className="lab-workbench"><div>{children}<MeasurementCheckNote/><PrivacyStrip ruleset={ruleset}/></div><ResultContract {...result}>{result&&<ShareResult title={title} text={`${result.result} — ${result.meaning}`}/>}</ResultContract></div></>}
