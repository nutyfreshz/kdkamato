import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';

export const metadata = { title: 'KDKAMATO LAB', description: 'Interactive fitness and body-structure tools with deterministic calculations and clear scientific boundaries.' };

const core = [
  ['C1','EXERCISE FIT EXPLORER','/lab/exercise-fit','แปล body proportions เป็น movement context แล้วบอกว่าควรลองเทียบ setup อะไรก่อน'],
  ['C2','SQUAT GEOMETRY','/lab/squat-geometry','เทียบ heel, stance, knee travel และ Front / High-Bar / Low-Bar แบบ interactive'],
  ['C3','PHYSIQUE GOAL','/lab/physique-goal','เปลี่ยนเป้าหมาย V-shape ให้เป็น scenario ที่วัดและเปรียบเทียบได้']
];
const quick = [
  ['Q1','V-TAPER SNAPSHOT','/lab/v-taper','Shoulder ÷ Waist พร้อมความหมายและข้อจำกัด'],
  ['Q2','FFMI SNAPSHOT','/lab/ffmi','Height-normalized fat-free mass สำหรับ track ตัวเอง'],
  ['Q3','FRAME SNAPSHOT','/lab/frame-analysis','Wrist / ankle frame markers โดยไม่ invent genetic score'],
  ['Q4','APE INDEX','/lab/ape-index','Arm span เทียบส่วนสูง เพื่อใช้เป็น reach context'],
  ['Q5','FEMUR:TIBIA','/lab/femur-tibia','Leg segment relationship แล้วต่อเข้า Squat Geometry']
];

function Cards({ items }) { return <div className="lab-library" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>{items.map(([id,title,href,desc])=><Link key={id} href={href}><span>{id}</span><h2>{title}</h2><p>{desc}</p><b>OPEN →</b></Link>)}</div>; }

export default function LabPage() {
  return <><SiteHeader/><main className="listing-page shell lab-page">
    <p className="eyebrow cyan">KDKAMATO LAB / DETERMINISTIC</p>
    <h1>TEST YOURSELF.<br/>UNDERSTAND WHY.</h1>
    <p className="listing-intro">ไม่ใช่แค่ใส่เลขแล้วได้เลข ทุก tool ต้องบอกว่า “ค่านี้คืออะไร → สื่ออะไร → ใช้ทำอะไร → ระวังตีความอะไรเกินไป” โดยไม่มี AI ตีความข้อมูลร่างกายแบบ live.</p>
    <section style={{marginTop:72}}><p className="eyebrow cyan">CORE / DEEP INTERACTIVE</p><Cards items={core}/></section>
    <section style={{marginTop:72}}><p className="eyebrow cyan">QUICK / 20–40 SECOND SNAPSHOTS</p><Cards items={quick}/></section>
    <div className="tool-warning" style={{marginTop:72}}><strong>LAB RULE</strong><p>Direct measurement ≠ prediction. Geometry ≠ diagnosis. A tendency ≠ individual guarantee.</p></div>
  </main></>;
}
