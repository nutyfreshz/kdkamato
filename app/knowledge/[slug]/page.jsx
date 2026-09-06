import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import SiteHeader from '../../../components/SiteHeader';
import { getArticleBySlug } from '../../../lib/content';
import { getLanguage } from '../../../lib/language';
import { localizedField } from '../../../lib/localize';

export const revalidate = 300;

export default async function ArticlePage({ params }) {
  const language = await getLanguage();
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) notFound();
  return <><SiteHeader language={language}/><main className="article-page shell"><header><p className="eyebrow">{localizedField(article, 'Topic', language)}</p><h1>{localizedField(article, 'Title', language)}</h1><p className="article-summary">{localizedField(article, 'Summary', language)}</p><p className="meta">{article.Publish_Date}</p></header><article className="prose"><ReactMarkdown>{localizedField(article, 'Body_MD', language) || ''}</ReactMarkdown></article>{article.References ? <section className="references"><h2>References</h2><ReactMarkdown>{article.References}</ReactMarkdown></section> : null}</main></>;
}
