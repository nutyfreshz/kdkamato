'use client';

import { useMemo, useState } from 'react';
import { computeApeIndex, computeFemurTibia, computeFFMI, computeKneeToWall, computeVTaper, exerciseFitResult, LAB_RULESETS, squatScenarioCopy } from '../../lib/lab';
import { useLabMeasurement } from '../../lib/labSession';
import { trackLabEvent } from '../../lib/labAnalytics';
import { ImportedMeasurementNote, MeasurementCheckNote, MeasurementField, PrivacyStrip, ResultContract, ShareResult, ToolHeader } from './LabUI';

const guides = {
  height: ['ยืนตรงและวัดส่วนสูงจากพื้นถึงศีรษะ โดยถอดรองเท้าถ้าทำได้', 'วัดทั้งที่ใส่รองเท้าหรือพื้นไม่เรียบ'],
  arm: ['กางแขนแนวนอนชิดผนัง วัดปลายนิ้วถึงปลายนิ้ว', 'งอศอกหรือยกไหล่ขึ้นระหว่างวัด'],
  femur: ['ใช้ landmark ผิวหนังชุดเดิมทุกครั้ง วัดเป็น Femur segment estimate ไม่ใช่ความยาวกระดูกจาก X-ray', 'เปลี่ยน landmark ระหว่างรอบ'],
  tibia: ['ใช้ landmark ผิวหนังชุดเดิมทุกครั้งจากบริเวณเข่าถึงข้อเท้า', 'วัดเฉียงหรือเปลี่ยนจุดปลาย'],
  torso: ['ใช้ external torso proxy จาก landmark ที่กำหนดเดิมทุกครั้ง', 'ตีความว่าเป็นความยาวกระดูกสันหลังจริง'],
  shoulder: ['วัดรอบช่วงไหล่/เดลทอยด์ที่กว้างที่สุดด้วยวิธีเดิมทุกครั้ง', 'ดึงสายวัดแน่นจนกดเนื้อเยื่อ'],
  waist: ['วัดที่ระดับสะดือ ท่าผ่อนคลาย หลังหายใจออกตามปกติ', 'สลับระหว่างเอวคอดสุดกับระดับสะดือ'],
  weight: ['ชั่งด้วยวิธีและช่วงเวลาที่ใกล้เคียงกันเมื่อต้องการ track', 'เทียบค่าที่มาจากเงื่อนไขชั่งต่างกันมาก'],
  bodyfat: ['ใช้ body-fat estimate จากวิธีเดิมเมื่อเทียบตามเวลา', 'มองค่า estimate เป็นค่าจริงที่แม่นยำสมบูรณ์'],
  kneeWall: ['หันหน้าเข้าผนัง วางเท้าทดสอบตรงพอให้ protocol คงที่ ดันเข่าแตะผนังโดยส้นไม่ยก แล้วเลื่อนเท้าออกจนได้ระยะไกลสุดที่ทำซ้ำได้ วัดจาก toe landmark เดิมถึงผนัง', 'ปล่อยส้นลอย หมุนเท้าเปลี่ยนมุมมาก หรือใช้ landmark คนละจุดระหว่างซ้าย/ขวา']
};

const why = {
  height: 'วัดส่วนสูง เพื่อใช้เป็นฐานเทียบกับช่วงแขนและ segment อื่น',
  arm: 'วัดช่วงแขน เพื่อดู reach ที่อาจเปลี่ยน ROM และ setup',
  femur: 'วัดช่วงต้นขา เพื่อดูว่าตำแหน่งสะโพก/เข่าต้องจัดต่างอย่างไรตอน Squat',
  tibia: 'วัดช่วงหน้าแข้ง เพื่อเทียบ geometry ของขากับช่วงต้นขา',
  torso: 'วัดช่วงลำตัวแบบ proxy เพื่อเพิ่ม context ให้ squat geometry',
  shoulder: 'วัดรอบช่วงไหล่ เพื่อดูสัดส่วน upper body เทียบกับเอว',
  waist: 'วัดรอบเอวที่ protocol เดิม เพื่อให้การเปรียบเทียบ silhouette สม่ำเสมอ',
  weight: 'ใช้น้ำหนักเพื่อประมาณ fat-free mass จาก body-fat estimate',
  bodyfat: 'Body-fat estimate ใช้หัก fat mass ก่อนคำนวณ FFMI',
  kneeWall: 'วัดระยะเข่าถึงผนัง เพื่อดูว่าแต่ละข้างยอมให้เข่าเดินหน้าแบบ weight-bearing ได้แค่ไหน'
};

