import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import { getLanguage } from '../../lib/language';

export const metadata = { title: 'KDKAMATO LAB', description: 'Interactive fitness and body-structure tools with deterministic calculations and clear interpretation.' };

const tools = {
  th: {
    training: [
      { id:'C1', technical:'Exercise Fit Explorer', title:'ทำไมบางท่ารู้สึกไม่เข้ากับโครงคุณ?', promise:'วัดช่วงแขน ขา และลำตัว แล้วดูว่าสัดส่วนเหล่านี้อาจเปลี่ยนตำแหน่งและช่วงการเคลื่อนไหวใน Squat, Bench Press และ Deadlift อย่างไร พร้อมสิ่งที่ควรลองปรับก่อน', need:'ส่วนสูง · ช่วงแขน · ช่วงขา · ลำตัว', get:'สิ่งที่โครงสร้างอาจเปลี่ยน + การจัดท่าที่ควรลองเทียบ', time:'ประมาณ 60–90 วินาที', href:'/lab/exercise-fit' },
      { id:'C2', technical:'Squat Geometry', title:'Squat แบบไหนควรลองก่อน?', promise:'ลองเปลี่ยน Front / Back Squat การยกส้น ความกว้างเท้า และการเดินหน้าของเข่า แล้วดูว่าตำแหน่งของร่างกายเปลี่ยนอย่างไร', need:'ช่วงต้นขา · หน้าแข้ง · ลำตัว', get:'รูปแบบการจัดท่าที่ควรลองเปรียบเทียบ', time:'ประมาณ 60–90 วินาที', href:'/lab/squat-geometry' },
      { id:'Q3', technical:'Knee-to-Wall', title:'เข่าคุณเดินหน้าได้แค่ไหน?', promise:'ใช้ผนังและไม้บรรทัดเทียบซ้ายกับขวา เพื่อดูว่าการเคลื่อนไหวของข้อเท้าอาจเป็นหนึ่งในปัจจัยที่มีผลต่อ Squat หรือไม่', need:'ผนัง · ไม้บรรทัด · วัดทั้ง 2 ข้าง', get:'ข้อมูลประกอบเรื่องการเดินหน้าของเข่าและข้อเท้า', time:'ประมาณ 30–60 วินาที', href:'/lab/knee-to-wall' },
      { id:'Q4', technical:'Ape Index', title:'แขนคุณยาวแค่ไหนเมื่อเทียบกับส่วนสูง?', promise:'เทียบช่วงแขนกับส่วนสูง เพื่อดูระยะเอื้อม (reach) ที่อาจเปลี่ยนช่วงการเคลื่อนไหวและการจัดท่าใน Bench Press หรือ Deadlift', need:'ส่วนสูง · ช่วงแขน', get:'ระยะเอื้อมของคุณเมื่อเทียบกับส่วนสูง', time:'ประมาณ 20–40 วินาที', href:'/lab/ape-index' },
      { id:'Q5', technical:'Femur:Tibia', title:'ต้นขาคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง?', promise:'เทียบช่วงต้นขากับหน้าแข้ง แล้วดูว่าความสัมพันธ์นี้อาจเปลี่ยนตำแหน่งสะโพก เข่า และลำตัวเวลา Squat อย่างไร', need:'ช่วงต้นขา · หน้าแข้ง', get:'สัดส่วนช่วงขา + ทางไปทดลองต่อใน Squat Geometry', time:'ประมาณ 20–40 วินาที', href:'/lab/femur-tibia' }
    ],
    physique: [
      { id:'C3', technical:'Physique Goal Explorer', title:'อยากให้หุ่นดู V ขึ้น ควรพัฒนาอะไร?', promise:'ใส่รอบไหล่และรอบเอวปัจจุบัน แล้วลองดูว่าการเปลี่ยนช่วงบน เอว หรือทั้งสองด้านจะเปลี่ยนสัดส่วนที่มองเห็นอย่างไร', need:'รอบไหล่ · รอบเอว', get:'ทางเลือกเชิงตัวเลข + จุดที่ควรให้ความสำคัญ', time:'ประมาณ 45–60 วินาที', href:'/lab/physique-goal' },
      { id:'Q1', technical:'V-Taper Snapshot', title:'สัดส่วน V ของคุณตอนนี้เป็นอย่างไร?', promise:'ดูอัตราส่วนระหว่างรอบไหล่กับรอบเอวในปัจจุบัน ก่อนลองเป้าหมายหลายแบบ', need:'รอบไหล่ · รอบเอว', get:'สัดส่วนปัจจุบันและความหมาย', time:'ประมาณ 20–40 วินาที', href:'/lab/v-taper' },
      { id:'Q2', technical:'FFMI Snapshot', title:'มวลไร้ไขมันของคุณมากแค่ไหนเมื่อเทียบกับส่วนสูง?', promise:'คำนวณ FFMI จากส่วนสูง น้ำหนัก และเปอร์เซ็นต์ไขมัน เพื่อใช้ติดตามตัวเองตามเวลา ไม่ใช่ใช้ตัดสินขีดจำกัดทางพันธุกรรม', need:'ส่วนสูง · น้ำหนัก · เปอร์เซ็นต์ไขมันโดยประมาณ', get:'FFMI + ข้อจำกัดในการตีความ', time:'ประมาณ 20–40 วินาที', href:'/lab/ffmi' }
    ]
  },
  en: {
    training: [
      { id:'C1', technical:'Exercise Fit Explorer', title:'Why do some exercises feel awkward for your structure?', promise:'Use arm, leg, and torso measurements to see how body proportions can change position and range of motion in Squat, Bench Press, and Deadlift, plus what to test first.', need:'Height · arm span · leg segments · torso', get:'Mechanical context + setups worth comparing', time:'~60–90 sec', href:'/lab/exercise-fit' },
      { id:'C2', technical:'Squat Geometry', title:'Which Squat setup is worth testing first?', promise:'Change Front / Back Squat, heel elevation, stance, and knee travel to see how the modeled position changes.', need:'Femur · tibia · torso', get:'Setup scenarios worth comparing', time:'~60–90 sec', href:'/lab/squat-geometry' },
      { id:'Q3', technical:'Knee-to-Wall', title:'How far can your knee travel forward?', promise:'Compare left and right using a wall and ruler to see whether ankle motion may be one useful piece of Squat context.', need:'Wall · ruler · both sides', get:'Weight-bearing ankle and knee-travel context', time:'~30–60 sec', href:'/lab/knee-to-wall' },
      { id:'Q4', technical:'Ape Index', title:'How long are your arms relative to your height?', promise:'Compare arm span with height and use the result as reach context for Bench Press, Deadlift, and movement setup.', need:'Height · arm span', get:'Reach relative to height', time:'~20–40 sec', href:'/lab/ape-index' },
      { id:'Q5', technical:'Femur:Tibia', title:'How long is your thigh relative to your lower leg?', promise:'Compare femur and tibia segments, then explore how the relationship can change hip, knee, and torso position in Squat.', need:'Femur · tibia', get:'Leg-segment context + next Squat experiment', time:'~20–40 sec', href:'/lab/femur-tibia' }
    ],
    physique: [
      { id:'C3', technical:'Physique Goal Explorer', title:'Want a stronger V-shape? What should change?', promise:'Enter current shoulder and waist measurements, then compare how changing the upper body, waist, or both affects the visible ratio.', need:'Shoulder circumference · waist circumference', get:'Scenario math + practical priority', time:'~45–60 sec', href:'/lab/physique-goal' },
      { id:'Q1', technical:'V-Taper Snapshot', title:'What is your current V-taper proportion?', promise:'See your current shoulder-to-waist ratio before exploring different target scenarios.', need:'Shoulder circumference · waist circumference', get:'Current proportion and meaning', time:'~20–40 sec', href:'/lab/v-taper' },
      { id:'Q2', technical:'FFMI Snapshot', title:'How much fat-free mass do you carry for your height?', promise:'Calculate FFMI from height, weight, and body-fat estimate for self-tracking, not as a genetic ceiling.', need:'Height · weight · body-fat estimate', get:'FFMI + interpretation limits', time:'~20–40 sec', href:'/lab/ffmi' }
    ]
  }
};

