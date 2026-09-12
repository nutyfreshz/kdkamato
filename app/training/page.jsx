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
              ? 'Set your goal, training time, and equipment to build your program, then keep tracking your results with the same account.'
              : 'ตั้งค่าเป้าหมายและเวลาฝึก เพื่อสร้างโปรแกรมของคุณ แล้วติดตามผลต่อในบัญชีเดิม'}
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