function InputGrid({ children }) { return <div className="lab-input-grid">{children}</div>; }
function Field(props) { return <MeasurementField {...props} />; }
function valid(...values) { return values.every(v => Number.isFinite(Number(v)) && Number(v) > 0); }
function SelectButtons({label,value,setValue,options,onChange}) { return <div className="selector-row"><span>{label}</span><div>{options.map(([v,l])=><button type="button" key={v} className={value===v?'active':''} onClick={()=>{setValue(v);onChange?.(v)}}>{l}</button>)}</div></div>; }

export function ExerciseFitTool() {
  const [height,setHeight]=useLabMeasurement('height','178');
  const [arm,setArm]=useLabMeasurement('armSpan','184');
  const [femur,setFemur]=useLabMeasurement('femur','47');
  const [tibia,setTibia]=useLabMeasurement('tibia','39');
  const [torso,setTorso]=useLabMeasurement('torso','58');
  const [movement,setMovement]=useState('SQUAT');
  const result = useMemo(() => valid(height,arm,femur,tibia,torso) ? exerciseFitResult({height,armSpan:arm,femur,tibia,torso,movement}) : null,[height,arm,femur,tibia,torso,movement]);
  return <>
    <ToolHeader id="C1_EXERCISE_FIT" role="CORE / HERO" technicalName="Exercise Fit Explorer" title="ท่าไหนเข้ากับโครงคุณ?" question="ท่าเดียวกัน ไม่ได้รู้สึกเหมือนกันในทุกคน วัดแขน ขา และลำตัว แล้วดูว่าควรลองปรับ setup อะไรก่อน"/>
    <div className="lab-workbench"><div>
      <InputGrid>
        <Field label="HEIGHT" unit="cm" value={height} onChange={setHeight} why={why.height} guide={guides.height[0]} mistake={guides.height[1]}/>
        <Field label="ARM SPAN" unit="cm" value={arm} onChange={setArm} why={why.arm} guide={guides.arm[0]} mistake={guides.arm[1]}/>
        <Field label="FEMUR SEGMENT" unit="cm" value={femur} onChange={setFemur} why={why.femur} guide={guides.femur[0]} mistake={guides.femur[1]}/>
        <Field label="TIBIA SEGMENT" unit="cm" value={tibia} onChange={setTibia} why={why.tibia} guide={guides.tibia[0]} mistake={guides.tibia[1]}/>
        <Field label="TORSO PROXY" unit="cm" value={torso} onChange={setTorso} why={why.torso} guide={guides.torso[0]} mistake={guides.torso[1]}/>
      </InputGrid>
      <div className="scenario-tabs" aria-label="Movement">{['SQUAT','BENCH','DEADLIFT'].map(x=><button type="button" key={x} className={movement===x?'active':''} onClick={()=>{setMovement(x);trackLabEvent('c1_movement_selected',{tool_id:'C1_EXERCISE_FIT',movement:x})}}>{x}</button>)}</div>
      <MeasurementCheckNote/><PrivacyStrip ruleset={LAB_RULESETS.C1}/>
    </div>
    <ResultContract {...result}>{result && <ShareResult title="MY BODY / MOVEMENT PROFILE" text={`${result.result}. ${result.use}`}/>}</ResultContract></div>
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
  const [height,setHeight]=useLabMeasurement('height','178');
  const [femur,setFemur]=useLabMeasurement('femur','47');
  const [tibia,setTibia]=useLabMeasurement('tibia','39');
  const [torso,setTorso]=useLabMeasurement('torso','58');
  const [kneeLeft]=useLabMeasurement('kneeWallLeft','');
  const [kneeRight]=useLabMeasurement('kneeWallRight','');
  const ankleContext = computeKneeToWall(kneeLeft,kneeRight);
  const [kneeTravel,setKneeTravel]=useState(55),[heel,setHeel]=useState('flat'),[stance,setStance]=useState('medium'),[variant,setVariant]=useState('highbar');
  const ft = useMemo(()=>computeFemurTibia(femur,tibia),[femur,tibia]);
  const copy = squatScenarioCopy({heel,stance,variant,kneeTravel});
  const result = ft && valid(height,torso) ? {
    result: variant==='front' ? 'กำลังเทียบ Front Squat กับ geometry ของคุณ' : variant==='lowbar' ? 'กำลังเทียบ Low-Bar กับ geometry ของคุณ' : 'กำลังเทียบ High-Bar กับ geometry ของคุณ',
    metric:`Femur:Tibia ${ft.ratio} · ${variant.toUpperCase()} scenario`,
    meaning:`ต้นขาเทียบหน้าแข้งต่างกัน ${Math.abs(ft.percent)}% ในการวัดนี้. ${copy.kneeCopy}. ${copy.variantCopy}`,
    use:`${copy.heelCopy}. ${copy.stanceCopy}. เปลี่ยน control ทีละอย่างแล้วดูว่าตำแหน่ง model เปลี่ยนอย่างไร`,
    watch:'ภาพเป็น deterministic schematic เพื่อเปรียบเทียบ scenario ไม่ใช่การคำนวณ joint angle จริง ไม่ได้ตัดสินว่า Front/Back แบบไหนดีที่สุด และไม่ประเมิน pain, mobility หรือ injury risk',
    resultCode:'C2_SCENARIO_COMPARE'
  } : null;
  return <><ToolHeader id="C2_SQUAT_GEOMETRY" role="CORE / DEEP" technicalName="Squat Geometry & Variant Explorer" title="Squat แบบไหนเข้ากับขาคุณ?" question="อยากพัฒนาขา แต่ไม่แน่ใจว่าควร Front / Back หรือยกส้นไหม? เปลี่ยน setup แล้วดู geometry เปลี่ยนทันที"/>
    <div className="lab-workbench"><div><InputGrid>
      <Field label="HEIGHT" unit="cm" value={height} onChange={setHeight} why={why.height} guide={guides.height[0]} mistake={guides.height[1]}/>
      <Field label="FEMUR SEGMENT" unit="cm" value={femur} onChange={setFemur} why={why.femur} guide={guides.femur[0]} mistake={guides.femur[1]}/>
      <Field label="TIBIA SEGMENT" unit="cm" value={tibia} onChange={setTibia} why={why.tibia} guide={guides.tibia[0]} mistake={guides.tibia[1]}/>
      <Field label="TORSO PROXY" unit="cm" value={torso} onChange={setTorso} why={why.torso} guide={guides.torso[0]} mistake={guides.torso[1]}/>
    </InputGrid>
    {ankleContext && <ImportedMeasurementNote>Knee-to-Wall: ซ้าย {ankleContext.left} cm · ขวา {ankleContext.right} cm ใช้เป็น ankle-mobility context เท่านั้น ไม่ได้บังคับคำแนะนำ</ImportedMeasurementNote>}
    <div className="control-stack"><label>KNEE TRAVEL <span>{kneeTravel<35?'LESS':kneeTravel>65?'MORE':'MID'}</span><input type="range" min="0" max="100" value={kneeTravel} onChange={e=>{setKneeTravel(Number(e.target.value));trackLabEvent('c2_knee_travel_changed',{tool_id:'C2_SQUAT_GEOMETRY'})}}/></label>
      <SelectButtons label="HEEL" value={heel} setValue={setHeel} onChange={()=>trackLabEvent('c2_heel_scenario_changed',{tool_id:'C2_SQUAT_GEOMETRY'})} options={[["flat","FLAT"],["small","SMALL"],["moderate","MODERATE"]]}/>
      <SelectButtons label="STANCE" value={stance} setValue={setStance} onChange={()=>trackLabEvent('c2_stance_changed',{tool_id:'C2_SQUAT_GEOMETRY'})} options={[["narrow","NARROW"],["medium","MEDIUM"],["wide","WIDE"]]}/>
      <SelectButtons label="VARIANT" value={variant} setValue={setVariant} onChange={()=>trackLabEvent('c2_variant_changed',{tool_id:'C2_SQUAT_GEOMETRY'})} options={[["front","FRONT"],["highbar","HIGH-BAR"],["lowbar","LOW-BAR"]]}/>
    </div><MeasurementCheckNote/><PrivacyStrip ruleset={LAB_RULESETS.C2}/></div>
    <div><SquatSchematic kneeTravel={kneeTravel} heel={heel} stance={stance} variant={variant}/><ResultContract {...result}/></div></div></>;
}

