'use client';

import { computeFFMI, computeKneeToWall, computeVTaper, LAB_RULESETS } from '../../lib/lab';
import { useLabMeasurement } from '../../lib/labSession';
import { trackLabEvent } from '../../lib/labAnalytics';
import { MeasurementCheckNote, MeasurementField, PrivacyStrip, ResultContract, ShareResult, ToolHeader } from './LabUI';

function InputGrid({ children }) { return <div className="lab-input-grid">{children}</div>; }

function Field({ language='th', ...props }) {
  return <MeasurementField language={language} {...props} />;
}

function QuickShell({ id, title, technicalName, question, ruleset, result, children, language }) {
  return <>
    <ToolHeader language={language} id={id} role="QUICK" title={title} technicalName={technicalName} question={question}/>
    <div className="lab-workbench">
      <div>{children}<MeasurementCheckNote language={language}/><PrivacyStrip language={language} ruleset={ruleset}/></div>
      <ResultContract language={language} {...result}>{result && <ShareResult language={language} title={title} text={`${result.result} — ${result.meaning}`}/>}</ResultContract>
    </div>
  </>;
}

export function VTaperTool({ language='th' }) {
  const [s,setS]=useLabMeasurement('shoulder','118');
  const [w,setW]=useLabMeasurement('waist','82');
  const x=computeVTaper(s,w);
  const th=language!=='en';
  const result=x ? {
    result: th ? `รอบไหล่ประมาณ ${x.ratio} เท่าของรอบเอว` : `Shoulder circumference is about ${x.ratio}× waist circumference`,
    metric:`V-Taper Ratio ${x.ratio}`,
    meaning: th ? `จากวิธีวัดนี้ รอบไหล่ของคุณมีค่าประมาณ ${x.ratio} เท่าของรอบเอว` : `With this measurement method, your shoulder circumference is about ${x.ratio} times your waist circumference.`,
    use: th ? "ใช้ติดตามสัดส่วนของตัวเอง หรือเปิดแบบจำลองสัดส่วนไหล่ต่อเอว (C3) เพื่อดูผลจากการเปลี่ยนแต่ละค่า" : 'Use it to track your own proportion over time, or open C3 to see different ways the ratio can change.',
    watch: th ? "อัตราส่วนนี้ใช้ดูสัดส่วนเท่านั้น ไม่ใช่คะแนนความน่าดึงดูด และยังไม่มีหลักฐานว่า 1.618 เหมาะที่สุดสำหรับทุกคน" : 'This is not an attractiveness score, and 1.618 is not a scientifically proven optimum for everyone.',
    nextHref:'/lab/physique-goal',
    nextLabel: th ? "ลองจำลองสัดส่วนไหล่ต่อเอว" : 'EXPLORE V-SHAPE GOALS',
    resultCode:'Q1_VTAPER_RATIO'
  } : null;

  return <QuickShell
    language={language}
    id="Q1_VTAPER"
    technicalName="V-Taper Snapshot"
    title={th ? "สัดส่วนไหล่ต่อเอวของคุณเป็นเท่าไร?" : 'What is your current V-taper proportion?'}
    question={th ? "วัดรอบไหล่กับเอวเพื่อดูสัดส่วนปัจจุบัน ก่อนลองตั้งค่าในแบบจำลอง" : 'Measure shoulder and waist circumference to see your current proportion before exploring targets.'}
    ruleset={LAB_RULESETS.Q1}
    result={result}
  >
    <InputGrid>
      <Field language={language} label={th?'รอบไหล่':'SHOULDER'} unit="cm" value={s} onChange={setS}/>
      <Field language={language} label={th?'รอบเอวระดับสะดือ':'WAIST @ NAVEL'} unit="cm" value={w} onChange={setW}/>
    </InputGrid>
  </QuickShell>;
}

