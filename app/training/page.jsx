import SiteHeader from '../../components/SiteHeader';
import { getLanguage } from '../../lib/language';

export const metadata = { title: 'Training' };
export default async function TrainingPage() {
  const language = await getLanguage();
  return <><SiteHeader language={language}/><main className="training-page"><div className="training-page-image"/><div className="training-page-shade"/><div className="shell training-page-copy"><p className="eyebrow orange">KDKAMATO TRAINING</p><h1>{language === 'en' ? <>KNOWLEDGE<br/>INTO<br/>APPLICATION.</> : <>เปลี่ยนความรู้<br/>ให้เป็น<br/>การลงมือทำ</>}</h1><p>{language === 'en' ? 'Training programs and practical application will live here after the material has been fully reviewed and is ready to publish.' : 'พื้นที่สำหรับโปรแกรม Training และ Nutrition ที่นำความรู้ไปใช้จริง เนื้อหาจะเปิดเมื่อผ่านการตรวจต้นฉบับและพร้อมเผยแพร่'}</p></div></main></>;
}