function Cards({ items, language }) {
  return <div className="lab-library lab-question-grid">{items.map((tool)=><Link key={tool.id} href={tool.href}>
    <span>{tool.id} · {tool.technical}</span><h2>{tool.title}</h2><p>{tool.promise}</p>
    <div className="lab-card-facts"><small><b>{language === 'en' ? 'What you need:' : 'ต้องใช้อะไร:'}</b> {tool.need}</small><small><b>{language === 'en' ? 'What you get:' : 'จะได้อะไร:'}</b> {tool.get}</small><small><b>{language === 'en' ? 'Time:' : 'เวลา:'}</b> {tool.time}</small></div>
    <strong>{language === 'en' ? 'TRY IT' : 'เริ่มลอง'} →</strong>
  </Link>)}</div>;
}

export default async function LabPage() {
  const language = await getLanguage();
  const content = tools[language] || tools.th;
  return <><SiteHeader language={language}/><main className="listing-page shell lab-page">
    <p className="eyebrow cyan">KDKAMATO LAB</p>
    <h1>{language === 'en' ? <>WHAT DO YOU WANT<br/>TO LEARN ABOUT YOURSELF?</> : <>คุณอยากรู้เรื่องอะไร<br/>เกี่ยวกับร่างกายของตัวเอง?</>}</h1>
    <p className="listing-intro">{language === 'en' ? 'Start with the question, not the metric. Each result explains what the number means, how you can use it, and what it cannot tell you.' : 'เริ่มจากคำถามก่อน ไม่ต้องรู้ชื่อค่าหรือศัพท์ชีวกลศาสตร์ (biomechanics) มาก่อน ทุกผลลัพธ์จะบอกให้ชัดว่า ค่านี้หมายถึงอะไร ใช้ต่ออย่างไร และอะไรที่ค่านี้บอกไม่ได้'}</p>
    <section className="lab-intent-section"><p className="eyebrow cyan">{language === 'en' ? 'TRAINING & MOVEMENT' : 'อยากเข้าใจการฝึกและการเคลื่อนไหว'}</p><Cards items={content.training} language={language}/></section>
    <section className="lab-intent-section"><p className="eyebrow orange">{language === 'en' ? 'PHYSIQUE & PROPORTION' : 'อยากเข้าใจรูปร่างและสัดส่วน'}</p><Cards items={content.physique} language={language}/></section>
    <div className="tool-warning" style={{marginTop:72}}><strong>{language === 'en' ? 'HOW TO READ LAB RESULTS' : 'วิธีอ่านผลจาก LAB'}</strong><p>{language === 'en' ? 'A measurement is context, not a prediction. A geometry model is not a diagnosis. A research-supported tendency is not an individual guarantee. LAB does not send your body measurements to AI for live interpretation, and raw measurements are not included in analytics by default.' : 'ค่าที่วัดได้เป็นข้อมูลประกอบ ไม่ใช่คำทำนาย แบบจำลองตำแหน่งร่างกายไม่ใช่การวินิจฉัย และแนวโน้มจากงานวิจัยไม่ได้รับประกันว่าจะเกิดกับทุกคน LAB ไม่มี AI ตีความค่าร่างกายของคุณ และโดยค่าเริ่มต้นจะไม่ส่งค่าที่กรอกไปเก็บในระบบวิเคราะห์การใช้งาน (Analytics)'}</p></div>
    <style>{`.lab-intent-section{margin-top:72px}.lab-question-grid{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}.lab-question-grid>a{display:flex;flex-direction:column}.lab-question-grid h2{margin-top:28px}.lab-card-facts{display:grid;gap:6px;margin:14px 0 24px;color:#899295}.lab-card-facts small{line-height:1.45}.lab-card-facts b{color:#c7ccce}.lab-question-grid strong{margin-top:auto;color:#48dce8;font-size:12px;letter-spacing:.08em}`}</style>
  </main></>;
}
