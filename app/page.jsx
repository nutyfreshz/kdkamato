import SiteHeader from '../components/SiteHeader';
import HomePage from '../components/HomePage';
import { getArticles, getManga } from '../lib/content';

export const revalidate = 300;

export default async function Page() {
  const [manga, articles] = await Promise.all([
    getManga({ limit: 4 }).catch(() => []),
    getArticles({ limit: 3 }).catch(() => [])
  ]);

  return (
    <>
      <SiteHeader />
      <HomePage manga={manga} articles={articles} />
      <footer className="footer shell"><div className="footer-brand">KDKAMATO</div><div className="footer-grid"><div><a href="/manga">Manga</a><a href="/knowledge">Knowledge</a><a href="/lab">LAB</a><a href="/training">Training</a></div><div><a href="/#kendo">About Kendo</a><a href="#">TikTok</a><a href="#">Instagram</a><a href="#">YouTube</a></div><div><a href="#">Contact</a><a href="#">Privacy</a><a href="#">Terms</a></div></div></footer>
    </>
  );
}