export function PhysiqueGoalTool() {
  const [shoulder,setShoulder]=useLabMeasurement('shoulder','118');
  const [waist,setWaist]=useLabMeasurement('waist','82');
  const [targetShoulder,setTargetShoulder]=useState('124'),[targetWaist,setTargetWaist]=useState('82'),[goal,setGoal]=useState('v'),[phi,setPhi]=useState(false);
  const current=computeVTaper(shoulder,waist), target=computeVTaper(targetShoulder,targetWaist);
  const result=current&&target?{
    result:`ตอนนี้ไหล่ประมาณ ${current.ratio}× เอว → scenario ${target.ratio}×`,
    metric:`V-Taper Ratio ${current.ratio} → ${target.ratio}`,
    meaning:`Current shoulder = ${shoulder} cm, waist = ${waist} cm. Scenario = ${targetShoulder}/${targetWaist}. Ratio เปลี่ยนตาม dimension ที่คุณเลือก ไม่ใช่ magical number`,
    use:goal==='upper'?'ถ้าเป้าหมายคือ upper body กว้างขึ้น ให้ใช้ scenario นี้เชื่อมกับการพัฒนา delts / lats / upper back':goal==='waist'?'ถ้าเป้าหมายคือ waist ดูเล็กลง ให้ใช้ scenario เพื่อเห็นผลทางคณิตศาสตร์ แต่ tool นี้ไม่ตัดสินว่าคุณควรลดไขมันหรือไม่':'ลองเปลี่ยน shoulder และ waist แยกกันเพื่อดูว่า V-shape เดียวกันไปได้หลาย route',
    watch:'Waist circumference ไม่ได้มาจาก body fat อย่างเดียว และ shoulder:waist ratio ไม่ใช่ attractiveness score หรือ genetic potential score',resultCode:'C3_SCENARIO_RATIO'}:null;
  return <><ToolHeader id="C3_PHYSIQUE_GOAL" role="CORE" technicalName="Physique Goal Explorer" title="อยาก V-shape ขึ้น ควรพัฒนาอะไร?" question="อยากให้ silhouette เปลี่ยน แต่ไม่รู้ว่าควรเน้น upper body หรือ waist? ลองแต่ละ route แบบเป็น scenario"/>
    <div className="lab-workbench"><div><InputGrid>
      <Field label="SHOULDER CIRCUMFERENCE" unit="cm" value={shoulder} onChange={setShoulder} why={why.shoulder} guide={guides.shoulder[0]} mistake={guides.shoulder[1]}/>
      <Field label="WAIST @ NAVEL" unit="cm" value={waist} onChange={setWaist} why={why.waist} guide={guides.waist[0]} mistake={guides.waist[1]}/>
    </InputGrid>
    <SelectButtons label="GOAL" value={goal} setValue={setGoal} onChange={()=>trackLabEvent('c3_goal_selected',{tool_id:'C3_PHYSIQUE_GOAL'})} options={[["v","MORE V-TAPER"],["upper","BROADER UPPER"],["waist","SMALLER WAIST LOOK"]]}/>
    <div className="scenario-editor"><label>TARGET SHOULDER <input type="number" step="0.5" value={targetShoulder} onChange={e=>{setTargetShoulder(e.target.value);trackLabEvent('c3_scenario_route_changed',{tool_id:'C3_PHYSIQUE_GOAL'})}}/><span>cm</span></label><label>TARGET WAIST <input type="number" step="0.5" value={targetWaist} onChange={e=>{setTargetWaist(e.target.value);trackLabEvent('c3_scenario_route_changed',{tool_id:'C3_PHYSIQUE_GOAL'})}}/><span>cm</span></label></div>
    <label className="phi-toggle"><input type="checkbox" checked={phi} onChange={e=>{setPhi(e.target.checked);trackLabEvent('c3_phi_reference_toggled',{tool_id:'C3_PHYSIQUE_GOAL'})}}/> SHOW 1.618 POPULAR REFERENCE</label><PrivacyStrip ruleset={LAB_RULESETS.C3}/></div>
    <ResultContract {...result}>{phi&&<div className="popular-reference"><b>POPULAR REFERENCE 1.618</b><p>1.618 เป็น reference ที่นิยมในสาย physique แต่ยังไม่มีหลักฐานว่าค่านี้คือ shoulder-to-waist ratio ที่ดีที่สุดสำหรับทุกคน</p></div>}</ResultContract></div></>;
}

