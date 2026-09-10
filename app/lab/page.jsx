import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import { getLanguage } from '../../lib/language';

export const metadata = {
  title: 'KDKAMATO LAB',
  description: 'Simple fitness and body-structure tools: measure once, reuse the result, and apply it to a clear question.'
};

const content = {
  th: {
    intro: 'เลือกจากคำถามที่อยากรู้ก่อน ไม่จำเป็นต้องทำทุกเครื่องมือ และไม่ต้องจำศัพท์เฉพาะทาง ค่าที่วัดแล้วจะถูกใช้ซ้ำใน LAB ที่เกี่ยวข้อง เพื่อไม่ต้องกรอกข้อมูลเดิมซ้ำ',
    coreTitle: 'เริ่มจาก 2 เครื่องมือหลัก',
    coreSub: 'เครื่องมือหลักต้องตอบคำถามว่า “ควรลองอะไรต่อ?” ได้จริง ไม่ใช่เพียงคำนวณตัวเลข',
    exploreTitle: 'Explore',
    exploreSub: 'ใช้เมื่ออยากลองสถานการณ์จำลองเพื่อทำความเข้าใจตัวเลขเพิ่มเติม เครื่องมือในส่วนนี้ไม่ใช่คำแนะนำ และจะไม่เปลี่ยน Program โดยอัตโนมัติ',
    quickTitle: 'Quick Checks',
    quickSub: 'ใช้เมื่อต้องการวัดค่าใดค่าหนึ่งแบบรวดเร็ว ไม่จำเป็นต้องทำก่อนเครื่องมือหลัก และค่าที่วัดได้จะถูกนำไปใช้ต่อในเครื่องมือหลักที่เกี่ยวข้อง',
    core: [
      {
        href:'/lab/exercise-fit', tag:'TRAINING',
        title:'ท่านี้ควรปรับอะไรให้เข้ากับโครงสร้างร่างกายของคุณ?',
        copy:'เลือก Squat, Bench Press หรือ Deadlift แล้วใช้สัดส่วนร่างกายของคุณช่วยจัดลำดับว่าท่าหรือทางเลือกใดควรนำไปทดลองเปรียบเทียบก่อน',
        result:'ผลลัพธ์: สิ่งที่ควรลองปรับหรือเปรียบเทียบ'
      },
      {
        href:'/lab/squat-geometry', tag:'SQUAT',
        title:'Squat setup แบบไหนควรลองก่อน?',
        copy:'เลือกท่า Squat ที่คุณใช้อยู่ แล้วระบบจะจัดลำดับการเปรียบเทียบ 2 แบบจากสัดส่วนช่วงขา ให้คุณทดลองทีละอย่าง แทนการปรับหลายจุดพร้อมกัน',
        result:'ผลลัพธ์: ลำดับการทดลอง setup ที่นำไปลองในยิมได้ทันที'
      }
    ],
    explore: [
      {
        href:'/lab/physique-goal', technical:'PHYSIQUE SCENARIO',
        title:'ถ้าไหล่หรือเอวเปลี่ยน สัดส่วน V (V-shape) จะเปลี่ยนไปแค่ไหน?',
        copy:'ลองสถานการณ์จำลองจากค่าปัจจุบันเพื่อดูผลเชิงสัดส่วนเท่านั้น ไม่ได้แนะนำว่าควรเพิ่มกล้ามเนื้อหรือลดรอบเอวกี่เซนติเมตร'
      }
    ],
    quick: [
      { href:'/lab/knee-to-wall', title:'เข่าของคุณเดินหน้าได้แค่ไหน?', technical:'Knee-to-Wall', copy:'วัดซ้ายและขวาเพื่อดูบริบทของข้อเท้าและการเคลื่อนที่ของเข่าไปข้างหน้า' },
      { href:'/lab/ape-index', title:'แขนยาวแค่ไหนเมื่อเทียบกับส่วนสูง?', technical:'Ape Index', copy:'วัดระยะเอื้อม (reach) อย่างเดียว แล้ว C1 จะนำค่าไปใช้กับ Bench Press หรือ Deadlift ต่อ' },
      { href:'/lab/femur-tibia', title:'ต้นขายาวแค่ไหนเมื่อเทียบกับหน้าแข้ง?', technical:'Femur:Tibia', copy:'วัดสัดส่วนช่วงขาอย่างเดียว แล้ว C1 หรือ C2 จะนำค่าไปใช้ต่อ' },
      { href:'/lab/v-taper', title:'สัดส่วนไหล่ต่อเอวของคุณตอนนี้เป็นเท่าไร?', technical:'V-Taper', copy:'ดูค่าปัจจุบัน แล้ว Explore สามารถนำค่าเดิมไปทำสถานการณ์จำลองต่อได้' },
      { href:'/lab/ffmi', title:'มวลไร้ไขมันของคุณมากแค่ไหนเมื่อเทียบกับส่วนสูง?', technical:'FFMI', copy:'ตัววัดสั้น ๆ สำหรับติดตามตัวเองตามเวลา' }
    ]
  },
  en: {
    intro: 'Start with the question you care about. You do not need to complete every tool or know biomechanics terms first. Measurements are reused across related LAB tools so you do not have to enter the same thing repeatedly.',
    coreTitle: 'Start with 2 main tools',
    coreSub: 'A main tool must answer “What should I try next?” rather than merely calculate a number.',
    exploreTitle: 'Explore',
    exploreSub: 'Use these for optional scenarios that help you understand a number. Explore tools are not prescriptions and do not automatically change your Program.',
    quickTitle: 'Quick Checks',
    quickSub: 'Use these only when you want one measurement quickly. They are optional, and saved session measurements are reused by related main tools.',
    core: [
      {
        href:'/lab/exercise-fit', tag:'TRAINING',
        title:'What should you try adjusting to fit this movement better?',
        copy:'Choose Squat, Bench Press, or Deadlift and use your proportions to prioritize which setup or alternative is worth comparing first.',
        result:'Get: a setup or comparison worth testing'
      },
      {
        href:'/lab/squat-geometry', tag:'SQUAT',
        title:'Which Squat setup should you test first?',
        copy:'Choose the Squat variant you use and get two prioritized setup comparisons from your leg proportions, changing one variable at a time.',
        result:'Get: an ordered setup trial you can take to the gym'
      }
    ],
    explore: [
      {
        href:'/lab/physique-goal', technical:'PHYSIQUE SCENARIO',
        title:'If shoulder or waist measurements changed, how would the V-ratio change?',
        copy:'Explore proportion scenarios from your current baseline. This does not prescribe how much muscle to gain or waist size to lose.'
      }
    ],
    quick: [
      { href:'/lab/knee-to-wall', title:'How far can your knee travel forward?', technical:'Knee-to-Wall', copy:'Measure left/right ankle and knee-travel context.' },
      { href:'/lab/ape-index', title:'How long are your arms relative to height?', technical:'Ape Index', copy:'Measure reach only. C1 can reuse it for Bench/Deadlift context.' },
      { href:'/lab/femur-tibia', title:'How long is your thigh relative to lower leg?', technical:'Femur:Tibia', copy:'Measure leg proportions only. C1/C2 can reuse them.' },
      { href:'/lab/v-taper', title:'What is your current shoulder-to-waist ratio?', technical:'V-Taper', copy:'See the current snapshot. Explore can reuse it for scenarios.' },
      { href:'/lab/ffmi', title:'How much fat-free mass do you carry for height?', technical:'FFMI', copy:'A quick metric for self-tracking over time.' }
    ]
  }
};

