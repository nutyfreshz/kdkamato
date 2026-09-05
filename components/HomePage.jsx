'use client';

import Link from 'next/link';
import Descent from './Descent';
import KnowledgeSwitcher from './KnowledgeSwitcher';
import LabPreview from './LabPreview';

function MangaPlaceholder() {
  return (
    <div className="manga-cover manga-feed-placeholder">
      <div className="cover-grid" />
      <div className="cover-copy"><span>CONTENT FEED READY</span><strong>MANGA_WEB</strong><small>Set a row to PUBLISHED to show it here.</small></div>
    </div>
  );
}

export default function HomePage({ manga = [], articles = [] }) {
  const latest = manga[0];
  const previous = manga.slice(1, 4);
  return (
    <main>
      <section className="hero">
        <div className="hero-image" />
        <div className="hero-vignette" />
        <div className="hero-copy shell">
          <p className="eyebrow">KDKAMATO / REBIRTH</p>
          <h1>WHAT YOU SEE<br/>IS ONLY THE<br/><span>OUTCOME.</span></h1>
          <p className="lede">The visible body is only the end of the process.</p>
          <a className="text-cta" href="#descent">ENTER THE UNIVERSE <span>↓</span></a>
        </div>
      </section>

      <Descent />
      <div className="breather" />

      <section className="manga section shell" id="manga">
        <div className="section-heading"><p className="eyebrow">MANGA / LATEST</p><h2>LATEST<br/>FROM THE UNIVERSE</h2></div>
        <article className="manga-feature">
          {latest?.cover ? <img className="manga-cover real-cover" src={latest.cover.url} alt={latest.Title || latest.Episode_ID} /> : <MangaPlaceholder />}
          <div className="manga-feature-copy">
            <p className="meta">{latest ? `${latest.Episode_ID} / ${latest.Topic || 'KDKAMATO'}` : 'LIVE CONTENT / READY'}</p>
            <h3>{latest?.Title || 'YOUR DAILY MANGA LIBRARY, WITHOUT DAILY WEBSITE EDITING.'}</h3>
            <p>{latest?.Short_Description || 'Final Manga lives in Google Drive. One Google Sheet row controls what appears on the site.'}</p>
            {latest ? <Link className="text-cta" href={`/manga/${latest.Slug}`}>READ EPISODE <span>→</span></Link> : <Link className="text-cta" href="/manga">VIEW MANGA <span>→</span></Link>}
          </div>
        </article>
        <div className="manga-row">
          {previous.length ? previous.map((ep) => (
            <Link className="manga-card" key={ep.Episode_ID} href={`/manga/${ep.Slug}`}>
              {ep.cover ? <img className="mini-cover image-cover" src={ep.cover.url} alt="" /> : <div className="mini-cover"><span>{ep.Episode_ID}</span></div>}
              <p>{ep.Title}</p>
            </Link>
          )) : [1,2,3].map((i) => <div className="manga-card muted-card" key={i}><div className="mini-cover"><span>EP.</span><b>—</b></div><p>Waiting for published content</p></div>)}
        </div>
        <Link className="section-link" href="/manga">VIEW ALL MANGA <span>→</span></Link>
      </section>

      <section className="knowledge section" id="knowledge">
        <div className="shell">
          <div className="section-heading compact"><p className="eyebrow">KNOWLEDGE</p><h2>GO<br/>DEEPER.</h2><p className="section-intro">Scientific breakdowns behind the stories.</p></div>
          <KnowledgeSwitcher />
          <div className="article-grid">
            {(articles.length ? articles.slice(0,3) : [null,null,null]).map((article, i) => article ? (
              <article key={article.Article_ID}><p className="meta">{article.Topic}</p><h3>{article.Title}</h3><p>{article.Summary}</p><Link href={`/knowledge/${article.Slug}`}>READ →</Link></article>
            ) : (
              <article key={i}><p className="meta">ARTICLES_WEB</p><h3>Article feed ready</h3><p>Publish only the deep dives you want. Daily Manga does not require a matching article.</p><Link href="/knowledge">EXPLORE →</Link></article>
            ))}
          </div>
        </div>
      </section>

      <section className="lab section" id="lab">
        <div className="lab-grid-bg" />
        <div className="shell lab-shell">
          <div className="section-heading compact"><p className="eyebrow cyan">KDKAMATO LAB</p><h2>TEST<br/>YOURSELF.</h2><p className="section-intro">Personal fitness/science tools that turn your own measurements into useful context, without live AI interpretation.</p></div>
          <LabPreview />
          <div className="tool-teasers"><Link href="/lab/exercise-fit"><span>C1</span>EXERCISE FIT <b>→</b></Link><Link href="/lab/squat-geometry"><span>C2</span>SQUAT GEOMETRY <b>→</b></Link><Link href="/lab/physique-goal"><span>C3</span>PHYSIQUE GOAL <b>→</b></Link></div>
        </div>
      </section>

      <section className="training section" id="training">
        <div className="training-image" /><div className="training-shade" />
        <div className="shell training-copy"><p className="eyebrow orange">TRAINING</p><h2>KNOWLEDGE<br/>INTO<br/>APPLICATION.</h2><div className="program-note"><p className="meta">PROGRAMS</p><h3>KDKAMATO TRAINING</h3><p>Premium program storytelling, without turning the homepage into a marketplace.</p><Link className="text-cta" href="/training">EXPLORE TRAINING <span>→</span></Link></div></div>
      </section>

      <section className="kendo section" id="kendo">
        <div className="kendo-image" /><div className="kendo-shade" />
        <div className="shell kendo-copy"><p className="eyebrow orange">REAL KENDO</p><h2>THE HUMAN<br/>BEHIND<br/>KDKAMATO.</h2><p>Evidence. Experience. Application.</p></div>
      </section>

      <section className="portal section shell"><p className="eyebrow">EXPLORE</p><h2>WHERE DO YOU<br/>WANT TO GO NEXT?</h2><div className="portal-links"><Link href="/manga"><span>MANGA</span><b>→</b></Link><Link href="/knowledge"><span>KNOWLEDGE</span><b>→</b></Link><Link href="/lab"><span>LAB</span><b>→</b></Link><Link href="/training"><span>TRAINING</span><b>→</b></Link></div></section>
    </main>
  );
}
