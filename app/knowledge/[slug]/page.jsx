import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import SiteHeader from '../../../components/SiteHeader';
import { getArticleBySlug } from '../../../lib/content';
import { getLanguage } from '../../../lib/language';
import { localizedField } from '../../../lib/localize';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) return { title: 'Knowledge' };

  const title = localizedField(article, 'Title', 'th') || 'KDKAMATO Knowledge';
  const description = localizedField(article, 'Summary', 'th') || 'Evidence-led fitness knowledge from KDKAMATO.';
  const canonical = `/knowledge/${slug}`;

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
      publishedTime: article.Publish_Date || undefined
    },
    twitter: { card: 'summary', title, description }
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
    '@type': 'Article',
    headline: title,
    description,
    datePublished: article.Publish_Date || undefined,
    mainEntityOfPage: `https://kdkamato.vercel.app/knowledge/${slug}`,
    author: { '@type': 'Person', name: 'Kendo' },
    publisher: { '@type': 'Organization', name: 'KDKAMATO' },
    inLanguage: language === 'en' ? 'en' : 'th'
  };

  return <><SiteHeader language={language}/><main className="article-page shell"><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')}}/><header><p className="eyebrow">{localizedField(article, 'Topic', language)}</p><h1>{title}</h1><p className="article-summary">{description}</p><p className="meta">{article.Publish_Date}</p></header><article className="prose"><ReactMarkdown>{localizedField(article, 'Body_MD', language) || ''}</ReactMarkdown></article>{article.References ? <section className="references"><h2>{language === 'en' ? 'References' : 'เอกสารอ้างอิง'}</h2><ReactMarkdown>{article.References}</ReactMarkdown></section> : null}</main></>;
}
