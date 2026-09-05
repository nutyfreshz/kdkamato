import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';
import { getArticles } from '../../lib/content';

export const metadata = { title: 'Knowledge' };
export const revalidate = 300;

export default async function KnowledgePage() {
  const articles = await getArticles({ limit: 100 }).catch(() => []);
  return <><SiteHeader/><main className="listing-page shell"><p className="eyebrow">KDKAMATO KNOWLEDGE</p><h1>GO DEEPER.</h1><p className="listing-intro">Long-form evidence and mechanism. Articles publish independently from daily Manga.</p><div className="article-library">{articles.length ? articles.map((a) => <Link key={a.Article_ID} href={`/knowledge/${a.Slug}`}><p className="meta">{a.Topic}</p><h2>{a.Title}</h2><p>{a.Summary}</p><span>READ →</span></Link>) : <div className="empty-state">No published articles yet. ARTICLES_WEB is ready.</div>}</div></main></>;
}
