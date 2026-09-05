import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import SiteHeader from '../../../components/SiteHeader';
import { getArticleBySlug } from '../../../lib/content';

export const revalidate = 300;

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) notFound();
  return <><SiteHeader/><main className="article-page shell"><header><p className="eyebrow">{article.Topic}</p><h1>{article.Title}</h1><p className="article-summary">{article.Summary}</p><p className="meta">{article.Publish_Date}</p></header><article className="prose"><ReactMarkdown>{article.Body_MD || ''}</ReactMarkdown></article>{article.References ? <section className="references"><h2>References</h2><ReactMarkdown>{article.References}</ReactMarkdown></section> : null}</main></>;
}
