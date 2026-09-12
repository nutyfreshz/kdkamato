'use client';


const content = {
  th: [
    { image: '/assets/a02_body.webp', eyebrow: 'ใต้สิ่งที่มองเห็น / 01', title: <>การฝึกเป็นสิ่งที่<br/>มองเห็นได้</> },
    { image: '/assets/a03_signal.webp', eyebrow: 'ใต้สิ่งที่มองเห็น / 02', title: <>แต่สัญญาณที่ร่างกายได้รับ<br/>อาจมองไม่เห็น</> },
    { image: '/assets/a04_cell.webp', eyebrow: 'ใต้สิ่งที่มองเห็น / 03', title: <>การปรับตัวเริ่มจากภายใน</> },
    { image: '/assets/a05_tissue.webp', eyebrow: 'ใต้สิ่งที่มองเห็น / 04', title: <>สำรวจว่ามันเกิดขึ้นอย่างไร</> }
  ],
  en: [
    { image: '/assets/a02_body.webp', eyebrow: 'BENEATH THE SURFACE / 01', title: <>TRAINING<br/>IS VISIBLE.</> },
    { image: '/assets/a03_signal.webp', eyebrow: 'BENEATH THE SURFACE / 02', title: <>THE SIGNAL<br/>ISN&apos;T.</> },
    { image: '/assets/a04_cell.webp', eyebrow: 'BENEATH THE SURFACE / 03', title: <>ADAPTATION<br/>HAPPENS HERE.</> },
    { image: '/assets/a05_tissue.webp', eyebrow: 'BENEATH THE SURFACE / 04', title: <>WE GO<br/>INSIDE.</> }
  ]
};

export default function Descent({ language = 'th' }) {
  const stages = content[language] || content.th;
  return (
    <section className="descent" id="descent" aria-label={language === 'en' ? 'Beneath the surface' : 'สิ่งที่เกิดขึ้นใต้สิ่งที่มองเห็น'}>
      <div className="descent-sticky">
        <div className="descent-media" aria-hidden="true">
          {stages.map((item, index) => (
            <img key={item.image} className={`descent-frame ${index === 0 ? 'is-active' : ''}`} src={item.image} alt="" />
          ))}
          <div className="descent-shade" />
        </div>
        <div className="shell descent-copy-wrap">
          {stages.map((item, index) => (
            <div key={item.eyebrow} aria-hidden={index !== 0} className={`descent-copy ${index === 0 ? 'is-active' : ''}`}>
              <p className="eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
            </div>
          ))}
        </div>
        <div className="descent-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