export function VTaperTool(){
  const[s,setS]=useLabMeasurement('shoulder','118'),[w,setW]=useLabMeasurement('waist','82'); const x=computeVTaper(s,w);
  const result=x?{result:`ไหล่ของคุณประมาณ ${x.ratio}× เอว`,metric:`V-Taper Ratio ${x.ratio}`,meaning:`Shoulder circumference ของคุณประมาณ ${x.ratio} เท่าของ waist ในวิธีวัดนี้`,use:'ใช้ track proportion ของตัวเอง หรือเปิด C3 เพื่อดูว่า ratio เปลี่ยนได้จากทางไหนบ้าง',watch:'นี่ไม่ใช่ attractiveness score และ 1.618 ไม่ใช่ scientific optimum',nextHref:'/lab/physique-goal',nextLabel:'ลองเป้าหมาย V-shape',resultCode:'Q1_VTAPER_RATIO'}:null;
  return <QuickShell id="Q1_VTAPER" technicalName="V-Taper Snapshot" title="หุ่น V ของคุณตอนนี้เท่าไหร่?" question="วัดไหล่กับเอว แล้วดู proportion ปัจจุบันก่อนคิดเรื่องเป้าหมาย" ruleset={LAB_RULESETS.Q1} result={result}><InputGrid><Field label="SHOULDER" unit="cm" value={s} onChange={setS} why={why.shoulder} guide={guides.shoulder[0]} mistake={guides.shoulder[1]}/><Field label="WAIST @ NAVEL" unit="cm" value={w} onChange={setW} why={why.waist} guide={guides.waist[0]} mistake={guides.waist[1]}/></InputGrid></QuickShell>;
}

