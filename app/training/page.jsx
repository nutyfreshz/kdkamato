import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import { getLanguage } from '../../lib/language';

export const metadata = { title: 'Training' };

export default async function TrainingPage() {
  const language = await getLanguage();
  const en = language === 'en';

  return (
    <>
      <SiteHeader language={language}/>
      <main className="training-page">
        <div className="training-page-image"/>
        <div className="training-page-shade"/>
        <div className="shell training-page-copy">
          <p className="eyebrow orange">KDKAMATO TRAINING</p>
          <h1>
            {en
              ? <>KNOWLEDGE<br/>INTO<br/>APPLICATION.</>
              : <>เปลี่ยนความรู้<br/>ให้เป็น<br/>การลงมือทำ</>}
          </h1>
          <p>
            {en
              ? 'Your Training + Nutrition system lives here. Start with the Free Foundation, then continue with the same account and history as the system develops.'
              : 'การฝึกและโภชนาการของคุณเริ่มจากตรงนี้ สร้าง Free Foundation แล้วใช้บัญชีและประวัติเดียวกันต่อเนื่องกับระบบ'}
          </p>
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'28px'}}>
            <Link className="text-cta" href="/home">
              {en ? 'START MY PROGRAM' : 'เริ่มโปรแกรมของฉัน'} <span>→</span>
            </Link>
            <Link className="text-cta" href="/login" style={{color:'#9aa0a4'}}>
              {en ? 'LOGIN' : 'เข้าสู่ระบบ'} <span>→</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
