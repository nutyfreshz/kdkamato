import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { GuideMotion } from "@/components/guide-motion";
import {
  guideEntryCards,
  guideHero,
  guideJourney,
  guideSections,
  textFor,
} from "@/lib/guide-registry";
import { getLanguage } from "@/lib/language";
import { kdkBackground } from "@/lib/kdk-background";
import styles from "./guide.module.css";

export const metadata = {
  title: "KDKAMATO Guideline",
  description: "Interactive guideline for KDKAMATO LAB, Program, Progress, and PRO Review.",
};

function audienceLabel(language, audience) {
  if (audience === "FREE") return "FREE";
  if (audience === "PRO") return "PRO";
  return language === "en" ? "ALL" : "ทุกคน";
}

export default async function GuidePage() {
  const language = await getLanguage();
  const t = (value) => textFor(language, value);
  const heroBackground = {
    backgroundImage: `linear-gradient(90deg, rgba(8,9,10,.90) 0%, rgba(8,9,10,.64) 40%, rgba(8,9,10,.30) 70%, rgba(8,9,10,.48) 100%), url("${kdkBackground}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <>
      <SiteHeader language={language} />
      <GuideMotion />
      <main className={styles.page}>
        <section className={styles.hero} style={heroBackground}>
          <div className={styles.gridGlow} aria-hidden="true" />
          <div className={styles.heroInner} data-guide-reveal>
            <p className={styles.eyebrow}>{t(guideHero.eyebrow)}</p>
            <h1>{t(guideHero.title)}</h1>
            <p className={styles.heroIntro}>{t(guideHero.intro)}</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="#start">{t(guideHero.primaryCta)} <span>↓</span></Link>
              <Link className={styles.secondaryButton} href="#topics">{t(guideHero.secondaryCta)} <span>→</span></Link>
            </div>
          </div>
          <div className={styles.signal} aria-hidden="true"><span /><span /><span /></div>
        </section>

        <section className={styles.journeySection} id="start">
          <div className={styles.sectionHead} data-guide-reveal>
            <p className={styles.eyebrow}>{language === "en" ? "ONE SIMPLE MODEL" : "หลักการทำงาน"}</p>
            <h2>{language === "en" ? "KDKAMATO turns information into a testable decision." : "KDKAMATO ไม่ได้ตัดสินจากตัวเลขเดียว"}</h2>
            <p>{language === "en" ? "Not input → answer. The useful loop is input → context → decision → real-world test." : "เราเอาข้อมูลมาดูร่วมกับเป้าหมายของคุณ แล้วแนะนำสิ่งที่น่าลอง จากนั้นใช้ผลจริงของคุณตัดสินต่อ"}</p>
          </div>
          <div className={styles.journey}>
            {guideJourney.map((step, index) => (
              <article key={step.key} className={styles.journeyCard} data-guide-reveal style={{ "--delay": `${index * 80}ms` }}>
                <span className={styles.stepNumber}>{step.key}</span>
                <h3>{t(step.title)}</h3>
                <p>{t(step.copy)}</p>
                {index < guideJourney.length - 1 && <span className={styles.connector} aria-hidden="true">→</span>}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.topicSection} id="topics">
          <div className={styles.sectionHead} data-guide-reveal>
            <p className={styles.eyebrow}>{language === "en" ? "CHOOSE BY INTENT" : "เลือกจากสิ่งที่อยากรู้"}</p>
            <h2>{language === "en" ? "You do not need to learn the whole system first." : "เลือกเรื่องที่ต้องใช้ แล้วเริ่มจากตรงนั้นได้เลย"}</h2>
          </div>
          <div className={styles.topicGrid}>
            {guideEntryCards.map((card, index) => (
              <Link key={card.id} className={styles.topicCard} href={`#${card.id}`} data-guide-reveal style={{ "--delay": `${index * 55}ms` }}>
                <span className={`${styles.badge} ${card.audience === "PRO" ? styles.proBadge : ""}`}>{audienceLabel(language, card.audience)}</span>
                <h3>{t(card.label)}</h3>
                <p>{t(card.detail)}</p>
                <strong>{language === "en" ? "GO TO GUIDE" : "อ่านหัวข้อนี้"} <span>↓</span></strong>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.tierSection}>
          <div className={styles.tierIntro} data-guide-reveal>
            <p className={styles.eyebrow}>FREE / PRO</p>
            <h2>{language === "en" ? "Not two separate systems." : "FREE และ PRO ใช้ระบบเดียวกัน"}</h2>
            <p>{language === "en"
              ? "FREE builds the same useful loop: Program, LAB, and Progress. PRO adds deeper review across more signals and longer history."
              : "FREE มี Program, LAB และ Progress ครบสำหรับใช้งานหลัก ส่วน PRO เพิ่มการดูข้อมูลหลายด้านและประวัติที่ยาวขึ้น เพื่อช่วยตัดสินใจก่อนปรับ Program"}</p>
          </div>
          <div className={styles.tierCards}>
            <article className={styles.freeTier} data-guide-reveal>
              <span>FREE</span>
              <h3>{language === "en" ? "Build the loop" : "ใช้ครบตั้งแต่เริ่มจนดูผล"}</h3>
              <p>{language === "en" ? "Set your Program, use LAB when a specific question appears, and feed real outcomes back through Progress." : "ตั้ง Program ใช้ LAB เมื่อต้องการตอบคำถามเฉพาะ แล้วดูผลจริงผ่าน Progress"}</p>
            </article>
            <article className={styles.proTier} data-guide-reveal>
              <span>PRO</span>
              <h3>{language === "en" ? "Deepen the review" : "ช่วยดูภาพรวมให้ลึกขึ้น"}</h3>
              <p>{language === "en" ? "Review progress, training response, LAB context, Exercise Memory, and Program history together before deciding what should change." : "เอาความคืบหน้า ผลการฝึก LAB, Exercise Memory และประวัติ Program มาดูพร้อมกันก่อนตัดสินใจว่าจะปรับอะไร"}</p>
            </article>
          </div>
        </section>

        <section className={styles.detailSection}>
          <aside className={styles.detailNav} aria-label={language === "en" ? "Guideline sections" : "หัวข้อ Guideline"}>
            <p>{language === "en" ? "JUMP TO" : "ไปที่"}</p>
            {guideSections.map((section) => <Link key={section.id} href={`#${section.id}`}>{section.number} · {t(section.eyebrow)}</Link>)}
          </aside>

          <div className={styles.detailList}>
            {guideSections.map((section) => (
              <article key={section.id} className={styles.detailCard} id={section.id} data-guide-reveal>
                <div className={styles.detailMeta}>
                  <span>{section.number}</span>
                  <b className={section.audience === "PRO" ? styles.proText : ""}>{t(section.eyebrow)}</b>
                </div>
                <h2>{t(section.title)}</h2>
                <div className={styles.explainGrid}>
                  <div><small>{language === "en" ? "WHY" : "ช่วยอะไร"}</small><p>{t(section.why)}</p></div>
                  <div><small>{language === "en" ? "WHEN" : "ใช้เมื่อไหร่"}</small><p>{t(section.when)}</p></div>
                </div>
                <ol className={styles.steps}>
                  {section.steps.map((step, index) => (
                    <li key={`${section.id}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{t(step)}</p></li>
                  ))}
                </ol>
                <div className={styles.outcome}>
                  <small>{language === "en" ? "WHAT YOU SHOULD GET" : "สุดท้ายควรได้อะไร"}</small>
                  <p>{t(section.outcome)}</p>
                </div>
                {section.links.length > 0 && (
                  <div className={styles.linkRow}>
                    {section.links.map((link) => (
                      <Link key={link.href} className={link.tone === "primary" ? styles.primaryButton : styles.secondaryButton} href={link.href}>
                        {t(link.label)} <span>→</span>
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} data-guide-reveal>
          <p className={styles.eyebrow}>{language === "en" ? "START WHERE YOU ARE" : "พร้อมแล้วค่อยไปใช้จริง"}</p>
          <h2>{language === "en" ? "The guide should disappear once you know your next action." : "ถ้าเข้าใจแล้วว่าควรเริ่มตรงไหน ก็ไปใช้เครื่องมือได้เลย"}</h2>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/lab">{language === "en" ? "OPEN LAB" : "เปิด LAB"} <span>→</span></Link>
            <Link className={styles.secondaryButton} href="/program/start">{language === "en" ? "START PROGRAM" : "เริ่ม Program"} <span>→</span></Link>
          </div>
        </section>
      </main>
    </>
  );
}
