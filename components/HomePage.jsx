'use client';

import Link from 'next/link';
import Descent from './Descent';
import KnowledgeSwitcher from './KnowledgeSwitcher';
import LabPreview from './LabPreview';
import { localizedField } from '../lib/localize';

const copy = {
  th: {
    heroTitle: <>สิ่งที่คุณเห็นเป็นเพียง<span>ปลายทาง</span></>,
    heroLede: 'เบื้องหลังการเปลี่ยนแปลงของร่างกาย มีทั้งการฝึก โภชนาการ การฟื้นตัว และการตอบสนองที่เกิดขึ้นภายใน',
    enter: 'ดูว่าเบื้องหลังผลลัพธ์เหล่านี้เกิดอะไรขึ้น',
    latestEyebrow: 'MANGA / ตอนล่าสุด', latestTitle: <>เรื่องล่าสุด<br/>จาก KDKAMATO</>, readEpisode: 'อ่านตอนนี้', viewManga: 'ดู MANGA ทั้งหมด',
    noMangaTitle: 'พื้นที่สำหรับ Manga ที่เผยแพร่แล้ว', noMangaText: 'ตอนที่ผ่านการเผยแพร่จะปรากฏที่นี่โดยอัตโนมัติ', waiting: 'รอตอนที่เผยแพร่',
    knowledgeTitle: <>เข้าใจให้<br/>ลึกกว่าเดิม</>, knowledgeIntro: 'บทความที่อธิบายหลักฐาน กลไก และความหมายเชิงปฏิบัติ โดยไม่ทำให้วิทยาศาสตร์ตื้นลง', read: 'อ่าน', explore: 'ดูบทความ',
    noArticleTitle: 'พื้นที่บทความพร้อมใช้งาน', noArticleText: 'บทความเชิงลึกเผยแพร่แยกจาก Manga จึงไม่จำเป็นต้องมีบทความคู่กับทุกตอน',
    labTitle: <>ใช้ข้อมูลของคุณ<br/>หาคำตอบที่เอาไปลองได้จริง</>, labIntro: 'เริ่มจากคำถามที่คุณสงสัย วัดเฉพาะค่าที่จำเป็น แล้วดูว่าควรลองอะไรต่อในยิม',
    c1: 'ทำไมบางท่าถึงรู้สึกไม่เข้ากับคุณ?', c2: 'Squat แบบไหน หรือ setup ไหนควรลองก่อน?', c3: 'อยากให้หุ่นดู V ขึ้น ควรพัฒนาอะไร?',
    trainingTitle: <>เปลี่ยนความรู้<br/>ให้เป็น<br/>การลงมือทำ</>, trainingText: 'ส่วน Training จะรวบรวมโปรแกรมและแนวทางนำความรู้ไปใช้จริง เมื่อเนื้อหาผ่านการตรวจและพร้อมเผยแพร่', trainingCta: 'ดู TRAINING',
    kendoTitle: <>คนจริง<br/>เบื้องหลัง<br/>KDKAMATO</>, kendoText: 'หลักฐาน ประสบการณ์ และการประยุกต์ใช้',
    portal: <>อยากไปดู<br/>อะไรต่อ?</>
  },
  en: {
    heroTitle: <>WHAT YOU SEE<br/>IS ONLY THE<br/><span>OUTCOME.</span></>,
    heroLede: 'The visible body is the end of a process shaped by training, signaling, cellular response, nutrition, and recovery.',
    enter: 'ENTER THE UNIVERSE',
    latestEyebrow: 'MANGA / LATEST', latestTitle: <>LATEST<br/>FROM THE UNIVERSE</>, readEpisode: 'READ EPISODE', viewManga: 'VIEW ALL MANGA',
    noMangaTitle: 'YOUR PUBLISHED MANGA LIBRARY', noMangaText: 'Published episodes will appear here automatically.', waiting: 'Waiting for published content',
    knowledgeTitle: <>GO<br/>DEEPER.</>, knowledgeIntro: 'Evidence, mechanisms, and practical meaning behind the stories, explained without flattening the science.', read: 'READ', explore: 'EXPLORE',
    noArticleTitle: 'ARTICLE LIBRARY READY', noArticleText: 'Deep dives publish independently. Daily Manga does not require a matching article.',
    labTitle: <>TEST<br/>YOURSELF.</>, labIntro: 'Start with a question, enter measurements you can actually take, and see how they change movement, proportions, or interpretation without needing technical vocabulary first.',
    c1: 'Why do some exercises feel awkward for your structure?', c2: 'Which Squat setup is worth testing first?', c3: 'Want a stronger V-shape? What should change?',
    trainingTitle: <>KNOWLEDGE<br/>INTO<br/>APPLICATION.</>, trainingText: 'Training programs and practical application will live here once the material has been reviewed and is ready to publish.', trainingCta: 'EXPLORE TRAINING',
    kendoTitle: <>THE HUMAN<br/>BEHIND<br/>KDKAMATO.</>, kendoText: 'Evidence. Experience. Application.',
    portal: <>WHERE DO YOU<br/>WANT TO GO NEXT?</>
  }
};

