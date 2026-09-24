'use client';

import Link from 'next/link';
import Descent from './Descent';
import { useHomeMotion } from './use-home-motion';
import styles from './home-story.module.css';
import KnowledgeSwitcher from './KnowledgeSwitcher';
import LabPreview from './LabPreview';
import { localizedField } from '../lib/localize';

const copy = {
  th: {
    heroTitle: <>รู้ว่าควรฝึกอะไร<br/>และรู้ว่า<span>ควรทำอะไรต่อ</span></>,
    heroLede: 'KDKAMATO ช่วยวางแผนการฝึกจากเป้าหมาย เวลาที่มี และอุปกรณ์ของคุณ แล้วใช้ผลการฝึกจริงช่วยบอกว่าครั้งต่อไปควรคง เพิ่ม หรือลดอะไร',
    enter: 'เลื่อนดูว่าระบบช่วยตัดสินใจอย่างไร',
    latestEyebrow: 'MANGA / ตอนล่าสุด', latestTitle: <>ตอนล่าสุดจาก KDKAMATO</>, readEpisode: 'อ่านตอนนี้', viewManga: 'ดู MANGA ทั้งหมด',
    noMangaTitle: 'พื้นที่แสดง Manga ที่เผยแพร่แล้ว', noMangaText: 'ตอนที่เผยแพร่แล้วจะแสดงที่นี่โดยอัตโนมัติ', waiting: 'รอตอนใหม่',
    knowledgeTitle: <>เข้าใจเหตุผลเบื้องหลัง</>, knowledgeIntro: 'เมื่ออยากรู้ว่าทำไมคำแนะนำบางอย่างถึงใช้ได้ บทความจะพาไปดูหลักฐาน กลไก และการนำไปใช้ด้วยภาษาที่เข้าใจง่าย โดยไม่ลดทอนความหมายทางวิทยาศาสตร์', read: 'อ่าน', explore: 'ดูบทความ',
    noArticleTitle: 'พื้นที่สำหรับบทความที่พร้อมใช้งาน', noArticleText: 'บทความเชิงลึกเผยแพร่แยกจาก Manga จึงไม่จำเป็นต้องมีบทความคู่กับทุกตอน',
    labTitle: <>เมื่อท่าฝึกรู้สึกไม่เข้ากับตัวเอง</>, labIntro: 'เริ่มจากคำถามที่เจอจริง วัดเฉพาะข้อมูลที่จำเป็น แล้วดูว่า Setup หรือทางเลือกแบบไหนควรลองต่อในการฝึกจริง โดยไม่ต้องรู้ศัพท์เฉพาะทางมาก่อน',
    c1: 'ทำไมบางท่าถึงรู้สึกไม่เข้ากับโครงสร้างร่างกายของคุณ?', c2: 'ท่า Squat แบบไหนควรลองก่อน?', c3: 'ถ้าไหล่หรือเอวเปลี่ยน สัดส่วน V (V-shape) จะเปลี่ยนอย่างไร?',
    trainingTitle: <>จาก Program<br/>สู่การตัดสินใจ<br/>ครั้งต่อไป</>, trainingText: 'ตั้งค่า Program จากเป้าหมาย เวลาที่มี และอุปกรณ์ของคุณ แล้วบันทึกผลที่ทำได้จริงหลังฝึก ระบบจะช่วยบอกว่าครั้งต่อไปควรเพิ่มน้ำหนัก เพิ่มจำนวนครั้ง คงไว้ หรือทบทวนบางอย่างก่อน', trainingCta: 'เริ่ม TRAINING ฟรี',
    kendoTitle: <>คนจริงเบื้องหลัง KDKAMATO</>, kendoText: 'หลักฐาน ประสบการณ์ และการนำไปใช้',
    portal: <>ตอนนี้อยากแก้โจทย์ไหนต่อ?</>
  },
  en: {
    heroTitle: <>KNOW WHAT TO TRAIN.<br/>KNOW WHAT TO DO<span>NEXT.</span></>,
    heroLede: 'KDKAMATO builds your training around your goal, available time, and equipment, then uses your real training results to help guide what to keep, increase, or reduce next.',
    enter: 'SCROLL TO SEE HOW DECISIONS GET MADE',
    latestEyebrow: 'MANGA / LATEST', latestTitle: <>LATEST<br/>FROM THE UNIVERSE</>, readEpisode: 'READ EPISODE', viewManga: 'VIEW ALL MANGA',
    noMangaTitle: 'YOUR PUBLISHED MANGA LIBRARY', noMangaText: 'Published episodes will appear here automatically.', waiting: 'Waiting for published content',
    knowledgeTitle: <>UNDERSTAND<br/>THE WHY.</>, knowledgeIntro: 'When you want to understand why a recommendation makes sense, go deeper into the evidence, mechanisms, and practical meaning without flattening the science.', read: 'READ', explore: 'EXPLORE',
    noArticleTitle: 'ARTICLE LIBRARY READY', noArticleText: 'Deep dives publish independently. Daily Manga does not require a matching article.',
    labTitle: <>WHEN AN EXERCISE<br/>DOESN’T FIT.</>, labIntro: 'Start with the problem you actually feel, measure only what matters, and see which setup or alternative is worth testing next in real training.',
    c1: 'Why do some exercises feel awkward for your structure?', c2: 'Which Squat setup is worth testing first?', c3: 'Want a stronger V-shape? What should change?',
    trainingTitle: <>FROM PROGRAM<br/>TO THE<br/>NEXT DECISION.</>, trainingText: 'Build your program around your goal, time, and equipment. Log what actually happened, then use the guidance to decide whether to add load, build reps, hold steady, or review something first.', trainingCta: 'START TRAINING FREE',
    kendoTitle: <>THE HUMAN<br/>BEHIND<br/>KDKAMATO.</>, kendoText: 'Evidence. Experience. Application.',
    portal: <>WHAT DO YOU WANT<br/>TO SOLVE NEXT?</>
  }
};

