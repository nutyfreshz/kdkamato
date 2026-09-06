import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import { getArticles } from '../../lib/content';
import { getLanguage } from '../../lib/language';
import { localizedField } from '../../lib/localize';

export const metadata = { title: 'Knowledge' };
export const revalidate = 300;

export default async function KnowledgePage() {
  const language = await getLanguage();
  const articles = await getArticles({ limit: 100 }).catch(() => []);
  return <><SiteHeader language={language}/><main className="listing-page shell"><p className="eyebrow">KDKAMATO KNOWLEDGE</p><h1>{language === 'en' ? 'GO DEEPER.' : 'เข้าใจให้ลึกกว่าเดิม.'}</h1><p className="listing-intro">{language === 'en' ? 'Long-form evidence, mechanisms, uncertainty, and practical application behind the stories.' : 'บทความเชิงลึกที่อธิบายหลักฐาน กลไก ข้อจำกัด และการนำไปใช้จริง โดยไม่ลดทอนความซับซ้อนของวิทยาศาสตร์'}</p><div className="article-library">{articles.length ? articles.map((a) => <Link key={a.Article_ID} href={`/knowledge/${a.Slug}`}><p className="meta">{localizedField(a, 'Topic', language)}</p><h2>{localizedField(a, 'Title', language)}</h2><p>{localizedField(a, 'Summary', language)}</p><span>{language === 'en' ? 'READ' : 'อ่าน'} →</span></Link>) : <div className="empty-state">{language === 'en' ? 'No published articles yet.' : 'ยังไม่มีบทความที่เผยแพร่ในขณะนี้'}</div>}</div></main></>;
}
