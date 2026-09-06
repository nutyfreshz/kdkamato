import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { getMangaBySlug } from '../../../lib/content';
import { getLanguage } from '../../../lib/language';
import { localizedField } from '../../../lib/localize';

export const revalidate = 300;

export default async function MangaEpisode({ params }) {
  const language = await getLanguage();
  const { slug } = await params;
  const episode = await getMangaBySlug(slug).catch(() => null);
  if (!episode) notFound();
  return (
    <><SiteHeader language={language}/><main className="reader-page"><header className="reader-head shell"><p className="eyebrow">{episode.Episode_ID} / {localizedField(episode, 'Topic', language)}</p><h1>{localizedField(episode, 'Title', language)}</h1><p>{localizedField(episode, 'Short_Description', language)}</p></header><div className="manga-reader">{episode.pages.map((page, i) => <img key={page.id} src={page.url} alt={`${episode.Episode_ID} ${language === 'en' ? 'page' : 'หน้า'} ${i+1}`} loading={i < 2 ? 'eager' : 'lazy'} />)}</div><div className="reader-end shell"><p>{localizedField(episode, 'Caption', language)}</p><a href="/manga">← {language === 'en' ? 'BACK TO MANGA' : 'กลับไปหน้า MANGA'}</a></div></main></>
  );
}