function MangaPlaceholder({ language }) {
  return (
    <div className="manga-cover manga-feed-placeholder">
      <div className="cover-grid" />
      <div className="cover-copy"><span>{language === 'en' ? 'CONTENT FEED READY' : 'พร้อมแสดงตอนที่เผยแพร่แล้ว'}</span><strong>MANGA_WEB</strong><small>{language === 'en' ? 'Published episodes appear here automatically.' : 'เมื่อตอนถูกเผยแพร่ ระบบจะแสดงที่นี่โดยอัตโนมัติ'}</small></div>
    </div>
  );
}

export default function HomePage({ manga = [], articles = [], language = 'th' }) {
  const motionRoot = useHomeMotion();
  const c = copy[language] || copy.th;
  const latest = manga[0];
  const previous = manga.slice(1, 4);
  return (
    <main id="main-content" tabIndex={-1} className="home-page" ref={motionRoot}>
      <section className="hero">
        <div className="hero-image" />
        <div className="hero-vignette" />
        <div className="hero-copy shell">
          <p className="eyebrow">KDKAMATO / REBIRTH</p>
          <h1>{c.heroTitle}</h1>
          <p className="lede">{c.heroLede}</p>
          <a className="text-cta" href="#descent">{c.enter} <span>↓</span></a>
        </div>
      </section>

      <Descent language={language} />

      <section className="manga section shell" id="manga">
        <div className="section-heading"><p className="eyebrow">{c.latestEyebrow}</p><h2>{c.latestTitle}</h2></div>
        <article className="manga-feature">
          {latest?.cover ? <img className="manga-cover real-cover" src={latest.cover.url} alt={localizedField(latest, 'Title', language) || latest.Episode_ID} /> : <MangaPlaceholder language={language} />}
          <div className="manga-feature-copy">
            <p className="meta">{latest ? `${latest.Episode_ID} / ${localizedField(latest, 'Topic', language) || 'KDKAMATO'}` : 'KDKAMATO / MANGA'}</p>
            <h3>{latest ? localizedField(latest, 'Title', language) : c.noMangaTitle}</h3>
            <p>{latest ? localizedField(latest, 'Short_Description', language) : c.noMangaText}</p>
            {latest ? <Link className="text-cta" href={`/manga/${latest.Slug}`}>{c.readEpisode} <span>→</span></Link> : <Link className="text-cta" href="/manga">{c.viewManga} <span>→</span></Link>}
          </div>
        </article>
        <div className="manga-row">
          {previous.length ? previous.map((ep) => (
            <Link className="manga-card" key={ep.Episode_ID} href={`/manga/${ep.Slug}`}>
              {ep.cover ? <img className="mini-cover image-cover" src={ep.cover.url} alt="" /> : <div className="mini-cover"><span>{ep.Episode_ID}</span></div>}
              <p>{localizedField(ep, 'Title', language)}</p>
            </Link>
          )) : [1,2,3].map((i) => <div className="manga-card muted-card" key={i}><div className="mini-cover"><span>EP.</span><b>—</b></div><p>{c.waiting}</p></div>)}
        </div>
        <Link className="section-link" href="/manga">{c.viewManga} <span>→</span></Link>
      </section>

      <section className="knowledge section" id="knowledge">
        <div className="shell">
          <div className="section-heading compact"><p className="eyebrow">KNOWLEDGE</p><h2>{c.knowledgeTitle}</h2><p className="section-intro">{c.knowledgeIntro}</p></div>
          <KnowledgeSwitcher language={language} />
          <div className="article-grid">
            {(articles.length ? articles.slice(0,3) : [null,null,null]).map((article, i) => article ? (
              <article className="home-article-card" key={article.Article_ID}>
                <Link className="home-article-cover-link" href={`/knowledge/${article.Slug}`} aria-label={localizedField(article, 'Title', language)}>
                  {article.cover ? <img className="home-article-cover" src={article.cover.url} alt={localizedField(article, 'Title', language)} loading="lazy" decoding="async" /> : <div className="home-article-cover home-article-cover-placeholder" aria-hidden="true" />}
                </Link>
                <h3>{localizedField(article, 'Title', language)}</h3>
                <p>{localizedField(article, 'Summary', language)}</p>
                <Link href={`/knowledge/${article.Slug}`}>{c.read} →</Link>
              </article>
            ) : (
              <article className="home-article-card" key={i}><div className="home-article-cover home-article-cover-placeholder" aria-hidden="true" /><h3>{c.noArticleTitle}</h3><p>{c.noArticleText}</p><Link href="/knowledge">{c.explore} →</Link></article>
            ))}
          </div>
        </div>
      </section>

      <section className="lab section" id="lab">
        <div className="lab-grid-bg" />
        <div className="shell lab-shell">
          <div className="section-heading compact"><p className="eyebrow cyan">KDKAMATO LAB</p><h2>{c.labTitle}</h2><p className="section-intro">{c.labIntro}</p></div>
          <LabPreview language={language} />
          <div className="tool-teasers"><Link href="/lab/exercise-fit"><span>C1</span>{c.c1} <b>→</b></Link><Link href="/lab/squat-geometry"><span>C2</span>{c.c2} <b>→</b></Link><Link href="/lab/physique-goal"><span>C3</span>{c.c3} <b>→</b></Link></div>
        </div>
      </section>

      <div className={styles.story} data-home-story>
        <section className={styles.chapter} id="training" data-story-chapter>
          <div className={styles.frame}>
            <img className={styles.art} src="/assets/a10_training.webp" alt="" decoding="async" />
            <div className={styles.copy}>
              <p className="eyebrow orange">TRAINING</p>
              <h2>{c.trainingTitle}</h2>
              <div className={styles.note}>
                <p className="meta">KDKAMATO TRAINING</p>
                <p>{c.trainingText}</p>
                <Link className={styles.cta} href="/training">{c.trainingCta} <span>↗</span></Link>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.chapter} id="kendo" data-story-chapter>
          <div className={styles.frame}>
            <img className={styles.art} src="/assets/a11_real_kendo.webp" alt="" decoding="async" />
            <div className={styles.copy}>
              <p className="eyebrow orange">REAL KENDO</p>
              <h2>{c.kendoTitle}</h2>
              <p>{c.kendoText}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="portal section shell"><p className="eyebrow">{language === 'en' ? 'EXPLORE' : 'ไปต่อ'}</p><h2>{c.portal}</h2><div className="portal-links"><Link href="/manga"><span>MANGA</span><b>→</b></Link><Link href="/knowledge"><span>KNOWLEDGE</span><b>→</b></Link><Link href="/lab"><span>LAB</span><b>→</b></Link><Link href="/training"><span>TRAINING</span><b>→</b></Link></div></section>
    </main>
  );
}
