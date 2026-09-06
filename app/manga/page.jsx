import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import { getManga } from '../../lib/content';
import { getLanguage } from '../../lib/language';
import { localizedField } from '../../lib/localize';

export const metadata = { title: 'Manga' };
export const revalidate = 300;

export default async function MangaLibrary() {
  const language = await getLanguage();
  const manga = await getManga({ limit: 100 }).catch(() => []);
  return (
    <><SiteHeader language={language}/><main className="listing-page shell"><p className="eyebrow">KDKAMATO MANGA</p><h1>{language === 'en' ? 'THE UNIVERSE.' : 'เรื่องทั้งหมด.'}</h1><p className="listing-intro">{language === 'en' ? 'Read every published KDKAMATO Manga episode here.' : 'รวมทุกตอนของ KDKAMATO Manga ที่เผยแพร่แล้ว อ่านต่อเนื่องได้จากหน้านี้'}</p><div className="library-grid">{manga.length ? manga.map((ep) => <Link className="library-card" href={`/manga/${ep.Slug}`} key={ep.Episode_ID}>{ep.cover ? <img src={ep.cover.url} alt=""/> : <div className="library-placeholder"/>}<p className="meta">{ep.Episode_ID} / {localizedField(ep, 'Topic', language)}</p><h2>{localizedField(ep, 'Title', language)}</h2></Link>) : <div className="empty-state">{language === 'en' ? 'No published Manga yet.' : 'ยังไม่มี Manga ที่เผยแพร่ในขณะนี้'}</div>}</div></main></>
  );
}
