import SiteHeader from '../components/SiteHeader';
import HomePage from '../components/HomePage';
import { getArticles, getManga } from '../lib/content';
import { getLanguage } from '../lib/language';

export const revalidate = 300;

export default async function Page() {
  const language = await getLanguage();
  const [manga, articles] = await Promise.all([
    getManga({ limit: 4 }).catch(() => []),
    getArticles({ limit: 3 }).catch(() => [])
  ]);
  const footer = language === 'en'
    ? { about:'About Kendo' }
    : { about:'เกี่ยวกับ Kendo' };

  return (
    <>
      <SiteHeader language={language} />
      <HomePage manga={manga} articles={articles} language={language} />
      <footer className="footer shell">
        <div className="footer-brand">KDKAMATO</div>
        <div className="footer-grid">
          <div><a href="/manga">Manga</a><a href="/knowledge">Knowledge</a><a href="/lab">LAB</a><a href="/training">Training</a></div>
          <div><a href="/#kendo">{footer.about}</a></div>
        </div>
      </footer>
    </>
  );
}