function MangaPlaceholder({ language }) {
  return (
    <div className="manga-cover manga-feed-placeholder">
      <div className="cover-grid" />
      <div className="cover-copy"><span>{language === 'en' ? 'CONTENT FEED READY' : 'พร้อมแสดงตอนที่เผยแพร่'}</span><strong>MANGA_WEB</strong><small>{language === 'en' ? 'Published episodes appear here automatically.' : 'เมื่อสถานะตอนเป็น PUBLISHED ระบบจะแสดงที่หน้านี้อัตโนมัติ'}</small></div>
    </div>
  );
}

export default function HomePage({ manga = [], articles = [], language = 'th' }) {
  const c = copy[language] || copy.th;
  const latest = manga[0];
  const previous = manga.slice(1, 4);
  return (
    <main>
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
      <div className="breather" />

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
              <article key={article.Article_ID}><p className="meta">{localizedField(article, 'Topic', language)}</p><h3>{localizedField(article, 'Title', language)}</h3><p>{localizedField(article, 'Summary', language)}</p><Link href={`/knowledge/${article.Slug}`}>{c.read} →</Link></article>
            ) : (
              <article key={i}><p className="meta">KDKAMATO KNOWLEDGE</p><h3>{c.noArticleTitle}</h3><p>{c.noArticleText}</p><Link href="/knowledge">{c.explore} →</Link></article>
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

      <section className="training section" id="training">
        <div className="training-image" /><div className="training-shade" />
        <div className="shell training-copy"><p className="eyebrow orange">TRAINING</p><h2>{c.trainingTitle}</h2><div className="program-note"><p className="meta">KDKAMATO TRAINING</p><h3>KDKAMATO TRAINING</h3><p>{c.trainingText}</p><Link className="text-cta" href="/training">{c.trainingCta} <span>→</span></Link></div></div>
      </section>

      <section className="kendo section" id="kendo">
        <div className="kendo-image" /><div className="kendo-shade" />
        <div className="shell kendo-copy"><p className="eyebrow orange">REAL KENDO</p><h2>{c.kendoTitle}</h2><p>{c.kendoText}</p></div>
      </section>

      <section className="portal section shell"><p className="eyebrow">{language === 'en' ? 'EXPLORE' : 'ไปต่อ'}</p><h2>{c.portal}</h2><div className="portal-links"><Link href="/manga"><span>MANGA</span><b>→</b></Link><Link href="/knowledge"><span>KNOWLEDGE</span><b>→</b></Link><Link href="/lab"><span>LAB</span><b>→</b></Link><Link href="/training"><span>TRAINING</span><b>→</b></Link></div></section>
    </main>
  );
}