export function FFMITool(){
  const[h,setH]=useLabMeasurement('height','178'),[w,setW]=useLabMeasurement('weight','85'),[bf,setBf]=useLabMeasurement('bodyFat','18'); const x=computeFFMI(h,w,bf);
  const result=x?{result:`Fat-free mass ที่ปรับตามส่วนสูง = ${x.ffmi}`,metric:`FFMI ${x.ffmi} · FFM estimate ${x.ffm} kg`,meaning:`หลังหัก fat mass ตาม body-fat estimate แล้ว คุณมี fat-free mass เท่าไรเมื่อปรับตามส่วนสูง`,use:'เหมาะที่สุดกับการ track ตัวเองตามเวลา โดยใช้วิธีประเมิน body fat ที่ใกล้เคียงเดิม',watch:'ถ้า body-fat estimate ผิด FFMI ก็เปลี่ยนตาม. FFMI ไม่ใช่ genetic ceiling และ 25 ไม่ใช่กฎธรรมชาติที่ห้ามเกิน',nextHref:'/lab/physique-goal',nextLabel:'สำรวจเป้าหมายรูปร่าง',resultCode:'Q2_FFMI'}:null;
  return <QuickShell id="Q2_FFMI" technicalName="FFMI Snapshot" title="คุณมีกล้ามมากแค่ไหนเมื่อเทียบกับส่วนสูง?" question="ใช้ fat-free mass ที่ปรับตามส่วนสูงเพื่อ track ตัวเอง ไม่ใช่ตัดสิน genetic ceiling" ruleset={LAB_RULESETS.Q2} result={result}><InputGrid><Field label="HEIGHT" unit="cm" value={h} onChange={setH} why={why.height} guide={guides.height[0]} mistake={guides.height[1]}/><Field label="WEIGHT" unit="kg" value={w} onChange={setW} why={why.weight} guide={guides.weight[0]} mistake={guides.weight[1]}/><Field label="BODY FAT ESTIMATE" unit="%" value={bf} onChange={setBf} why={why.bodyfat} guide={guides.bodyfat[0]} mistake={guides.bodyfat[1]}/></InputGrid></QuickShell>;
}

