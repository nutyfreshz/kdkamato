import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';

export const metadata = { title: 'KDKAMATO LAB', description: 'Interactive fitness and body-structure tools that turn your own measurements into useful context with deterministic rules.' };

const training = [
  { id:'C1', technical:'Exercise Fit Explorer', title:'ท่าไหนเข้ากับโครงคุณ?', promise:'วัดสัดส่วนแขน ขา และลำตัว แล้วดูว่าทำไม Squat, Bench และ Deadlift ของคุณถึงรู้สึกต่างจากคนอื่น พร้อมสิ่งที่ควรลองปรับก่อน', need:'ส่วนสูง · ช่วงแขน · ช่วงขา · ลำตัว', get:'movement context + setup ที่ควรลองเทียบ', time:'~60–90 sec', href:'/lab/exercise-fit' },
  { id:'C2', technical:'Squat Geometry', title:'Squat แบบไหนเข้ากับขาคุณ?', promise:'เปลี่ยน Front / Back Squat, heel elevation และ knee travel แล้วดูทันทีว่า geometry ของคุณเปลี่ยนอย่างไร', need:'ช่วงต้นขา · หน้าแข้ง · ลำตัว', get:'setup scenario ที่ควรลองก่อน', time:'~60–90 sec', href:'/lab/squat-geometry' },
  { id:'Q3', technical:'Knee-to-Wall', title:'เข่าคุณเดินหน้าได้แค่ไหน?', promise:'ใช้ผนังและไม้บรรทัดเทียบซ้าย/ขวา แล้วดูว่าข้อเท้าอาจเป็นหนึ่งใน context ของ squat หรือไม่', need:'ผนัง · ไม้บรรทัด · 2 ข้าง', get:'weight-bearing knee-travel context', time:'~30–60 sec', href:'/lab/knee-to-wall' },
  { id:'Q4', technical:'Ape Index', title:'แขนคุณยาวแค่ไหนเมื่อเทียบกับตัว?', promise:'เทียบช่วงแขนกับส่วนสูง แล้วใช้เป็น reach context สำหรับ Bench / Deadlift และ movement setup', need:'ส่วนสูง · ช่วงแขน', get:'reach context', time:'~20–40 sec', href:'/lab/ape-index' },
  { id:'Q5', technical:'Femur:Tibia', title:'ต้นขาคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง?', promise:'เทียบช่วงต้นขากับหน้าแข้ง แล้วต่อเข้า Squat Geometry เพื่อดูผลกับตำแหน่ง', need:'ช่วงต้นขา · หน้าแข้ง', get:'leg-segment context', time:'~20–40 sec', href:'/lab/femur-tibia' }
];

const physique = [
  { id:'C3', technical:'Physique Goal Explorer', title:'อยาก V-shape ขึ้น ควรพัฒนาอะไร?', promise:'ใส่สัดส่วนปัจจุบัน แล้วลองดูว่าการเปลี่ยน upper body, waist หรือทั้งสองอย่างจะเปลี่ยน silhouette ยังไง', need:'รอบไหล่ · รอบเอว', get:'scenario + practical priority', time:'~45–60 sec', href:'/lab/physique-goal' },
  { id:'Q1', technical:'V-Taper Snapshot', title:'หุ่น V ของคุณตอนนี้เท่าไหร่?', promise:'ดู upper-body-to-waist proportion ปัจจุบันเป็นภาษาง่าย ก่อนเปิด scenario เป้าหมาย', need:'รอบไหล่ · รอบเอว', get:'current proportion context', time:'~20–40 sec', href:'/lab/v-taper' },
  { id:'Q2', technical:'FFMI Snapshot', title:'คุณมีกล้ามมากแค่ไหนเมื่อเทียบกับส่วนสูง?', promise:'คำนวณ fat-free mass ที่ปรับตามส่วนสูงเพื่อ track ตัวเอง โดยไม่ใช้เป็น genetic ceiling', need:'ส่วนสูง · น้ำหนัก · body-fat estimate', get:'FFMI tracking context', time:'~20–40 sec', href:'/lab/ffmi' }
];

function Cards({ items }) {
  return <div className="lab-library lab-question-grid">{items.map((tool)=><Link key={tool.id} href={tool.href}>
    <span>{tool.id} · {tool.technical}</span><h2>{tool.title}</h2><p>{tool.promise}</p>
    <div className="lab-card-facts"><small><b>What I need:</b> {tool.need}</small><small><b>What I get:</b> {tool.get}</small><small><b>Time:</b> {tool.time}</small></div>
    <strong>เริ่มลอง →</strong>
  </Link>)}</div>;
}

export default function LabPage() {
  return <><SiteHeader/><main className="listing-page shell lab-page">
    <p className="eyebrow cyan">KDKAMATO LAB / DETERMINISTIC</p>
    <h1>มีคำถามอะไร<br/>เกี่ยวกับตัวคุณ?</h1>
    <p className="listing-intro">เลือกจากคำถามที่คุณอยากรู้ก่อน ไม่ต้องรู้ศัพท์ biomechanics หรือชื่อ metric มาก่อน ผลจะบอกทั้งความหมาย สิ่งที่ใช้ต่อได้ และสิ่งที่ไม่ควรตีความเกินไป</p>
    <section className="lab-intent-section"><p className="eyebrow cyan">อยากรู้เรื่องการฝึก</p><Cards items={training}/></section>
    <section className="lab-intent-section"><p className="eyebrow orange">อยากรู้เรื่องรูปร่าง</p><Cards items={physique}/></section>
    <div className="tool-warning" style={{marginTop:72}}><strong>LAB RULE</strong><p>Direct measurement ≠ prediction. Geometry ≠ diagnosis. A tendency ≠ individual guarantee. ไม่มี live AI interpretation และ raw body measurements ไม่ถูกส่งเข้า analytics โดย default.</p></div>
    <style>{`.lab-intent-section{margin-top:72px}.lab-question-grid{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}.lab-question-grid>a{display:flex;flex-direction:column}.lab-question-grid h2{margin-top:28px}.lab-card-facts{display:grid;gap:6px;margin:14px 0 24px;color:#899295}.lab-card-facts small{line-height:1.45}.lab-card-facts b{color:#c7ccce}.lab-question-grid strong{margin-top:auto;color:#48dce8;font-size:12px;letter-spacing:.08em}`}</style>
  </main></>;
}
