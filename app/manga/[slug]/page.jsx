import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { getMangaBySlug } from '../../../lib/content';

export const revalidate = 300;

export default async function MangaEpisode({ params }) {
  const { slug } = await params;
  const episode = await getMangaBySlug(slug).catch(() => null);
  if (!episode) notFound();
  return (
    <><SiteHeader/><main className="reader-page"><header className="reader-head shell"><p className="eyebrow">{episode.Episode_ID} / {episode.Topic}</p><h1>{episode.Title}</h1><p>{episode.Short_Description}</p></header><div className="manga-reader">{episode.pages.map((page, i) => <img key={page.id} src={page.url} alt={`${episode.Episode_ID} page ${i+1}`} loading={i < 2 ? 'eager' : 'lazy'} />)}</div><div className="reader-end shell"><p>{episode.Caption}</p><a href="/manga">← BACK TO MANGA</a></div></main></>
  );
}