export function FFMITool({ language='th' }) {
  const [h,setH]=useLabMeasurement('height','178');
  const [w,setW]=useLabMeasurement('weight','85');
  const [bf,setBf]=useLabMeasurement('bodyFat','18');
  const x=computeFFMI(h,w,bf);
  const th=language!=='en';
  const result=x ? {
    result:`FFMI ${x.ffmi}`,
    metric:`FFMI ${x.ffmi} · ${th ? 'มวลไร้ไขมันโดยประมาณ' : 'Estimated FFM'} ${x.ffm} ${th ? 'กก.' : 'kg'}`,
    meaning: th ? "ระบบใช้เปอร์เซ็นต์ไขมันที่กรอกประมาณมวลไร้ไขมัน แล้วคำนวณเทียบกับส่วนสูง เพื่อให้ติดตามตัวเองได้ง่ายขึ้น" : 'After subtracting estimated fat mass from your body weight, FFMI adjusts the estimated fat-free mass for height.',
    use: th ? "ใช้ติดตามตัวเองโดยประเมินเปอร์เซ็นต์ไขมันด้วยวิธีเดิมหรือใกล้เคียงเดิม" : 'Best used for self-tracking over time while keeping the body-fat estimation method similar.',
    watch: th ? "เปอร์เซ็นต์ไขมันที่คลาดเคลื่อนทำให้ FFMI เปลี่ยนตาม ค่านี้ไม่ได้บอกขีดจำกัดทางพันธุกรรม และ 25 ไม่ใช่เพดานตายตัว" : 'If body-fat estimate is off, FFMI changes with it. FFMI is not a genetic ceiling, and 25 is not a natural law that cannot be exceeded.',
    nextHref:'/lab/physique-goal',
    nextLabel: th ? 'สำรวจเป้าหมายรูปร่าง' : 'EXPLORE PHYSIQUE GOALS',
    resultCode:'Q2_FFMI'
  } : null;

  return <QuickShell
    language={language}
    id="Q2_FFMI"
    technicalName="FFMI Snapshot"
    title={th ? "มวลไร้ไขมันเทียบกับส่วนสูงของคุณเป็นเท่าไร?" : 'How much fat-free mass do you carry for your height?'}
    question={th ? "ใช้ FFMI ติดตามการเปลี่ยนแปลงของตัวเอง ค่านี้ไม่ได้บอกขีดจำกัดทางพันธุกรรม" : 'Use FFMI for self-tracking over time, not as a genetic ceiling.'}
    ruleset={LAB_RULESETS.Q2}
    result={result}
  >
    <InputGrid>
      <Field language={language} label={th?'ส่วนสูง':'HEIGHT'} unit="cm" value={h} onChange={setH}/>
      <Field language={language} label={th?'น้ำหนัก':'WEIGHT'} unit="kg" value={w} onChange={setW}/>
      <Field language={language} label={th?'เปอร์เซ็นต์ไขมันโดยประมาณ':'BODY FAT ESTIMATE'} unit="%" value={bf} onChange={setBf}/>
    </InputGrid>
  </QuickShell>;
}

