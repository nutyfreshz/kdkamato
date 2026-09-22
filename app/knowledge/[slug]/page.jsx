import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import SiteHeader from '../../../components/SiteHeader';
import { getArticleBySlug } from '../../../lib/content';
import { getLanguage } from '../../../lib/language';
import { localizedField } from '../../../lib/localize';

export const revalidate = 300;

function toMetaDescription(value = '') {
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length <= 155) return text;
  return text.slice(0, 152).replace(/\s+\S*$/, '').trimEnd() + '...';
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) return { title: 'Knowledge' };

  const title = localizedField(article, 'Title', 'th') || 'KDKAMATO Knowledge';
  const description = toMetaDescription(localizedField(article, 'Summary', 'th') || 'Evidence-led fitness knowledge from KDKAMATO.');
  const canonical = `/knowledge/${slug}`;
  const coverUrl = article.cover ? `https://kdkamato.vercel.app${article.cover.url}` : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      siteName: 'KDKAMATO',
      publishedTime: article.Publish_Date || undefined,
      images: coverUrl ? [{ url: coverUrl, width: 1600, height: 900, alt: title }] : undefined
    },
    twitter: {
      card: coverUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: coverUrl ? [coverUrl] : undefined
    }
  };
}

export default async function ArticlePage({ params }) {
  const language = await getLanguage();
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) notFound();

  const title = localizedField(article, 'Title', language);
  const description = localizedField(article, 'Summary', language);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `https://kdkamato.vercel.app/knowledge/${slug}`,
    author: { '@type': 'Person', name: 'Kendo' },
    publisher: {
      '@type': 'Organization',
      name: 'KDKAMATO',
      logo: { '@type': 'ImageObject', url: 'https://kdkamato.vercel.app/icon.svg' }
    },
    image: article.cover ? `https://kdkamato.vercel.app${article.cover.url}` : undefined,
    inLanguage: language === 'en' ? 'en' : 'th'
  };

  return <><SiteHeader language={language}/><main className="article-page shell"><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')}}/><header><p className="eyebrow">{localizedField(article, 'Topic', language)}</p><h1>{title}</h1><p className="article-summary">{description}</p><p className="meta">{article.Publish_Date}</p></header>{article.cover ? <div className="article-cover-hero"><Image src={article.cover.url} alt={title} width={1600} height={900} sizes="(max-width: 900px) calc(100vw - 40px), 1040px" unoptimized/></div> : null}<article className="prose"><ReactMarkdown components={{h1: ({node, ...props}) => <h2 {...props}/>}}>{localizedField(article, 'Body_MD', language) || ''}</ReactMarkdown></article>{article.References ? <section className="references"><h2>{language === 'en' ? 'References' : 'เอกสารอ้างอิง'}</h2><ReactMarkdown>{article.References}</ReactMarkdown></section> : null}</main></>;
}