function KneeToWallVisual(){return <div className="ankle-test-viz" aria-label="Knee-to-wall test illustration"><div className="wall"/><div className="floor"/><div className="foot"/><div className="shin"/><div className="knee"/><p>ส้นติดพื้น → ดันเข่าแตะผนัง → เลื่อนเท้าออกจนได้ระยะไกลสุดที่ทำซ้ำได้</p><small>WALL TEST / SAME LANDMARK BOTH SIDES</small></div>}

export function KneeToWallTool(){
  const[l,setL]=useLabMeasurement('kneeWallLeft','9.5'),[r,setR]=useLabMeasurement('kneeWallRight','6.5'); const x=computeKneeToWall(l,r);
  const headline = x ? (x.lowerSide==='เท่ากัน' ? 'ซ้ายและขวาได้ระยะเท่ากันในการทดสอบนี้' : `${x.lowerSide}เดินหน้าได้น้อยกว่าอีกข้าง ${x.difference} cm`) : '';
  const result=x?{result:headline,metric:`Knee-to-Wall: ซ้าย ${x.left} cm · ขวา ${x.right} cm · Mean ${x.mean} cm`,meaning:`${x.lowerSide==='เท่ากัน'?'สองข้างได้ระยะเท่ากัน':'ด้าน'+x.lowerSide+'ยอมให้เข่าเดินหน้าแบบ weight-bearing ได้น้อยกว่าอีกข้าง'} ใน protocol นี้ คำทางเทคนิคคือ ankle dorsiflexion`,use:'ถ้า Squat แล้วรู้สึกติดหรือจำเป็นต้องก้มตัวมาก ข้อเท้าอาจเป็นหนึ่งใน context ที่ควรทดสอบต่อ เปิด C2 แล้วเทียบ Flat vs Heel Elevated โดยไม่สรุปว่าข้อเท้าเป็นสาเหตุแน่นอน',watch:'ค่านี้ไม่ใช่การวินิจฉัย ankle restriction หรือ injury. ถ้าค่าเปลี่ยนเพียงเล็กน้อยประมาณ 1 cm อาจยังเป็น measurement noise ได้ ควรวัด protocol เดิมและดูแนวโน้ม. ถ้ามี pain, swelling หรืออาการผิดปกติ อย่าใช้ Tool นี้แทนการประเมินทางคลินิก',nextHref:'/lab/squat-geometry',nextLabel:'ลองผลกับ Squat ของฉัน',resultCode:'Q3_KNEE_TO_WALL'}:null;
  return <><ToolHeader id="Q3_KNEE_TO_WALL" role="QUICK" technicalName="Knee-to-Wall Ankle Mobility Check" title="เข่าคุณเดินหน้าได้แค่ไหน?" question="ข้อเท้ามีผลต่อการที่เข่าเดินหน้าและลำตัวจัดตำแหน่งตอน Squat ใช้ผนัง + ไม้บรรทัด ทดสอบซ้าย/ขวาได้ในประมาณ 30–60 วินาที"/><div className="lab-workbench"><div><KneeToWallVisual/><InputGrid><Field label="LEFT" unit="cm" value={l} onChange={v=>{setL(v);trackLabEvent('q3_test_side_completed',{side:'left'})}} why={why.kneeWall} guide={guides.kneeWall[0]} mistake={guides.kneeWall[1]}/><Field label="RIGHT" unit="cm" value={r} onChange={v=>{setR(v);trackLabEvent('q3_test_side_completed',{side:'right'})}} why={why.kneeWall} guide={guides.kneeWall[0]} mistake={guides.kneeWall[1]}/></InputGrid><MeasurementCheckNote/><PrivacyStrip ruleset={LAB_RULESETS.Q3}/></div><ResultContract {...result}>{result&&<ShareResult title="MY KNEE-TO-WALL" text={`${result.result}. ${result.metric}`}/>}</ResultContract></div></>;
}