function CoreCards({ items, language }) {
  return <div className="lab-core-grid">{items.map((tool)=><Link key={tool.href} className="lab-core-card" href={tool.href}>
    <span>{tool.tag}</span>
    <h2>{tool.title}</h2>
    <p>{tool.copy}</p>
    <small>{tool.result}</small>
    <strong>{language === 'en' ? 'START' : 'เริ่มจากตรงนี้'} →</strong>
  </Link>)}</div>;
}

function CompactCards({ items, language, action }) {
  return <div className="lab-quick-grid">{items.map((tool)=><Link key={tool.href} className="lab-quick-card" href={tool.href}>
    <small>{tool.technical}</small>
    <h3>{tool.title}</h3>
    <p>{tool.copy}</p>
    <strong>{action ?? (language === 'en' ? 'OPEN' : 'เปิดดู')} →</strong>
  </Link>)}</div>;
}

export default async function LabPage() {
  const language = await getLanguage();
  const c = content[language] || content.th;

  return <><SiteHeader language={language}/><main className="listing-page shell lab-page">
    <p className="eyebrow cyan">KDKAMATO LAB</p>
    <h1>{language === 'en' ? <>WHAT DO YOU WANT<br/>TO UNDERSTAND?</> : <>คุณอยากรู้อะไรเกี่ยวกับ<br/>ร่างกายของตัวเอง?</>}</h1>
    <p className="listing-intro">{c.intro}</p>

    <div className="lab-simple-rule">
      <b>{language === 'en' ? 'ONE RULE' : 'หลักการใช้งานง่าย ๆ'}</b>
      <span>{language === 'en' ? 'Measure once → reuse the value → apply it to the question you care about.' : 'วัดครั้งเดียว → ใช้ค่าซ้ำได้ → นำไปตอบคำถามที่คุณสนใจ'}</span>
    </div>

    <section className="lab-intent-section lab-core-section">
      <p className="eyebrow cyan">{c.coreTitle}</p>
      <p className="lab-section-copy">{c.coreSub}</p>
      <CoreCards items={c.core} language={language}/>
    </section>

    <section className="lab-intent-section lab-explore-section">
      <p className="eyebrow">{c.exploreTitle}</p>
      <p className="lab-section-copy">{c.exploreSub}</p>
      <CompactCards items={c.explore} language={language} action={language === 'en' ? 'EXPLORE' : 'ลองสถานการณ์จำลอง'}/>
    </section>

    <section className="lab-intent-section lab-quick-section">
      <p className="eyebrow orange">{c.quickTitle}</p>
      <p className="lab-section-copy">{c.quickSub}</p>
      <CompactCards items={c.quick} language={language} action={language === 'en' ? 'QUICK CHECK' : 'วัดค่านี้'}/>
    </section>

    <div className="tool-warning" style={{marginTop:72}}>
      <strong>{language === 'en' ? 'HOW TO READ LAB RESULTS' : 'สิ่งที่ควรจำเมื่ออ่านผล LAB'}</strong>
      <p>{language === 'en'
        ? 'Measurements are context, not predictions. LAB helps you decide what to test next; your actual training response matters more than a body ratio.'
        : 'ค่าที่วัดได้เป็นข้อมูลประกอบ ไม่ใช่คำทำนาย LAB ช่วยบอกว่าอะไรควรลองต่อ แต่ผลตอบสนองจากการฝึกจริงสำคัญกว่าสัดส่วนร่างกายเพียงค่าเดียว'}</p>
    </div>

    <style>{`
      .lab-simple-rule{margin:34px 0 0;padding:16px 18px;border:1px solid rgba(72,220,232,.22);background:rgba(72,220,232,.04);display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}.lab-simple-rule b{font-size:10px;letter-spacing:.12em;color:#48dce8}.lab-simple-rule span{color:#c6cdcf;font-size:14px}.lab-intent-section{margin-top:64px}.lab-section-copy{max-width:760px;color:#8f999c;margin:8px 0 24px}.lab-core-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;max-width:980px}.lab-core-card{display:flex;flex-direction:column;min-height:330px;padding:24px;border:1px solid rgba(72,220,232,.2);background:#0c1113;text-decoration:none}.lab-core-card>span{font-size:10px;letter-spacing:.12em;color:#48dce8}.lab-core-card h2{font-size:30px;line-height:1.05;margin:24px 0 14px;color:#f3f4f2}.lab-core-card p{color:#aeb6b8;line-height:1.6}.lab-core-card small{margin-top:auto;padding-top:20px;color:#7f898c}.lab-core-card strong{margin-top:18px;color:#48dce8;font-size:12px;letter-spacing:.08em}.lab-quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.lab-quick-card{display:flex;flex-direction:column;min-height:220px;padding:18px;border:1px solid rgba(255,255,255,.1);background:#0b0f10;text-decoration:none}.lab-quick-card small{color:#ff6a1a;letter-spacing:.08em}.lab-explore-section .lab-quick-card small{color:#b9c0c2}.lab-quick-card h3{font-size:21px;line-height:1.15;margin:16px 0 10px;color:#eef0ef}.lab-quick-card p{font-size:13px;color:#8f989a;line-height:1.55}.lab-quick-card strong{margin-top:auto;padding-top:16px;color:#aeb5b7;font-size:11px;letter-spacing:.06em}@media(max-width:900px){.lab-core-grid{grid-template-columns:1fr}.lab-core-card{min-height:260px}}
    `}</style>
  </main></>;
}