export function KneeToWallTool({ language='th' }) {
  const [l,setL]=useLabMeasurement('kneeWallLeft','9.5');
  const [r,setR]=useLabMeasurement('kneeWallRight','6.5');
  const x=computeKneeToWall(l,r);
  const th=language!=='en';
  const sideTh=x?.lowerSideKey==='left'?'ซ้าย':x?.lowerSideKey==='right'?'ขวา':'เท่ากัน';
  const sideEn=x?.lowerSideKey==='left'?'left':x?.lowerSideKey==='right'?'right':'equal';
  const headline=x ? (x.lowerSideKey==='equal'
    ? (th?'ซ้ายและขวาได้ระยะเท่ากันในการทดสอบนี้':'Left and right reached the same distance in this test')
    : (th?`${sideTh}เดินหน้าได้น้อยกว่าอีกข้าง ${x.difference} ซม.`:`The ${sideEn} side reached ${x.difference} cm less than the other side`)) : '';
  const meaningTh=x?.lowerSideKey==='equal'
    ? "ทั้งสองข้างได้ระยะเท่ากันในการทดสอบนี้ เป็นการวัดการเคลื่อนไหวข้อเท้าขณะดันเข่าไปข้างหน้าโดยส้นยังติดพื้น"
    : `ด้าน${sideTh}ดันเข่าไปข้างหน้าได้น้อยกว่าอีกข้าง เป็นการวัดการเคลื่อนไหวข้อเท้าขณะส้นยังติดพื้น`;
  const result=x ? {
    result:headline,
    metric:`Knee-to-Wall: ${th?'ซ้าย':'L'} ${x.left} ${th?'ซม.':'cm'} · ${th?'ขวา':'R'} ${x.right} ${th?'ซม.':'cm'}`,
    meaning: th ? meaningTh : `${x.lowerSideKey==='equal'?'Both sides reached the same distance':`The ${sideEn} side allowed less forward knee travel`} in this weight-bearing test. The relevant technical term is ankle dorsiflexion.`,
    use: th ? "หากสควอตแล้วรู้สึกติดหรือต้องก้มมาก ลองใช้เครื่องมือ C2 เปรียบเทียบพื้นราบกับการยกส้น ข้อเท้าอาจเกี่ยวข้อง แต่ยังสรุปสาเหตุจากค่านี้อย่างเดียวไม่ได้" : 'If Squat feels restricted or requires more forward torso lean, ankle motion may be one factor worth testing. Open C2 and compare flat versus heel-elevated setups without assuming the ankle is definitely the cause.',
    watch: th ? "ผลนี้ใช้เปรียบเทียบการเคลื่อนไหว ไม่ได้วินิจฉัยข้อเท้าติดหรือการบาดเจ็บ ความต่างเล็กน้อยอาจมาจากการวัด หากปวด บวม หรือมีอาการผิดปกติ ควรรับการประเมินจากผู้เชี่ยวชาญ" : 'This does not diagnose an ankle restriction or injury. Small differences may be measurement noise. If you have pain, swelling, or abnormal symptoms, do not use this tool as a substitute for clinical assessment.',
    nextHref:'/lab/squat-geometry',
    nextLabel: th ? 'ลองผลกับท่า Squat ของฉัน' : 'TEST IT IN SQUAT GEOMETRY',
    resultCode:'Q3_KNEE_TO_WALL'
  } : null;

  return <>
    <ToolHeader
      language={language}
      id="Q3_KNEE_TO_WALL"
      role="QUICK"
      technicalName="Knee-to-Wall Ankle Mobility Check"
      title={th?"เข่าเคลื่อนไปข้างหน้าได้แค่ไหน?":'How far can your knee travel forward?'}
      question={th?"ใช้ผนังและไม้บรรทัดวัดทั้งสองข้าง เพื่อดูว่าการเคลื่อนไหวข้อเท้าอาจเกี่ยวข้องกับท่าสควอตของคุณหรือไม่":'Use a wall and ruler to compare left and right, and see whether ankle motion may be one useful piece of Squat context.'}
    />
    <div className="lab-workbench">
      <div>
        <InputGrid>
          <Field language={language} label={th?'ซ้าย':'LEFT'} unit="cm" value={l} onChange={v=>{setL(v);trackLabEvent('q3_test_side_completed',{side:'left'})}}/>
          <Field language={language} label={th?'ขวา':'RIGHT'} unit="cm" value={r} onChange={v=>{setR(v);trackLabEvent('q3_test_side_completed',{side:'right'})}}/>
        </InputGrid>
        <MeasurementCheckNote language={language}/><PrivacyStrip language={language} ruleset={LAB_RULESETS.Q3}/>
      </div>
      <ResultContract language={language} {...result}>{result&&<ShareResult language={language} title="KNEE-TO-WALL" text={`${result.result}. ${result.metric}`}/>}</ResultContract>
    </div>
  </>;
}
