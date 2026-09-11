import Link from "next/link";
import type { CSSProperties } from "react";
import SiteHeader from "@/components/SiteHeader";
import { GuideMotion } from "@/components/guide-motion";
import {
  guideEntryCards,
  guideHero,
  guideJourney,
  guideSections,
  textFor,
  type GuideLanguage,
} from "@/lib/guide-registry";
import { getLanguage } from "@/lib/language";
import styles from "./guide.module.css";

export const metadata = {
  title: "KDKAMATO Guide",
  description: "Interactive guide for KDKAMATO LAB, Program, Progress, PRO Review, Knowledge, and Manga.",
};

function audienceLabel(language: GuideLanguage, audience: "ALL" | "FREE" | "PRO") {
  if (audience === "FREE") return "FREE";
  if (audience === "PRO") return "PRO";
  return language === "en" ? "ALL" : "ทุกคน";
}

export default async function GuidePage() {
  const language = (await getLanguage()) as GuideLanguage;
  const t = (value: { th: string; en: string }) => textFor(language, value);

  return (
    <>
      <SiteHeader language={language} />
      <GuideMotion />
      <main className={styles.page}>
        <section className={styles.hero}>
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
          <div className={styles.signal} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className={styles.journeySection} id="start">
          <div className={styles.sectionHead} data-guide-reveal>
            <p className={styles.eyebrow}>{language === "en" ? "ONE SIMPLE MODEL" : "จำแค่หลักเดียว"}</p>
            <h2>{language === "en" ? "KDKAMATO turns information into a testable decision." : "KDKAMATO เปลี่ยนข้อมูลให้กลายเป็นสิ่งที่เอาไปลองได้จริง"}</h2>
            <p>{language === "en" ? "Not input → answer. The useful loop is input → context → decision → real-world test." : "ไม่ใช่กรอกข้อมูล → ได้คำตอบทันที แต่เป็น ข้อมูล → บริบท → การตัดสินใจ → ทดลองจริง"}</p>
          </div>

          <div className={styles.journey}>
            {guideJourney.map((step, index) => (
              <article key={step.key} className={styles.journeyCard} data-guide-reveal style={{ "--delay": `${index * 80}ms` } as CSSProperties}>
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
            <p className={styles.eyebrow}>{language === "en" ? "CHOOSE BY INTENT" : "เลือกจากสิ่งที่อยากทำ"}</p>
            <h2>{language === "en" ? "You do not need to learn the whole system first." : "ไม่ต้องเรียนรู้ทั้งระบบก่อนถึงจะเริ่มใช้ได้"}</h2>
          </div>
          <div className={styles.topicGrid}>
            {guideEntryCards.map((card, index) => (
              <Link key={card.id} className={styles.topicCard} href={`#${card.id}`} data-guide-reveal style={{ "--delay": `${index * 55}ms` } as CSSProperties}>
                <span className={`${styles.badge} ${card.audience === "PRO" ? styles.proBadge : ""}`}>{audienceLabel(language, card.audience)}</span>
                <h3>{t(card.label)}</h3>
                <p>{t(card.detail)}</p>
                <strong>{language === "en" ? "GO TO GUIDE" : "ไปที่หัวข้อนี้"} <span>↓</span></strong>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.tierSection}>
          <div className={styles.tierIntro} data-guide-reveal>
            <p className={styles.eyebrow}>FREE / PRO</p>
            <h2>{language === "en" ? "Not two separate systems." : "ไม่ใช่คนละระบบ"}</h2>
            <p>{language === "en"
              ? "FREE builds the same useful loop: Program, LAB, and Progress. PRO adds deeper review across more signals and longer history."
              : "FREE ใช้แกนเดียวกันคือ Program + LAB + Progress ส่วน PRO เพิ่มการทบทวนหลายข้อมูลและประวัติที่ยาวขึ้น ไม่ได้บังคับให้เริ่มใหม่"}</p>
          </div>
          <div className={styles.tierCards}>
            <article className={styles.freeTier} data-guide-reveal>
              <span>FREE</span>
              <h3>{language === "en" ? "Build the loop" : "สร้างวงจรใช้งานให้ครบ"}</h3>
              <p>{language === "en" ? "Set your Program, use LAB when a specific question appears, and feed real outcomes back through Progress." : "ตั้ง Program ใช้ LAB เมื่อมีคำถามเฉพาะ และส่งผลจริงกลับเข้าระบบผ่าน Progress"}</p>
            </article>
            <article className={styles.proTier} data-guide-reveal>
              <span>PRO</span>
              <h3>{language === "en" ? "Deepen the review" : "เพิ่มความลึกในการทบทวน"}</h3>
              <p>{language === "en" ? "Review progress, training response, LAB context, Exercise Memory, and Program history together before deciding what should change." : "นำความคืบหน้า ผลการฝึก LAB Exercise Memory และประวัติ Program มาดูร่วมกันก่อนตัดสินใจว่าจะปรับอะไร"}</p>
            </article>
          </div>
        </section>

        <section className={styles.detailSection}>
          <aside className={styles.detailNav} aria-label={language === "en" ? "Guide sections" : "หัวข้อคู่มือ"}>
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
                  <div>
                    <small>{language === "en" ? "WHY" : "ทำไมต้องใช้"}</small>
                    <p>{t(section.why)}</p>
                  </div>
                  <div>
                    <small>{language === "en" ? "WHEN" : "ใช้เมื่อไหร่"}</small>
                    <p>{t(section.when)}</p>
                  </div>
                </div>

                <ol className={styles.steps}>
                  {section.steps.map((step, index) => (
                    <li key={`${section.id}-${index}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{t(step)}</p>
                    </li>
                  ))}
                </ol>

                <div className={styles.outcome}>
                  <small>{language === "en" ? "WHAT YOU SHOULD GET" : "สุดท้ายควรได้อะไร"}</small>
                  <p>{t(section.outcome)}</p>
                </div>

                <div className={styles.linkRow}>
                  {section.links.map((link) => (
                    <Link key={link.href} className={link.tone === "primary" ? styles.primaryButton : styles.secondaryButton} href={link.href}>
                      {t(link.label)} <span>→</span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} data-guide-reveal>
          <p className={styles.eyebrow}>{language === "en" ? "START WHERE YOU ARE" : "เริ่มจากจุดที่คุณอยู่ตอนนี้"}</p>
          <h2>{language === "en" ? "The guide should disappear once you know your next action." : "คู่มือที่ดีควรหายไปจากความสนใจ เมื่อคุณรู้แล้วว่าต้องทำอะไรต่อ"}</h2>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/lab">{language === "en" ? "OPEN LAB" : "เปิด LAB"} <span>→</span></Link>
            <Link className={styles.secondaryButton} href="/program/start">{language === "en" ? "START PROGRAM" : "เริ่ม Program"} <span>→</span></Link>
          </div>
        </section>
      </main>
    </>
  );
}
