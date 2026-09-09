import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import { getLanguage } from '../../lib/language';

export const metadata = {
  title: 'KDKAMATO LAB',
  description: 'Simple fitness and body-structure tools: measure once, reuse the result, and apply it to a clear question.'
};

const content = {
  th: {
    intro: 'เลือกจากคำถามที่อยากรู้ก่อน ไม่ต้องทำทุกเครื่องมือ และไม่ต้องจำศัพท์ biomechanics ค่าที่วัดแล้วจะถูกใช้ซ้ำใน LAB ที่เกี่ยวข้อง เพื่อไม่ให้กรอกเรื่องเดิมหลายรอบ',
    coreTitle: 'เริ่มจาก 3 เครื่องมือหลัก',
    coreSub: 'เครื่องมือหลักเอาค่าที่วัดได้ไปตอบคำถามว่า “แล้วควรลองอะไรต่อ?”',
    quickTitle: 'Quick Checks',
    quickSub: 'ใช้เมื่ออยากวัดค่าใดค่าหนึ่งแบบเร็ว ๆ เท่านั้น ไม่จำเป็นต้องทำก่อน Core และค่าที่วัดจะถูก reuse ในเครื่องมือหลักที่เกี่ยวข้อง',
    core: [
      {
        href:'/lab/exercise-fit', tag:'TRAINING',
        title:'ท่านี้มีอะไรที่ควรลองปรับให้เข้ากับโครงคุณ?',
        copy:'เลือก Squat, Bench Press หรือ Deadlift แล้วใช้สัดส่วนของคุณช่วยจัดลำดับว่า setup หรือทางเลือกไหนควรเอาไปลองเปรียบเทียบก่อน',
        result:'ได้: สิ่งที่ควรลองปรับหรือเปรียบเทียบ'
      },
      {
        href:'/lab/squat-geometry', tag:'SQUAT',
        title:'Squat setup แบบไหนควรลองก่อน?',
        copy:'ลองเปลี่ยนรูปแบบ Squat, ส้นเท้า, stance และการเดินหน้าของเข่า เพื่อเทียบ setup โดยใช้ค่าช่วงขาที่คุณวัดไว้',
        result:'ได้: setup ที่ควรเอาไปทดลองจริง'
      },
      {
        href:'/lab/physique-goal', tag:'PHYSIQUE',
        title:'อยากให้หุ่นดู V ขึ้น ควรเปลี่ยนอะไร?',
        copy:'ลองเปลี่ยนช่วงไหล่ เอว หรือทั้งสองอย่าง แล้วดูผลต่อสัดส่วน โดยใช้ค่าปัจจุบันที่วัดไว้เป็นฐาน',
        result:'ได้: ทางเลือกที่เห็นผลเชิงสัดส่วนชัดเจน'
      }
    ],
    quick: [
      { href:'/lab/knee-to-wall', title:'เข่าเดินหน้าได้แค่ไหน?', technical:'Knee-to-Wall', copy:'วัดซ้าย/ขวาเพื่อดูบริบทของข้อเท้าและการเดินหน้าของเข่า' },
      { href:'/lab/ape-index', title:'แขนยาวแค่ไหนเมื่อเทียบกับส่วนสูง?', technical:'Ape Index', copy:'วัด reach อย่างเดียว แล้ว C1 จะนำค่าไปใช้กับ Bench/Deadlift ต่อ' },
      { href:'/lab/femur-tibia', title:'ต้นขายาวแค่ไหนเมื่อเทียบกับหน้าแข้ง?', technical:'Femur:Tibia', copy:'วัดสัดส่วนช่วงขาอย่างเดียว แล้ว C1/C2 จะนำค่าไปใช้ต่อ' },
      { href:'/lab/v-taper', title:'สัดส่วนไหล่ต่อเอวตอนนี้เป็นเท่าไร?', technical:'V-Taper', copy:'ดู snapshot ปัจจุบัน แล้ว C3 ใช้ค่าเดิมทำ scenario ต่อ' },
      { href:'/lab/ffmi', title:'มวลไร้ไขมันเทียบกับส่วนสูงเป็นเท่าไร?', technical:'FFMI', copy:'Quick metric สำหรับติดตามตัวเองตามเวลา' }
    ]
  },
  en: {
    intro: 'Start with the question you care about. You do not need to complete every tool or know biomechanics terms first. Measurements are reused across related LAB tools so you do not have to enter the same thing repeatedly.',
    coreTitle: 'Start with 3 main tools',
    coreSub: 'Main tools use measurements to answer: “What should I try next?”',
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
        title:'Which Squat setup is worth trying first?',
        copy:'Change Squat variant, heel, stance, and knee travel while reusing your existing leg measurements.',
        result:'Get: a setup to test in real training'
      },
      {
        href:'/lab/physique-goal', tag:'PHYSIQUE',
        title:'Want a stronger V-shape? What should change?',
        copy:'Compare shoulder, waist, or combined changes using your current measurements as the baseline.',
        result:'Get: clear proportion scenarios'
      }
    ],
    quick: [
      { href:'/lab/knee-to-wall', title:'How far can your knee travel forward?', technical:'Knee-to-Wall', copy:'Measure left/right ankle and knee-travel context.' },
      { href:'/lab/ape-index', title:'How long are your arms relative to height?', technical:'Ape Index', copy:'Measure reach only. C1 can reuse it for Bench/Deadlift context.' },
      { href:'/lab/femur-tibia', title:'How long is your thigh relative to lower leg?', technical:'Femur:Tibia', copy:'Measure leg proportions only. C1/C2 can reuse them.' },
      { href:'/lab/v-taper', title:'What is your current shoulder-to-waist ratio?', technical:'V-Taper', copy:'See the current snapshot. C3 reuses it for scenarios.' },
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

function QuickCards({ items, language }) {
  return <div className="lab-quick-grid">{items.map((tool)=><Link key={tool.href} className="lab-quick-card" href={tool.href}>
    <small>{tool.technical}</small>
    <h3>{tool.title}</h3>
    <p>{tool.copy}</p>
    <strong>{language === 'en' ? 'QUICK CHECK' : 'วัดค่านี้'} →</strong>
  </Link>)}</div>;
}

export default async function LabPage() {
  const language = await getLanguage();
  const c = content[language] || content.th;

  return <><SiteHeader language={language}/><main className="listing-page shell lab-page">
    <p className="eyebrow cyan">KDKAMATO LAB</p>
    <h1>{language === 'en' ? <>WHAT DO YOU WANT<br/>TO UNDERSTAND?</> : <>อยากรู้อะไร<br/>เกี่ยวกับร่างกายตัวเอง?</>}</h1>
    <p className="listing-intro">{c.intro}</p>

    <div className="lab-simple-rule">
      <b>{language === 'en' ? 'ONE RULE' : 'กติกาง่าย ๆ'}</b>
      <span>{language === 'en' ? 'Measure once → reuse the value → apply it to the question you care about.' : 'วัดครั้งเดียว → ใช้ค่าซ้ำได้ → เอาไปตอบคำถามที่คุณสนใจ'}</span>
    </div>

    <section className="lab-intent-section lab-core-section">
      <p className="eyebrow cyan">{c.coreTitle}</p>
      <p className="lab-section-copy">{c.coreSub}</p>
      <CoreCards items={c.core} language={language}/>
    </section>

    <section className="lab-intent-section lab-quick-section">
      <p className="eyebrow orange">{c.quickTitle}</p>
      <p className="lab-section-copy">{c.quickSub}</p>
      <QuickCards items={c.quick} language={language}/>
    </section>

    <div className="tool-warning" style={{marginTop:72}}>
      <strong>{language === 'en' ? 'HOW TO READ LAB RESULTS' : 'จำไว้เวลาอ่านผล LAB'}</strong>
      <p>{language === 'en'
        ? 'Measurements are context, not predictions. LAB helps you decide what to test next; your actual training response matters more than a body ratio.'
        : 'ค่าที่วัดได้เป็นข้อมูลประกอบ ไม่ใช่คำทำนาย LAB ช่วยบอกว่าอะไรควรลองต่อ แต่ผลตอบสนองตอนฝึกจริงสำคัญกว่าสัดส่วนร่างกายเพียงค่าเดียว'}</p>
    </div>

    <style>{`
      .lab-simple-rule{margin:34px 0 0;padding:16px 18px;border:1px solid rgba(72,220,232,.22);background:rgba(72,220,232,.04);display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}.lab-simple-rule b{font-size:10px;letter-spacing:.12em;color:#48dce8}.lab-simple-rule span{color:#c6cdcf;font-size:14px}.lab-intent-section{margin-top:64px}.lab-section-copy{max-width:760px;color:#8f999c;margin:8px 0 24px}.lab-core-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.lab-core-card{display:flex;flex-direction:column;min-height:330px;padding:24px;border:1px solid rgba(72,220,232,.2);background:#0c1113;text-decoration:none}.lab-core-card>span{font-size:10px;letter-spacing:.12em;color:#48dce8}.lab-core-card h2{font-size:30px;line-height:1.05;margin:24px 0 14px;color:#f3f4f2}.lab-core-card p{color:#aeb6b8;line-height:1.6}.lab-core-card small{margin-top:auto;padding-top:20px;color:#7f898c}.lab-core-card strong{margin-top:18px;color:#48dce8;font-size:12px;letter-spacing:.08em}.lab-quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.lab-quick-card{display:flex;flex-direction:column;min-height:220px;padding:18px;border:1px solid rgba(255,255,255,.1);background:#0b0f10;text-decoration:none}.lab-quick-card small{color:#ff6a1a;letter-spacing:.08em}.lab-quick-card h3{font-size:21px;line-height:1.15;margin:16px 0 10px;color:#eef0ef}.lab-quick-card p{font-size:13px;color:#8f989a;line-height:1.55}.lab-quick-card strong{margin-top:auto;padding-top:16px;color:#aeb5b7;font-size:11px;letter-spacing:.06em}@media(max-width:900px){.lab-core-grid{grid-template-columns:1fr}.lab-core-card{min-height:260px}}
    `}</style>
  </main></>;
}
