import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { getMangaBySlug } from '../../../lib/content';
import { getLanguage } from '../../../lib/language';
import { localizedField } from '../../../lib/localize';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const episode = await getMangaBySlug(slug).catch(() => null);
  if (!episode) return { title: 'Manga' };

  const title = localizedField(episode, 'Title', 'th') || episode.Episode_ID || 'KDKAMATO Manga';
  const description = localizedField(episode, 'Short_Description', 'th') || 'Evidence-led fitness Manga from KDKAMATO.';
  const canonical = `/manga/${slug}`;
  const images = episode.cover?.url ? [episode.cover.url] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical, siteName: 'KDKAMATO', images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images }
  };
}

export default async function MangaEpisode({ params }) {
  const language = await getLanguage();
  const { slug } = await params;
  const episode = await getMangaBySlug(slug).catch(() => null);
  if (!episode) notFound();

  const title = localizedField(episode, 'Title', language);
  const description = localizedField(episode, 'Short_Description', language);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description,
    url: `https://kdkamato.vercel.app/manga/${slug}`,
    datePublished: episode.Publish_Date || undefined,
    image: episode.cover?.url ? `https://kdkamato.vercel.app${episode.cover.url}` : undefined,
    publisher: { '@type': 'Organization', name: 'KDKAMATO' },
    inLanguage: language === 'en' ? 'en' : 'th'
  };

  return (
    <><SiteHeader language={language}/><main className="reader-page"><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')}}/><header className="reader-head shell"><p className="eyebrow">{episode.Episode_ID} / {localizedField(episode, 'Topic', language)}</p><h1>{title}</h1><p>{description}</p></header><div className="manga-reader">{episode.pages.map((page, i) => <img key={page.id} src={page.url} alt={`${episode.Episode_ID} ${language === 'en' ? 'page' : 'หน้า'} ${i+1}`} loading={i < 2 ? 'eager' : 'lazy'} />)}</div><div className="reader-end shell"><p>{localizedField(episode, 'Caption', language)}</p><a href="/manga">← {language === 'en' ? 'BACK TO MANGA' : 'กลับไปหน้า MANGA'}</a></div></main></>
  );
}