export function ApeIndexTool(){
  const[h,setH]=useLabMeasurement('height','178'),[a,setA]=useLabMeasurement('armSpan','184'); const x=computeApeIndex(h,a);
  const result=x?{result:`แขนกางของคุณ${x.diff>=0?'ยาวกว่า':'สั้นกว่า'}ส่วนสูง ${Math.abs(x.diff)} cm`,metric:`Ape Index ${x.diff>=0?'+':''}${x.diff} cm · ${x.ratio}×`,meaning:`ปลายนิ้วถึงปลายนิ้วของคุณ${x.diff>=0?'ยาวกว่า':'สั้นกว่า'}ส่วนสูงประมาณ ${Math.abs(x.diff)} cm`,use:'ใช้เป็น reach context เวลาเข้า C1 เพื่อดูว่าระยะของแขนอาจเปลี่ยน ROM / setup ของ movement ยังไง',watch:'Ape Index ไม่ได้ทำนายว่าคุณจะเก่ง Deadlift, Bench, Climbing หรือกีฬาใดแน่นอน',nextHref:'/lab/exercise-fit',nextLabel:'ดูว่ามีผลกับท่ายังไง',resultCode:'Q4_APE_INDEX'}:null;
  return <QuickShell id="Q4_APE_INDEX" technicalName="Ape Index" title="แขนคุณยาวแค่ไหนเมื่อเทียบกับตัว?" question="วัดช่วงแขนกับส่วนสูงก่อน แล้วค่อยดูคำว่า Ape Index ทีหลัง" ruleset={LAB_RULESETS.Q4} result={result}><InputGrid><Field label="HEIGHT" unit="cm" value={h} onChange={setH} why={why.height} guide={guides.height[0]} mistake={guides.height[1]}/><Field label="ARM SPAN" unit="cm" value={a} onChange={setA} why={why.arm} guide={guides.arm[0]} mistake={guides.arm[1]}/></InputGrid></QuickShell>;
}

export function FemurTibiaTool(){
  const[f,setF]=useLabMeasurement('femur','47'),[t,setT]=useLabMeasurement('tibia','39'); const x=computeFemurTibia(f,t);
  const result=x?{result:`ต้นขาของคุณ${x.percent>=0?'ยาวกว่า':'สั้นกว่า'}หน้าแข้งประมาณ ${Math.abs(x.percent)}%`,metric:`Femur:Tibia ${x.ratio} · ${x.percent>=0?'+':''}${x.percent}%`,meaning:`Femur (กระดูกต้นขา) ของคุณ${x.percent>=0?'ยาวกว่า':'สั้นกว่า'} Tibia (กระดูกหน้าแข้ง) ประมาณ ${Math.abs(x.percent)}% ในการวัดนี้`,use:'เปิด C2 แล้วลอง knee travel / heel elevation / squat variant เพื่อดูผลใน schematic model',watch:'Ratio นี้อย่างเดียวไม่สามารถบอกว่าคุณควร Front หรือ Back Squat และค่าจากสายวัดเป็น segment estimate',nextHref:'/lab/squat-geometry',nextLabel:'ลอง Squat Geometry',resultCode:'Q5_FEMUR_TIBIA'}:null;
  return <QuickShell id="Q5_FEMUR_TIBIA" technicalName="Femur:Tibia Snapshot" title="ต้นขาคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง?" question="วัดสองช่วงของขา แล้วดูว่า geometry นี้ไปเปลี่ยน squat อย่างไรต่อ" ruleset={LAB_RULESETS.Q5} result={result}><InputGrid><Field label="FEMUR SEGMENT" unit="cm" value={f} onChange={setF} why={why.femur} guide={guides.femur[0]} mistake={guides.femur[1]}/><Field label="TIBIA SEGMENT" unit="cm" value={t} onChange={setT} why={why.tibia} guide={guides.tibia[0]} mistake={guides.tibia[1]}/></InputGrid></QuickShell>;
}

function QuickShell({id,title,technicalName,question,ruleset,result,children}){return <><ToolHeader id={id} role="QUICK" title={title} technicalName={technicalName} question={question}/><div className="lab-workbench"><div>{children}<MeasurementCheckNote/><PrivacyStrip ruleset={ruleset}/></div><ResultContract {...result}>{result&&<ShareResult title={title} text={`${result.result} — ${result.meaning}`}/>}</ResultContract></div></>}
