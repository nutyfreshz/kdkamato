'use client';


const content = {
  th: [
    { image: '/assets/a02_body.webp', eyebrow: 'จากการฝึกสู่การตัดสินใจ / 01', title: <>สิ่งที่ทำในการฝึก<br/>มองเห็นได้</> },
    { image: '/assets/a03_signal.webp', eyebrow: 'จากการฝึกสู่การตัดสินใจ / 02', title: <>แต่ร่างกายตอบสนอง<br/>มากกว่าที่มองเห็น</> },
    { image: '/assets/a04_cell.webp', eyebrow: 'จากการฝึกสู่การตัดสินใจ / 03', title: <>ผลลัพธ์เกิดจากการปรับตัว<br/>ที่สะสมจากภายใน</> },
    { image: '/assets/a05_tissue.webp', eyebrow: 'จากการฝึกสู่การตัดสินใจ / 04', title: <>จึงควรตัดสินใจจากข้อมูล<br/>ไม่ใช่การเดา</> }
  ],
  en: [
    { image: '/assets/a02_body.webp', eyebrow: 'FROM TRAINING TO DECISIONS / 01', title: <>WHAT YOU DO<br/>IS VISIBLE.</> },
    { image: '/assets/a03_signal.webp', eyebrow: 'FROM TRAINING TO DECISIONS / 02', title: <>YOUR BODY RESPONDS<br/>BEYOND WHAT YOU SEE.</> },
    { image: '/assets/a04_cell.webp', eyebrow: 'FROM TRAINING TO DECISIONS / 03', title: <>RESULTS COME FROM<br/>ADAPTATION OVER TIME.</> },
    { image: '/assets/a05_tissue.webp', eyebrow: 'FROM TRAINING TO DECISIONS / 04', title: <>MAKE THE NEXT DECISION<br/>FROM DATA, NOT GUESSWORK.</> }
  ]
};

export default function Descent({ language = 'th' }) {
  const stages = content[language] || content.th;
  return (
    <section className="descent" id="descent" aria-label={language === 'en' ? 'From training to decisions' : 'จากการฝึกสู่การตัดสินใจ'}>
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
