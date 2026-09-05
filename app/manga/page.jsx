import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import { getManga } from '../../lib/content';

export const metadata = { title: 'Manga' };
export const revalidate = 300;

export default async function MangaLibrary() {
  const manga = await getManga({ limit: 100 }).catch(() => []);
  return (
    <><SiteHeader/><main className="listing-page shell"><p className="eyebrow">KDKAMATO MANGA</p><h1>THE UNIVERSE.</h1><p className="listing-intro">Daily Manga lives here once a row in MANGA_WEB reaches PUBLISHED.</p><div className="library-grid">{manga.length ? manga.map((ep) => <Link className="library-card" href={`/manga/${ep.Slug}`} key={ep.Episode_ID}>{ep.cover ? <img src={ep.cover.url} alt=""/> : <div className="library-placeholder"/>}<p className="meta">{ep.Episode_ID} / {ep.Topic}</p><h2>{ep.Title}</h2></Link>) : <div className="empty-state">No published Manga yet. The website connection is ready.</div>}</div></main></>
  );
}
