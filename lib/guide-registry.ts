export type GuideLanguage = "th" | "en";
export type GuideAudience = "ALL" | "FREE" | "PRO";

type Localized = { th: string; en: string };

export type GuideLink = {
  label: Localized;
  href: string;
  tone?: "primary" | "secondary";
};

export type GuideSection = {
  id: string;
  audience: GuideAudience;
  number: string;
  eyebrow: Localized;
  title: Localized;
  why: Localized;
  when: Localized;
  steps: Localized[];
  outcome: Localized;
  links: GuideLink[];
};

export const guideHero = {
  eyebrow: { th: "KDKAMATO GUIDE", en: "KDKAMATO GUIDE" },
  title: {
    th: "เข้าใจว่าทำไม ก่อนรู้ว่าต้องทำอะไร",
    en: "Understand why before deciding what to do",
  },
  intro: {
    th: "นี่ไม่ใช่คู่มือที่ต้องอ่านตั้งแต่ต้นจนจบ เลือกสิ่งที่คุณกำลังทำ แล้วไปยังเครื่องมือหรือ Program จุดนั้นได้ทันที",
    en: "This is not a manual you need to read from cover to cover. Pick what you are trying to do and jump straight to the relevant tool or Program step.",
  },
  primaryCta: { th: "เริ่มใน 60 วินาที", en: "Start in 60 seconds" },
  secondaryCta: { th: "เลือกหัวข้อ", en: "Choose a topic" },
};

export const guideJourney = [
  {
    key: "01",
    title: { th: "ข้อมูล", en: "INPUT" },
    copy: { th: "บอกระบบเฉพาะสิ่งที่จำเป็น", en: "Give the system only what it needs" },
  },
  {
    key: "02",
    title: { th: "บริบท", en: "CONTEXT" },
    copy: { th: "ตีความข้อมูลตามเป้าหมายและสถานการณ์", en: "Interpret it in your goal and training context" },
  },
  {
    key: "03",
    title: { th: "การตัดสินใจ", en: "DECISION" },
    copy: { th: "เลือกสิ่งที่ควรลองก่อน ไม่ใช่เดาจากตัวเลขเดียว", en: "Prioritize what is worth trying instead of guessing from one number" },
  },
  {
    key: "04",
    title: { th: "ทดลองจริง", en: "TEST" },
    copy: { th: "เอาคำแนะนำไปใช้ แล้วดูผลตอบสนองจริง", en: "Apply it and observe your real response" },
  },
];

export const guideEntryCards = [
  {
    id: "lab",
    audience: "FREE" as GuideAudience,
    label: { th: "อยากเข้าใจร่างกายหรือเลือกสิ่งที่ควรลอง", en: "Understand your body or choose what to test" },
    detail: { th: "เริ่มจาก LAB", en: "Start with LAB" },
  },
  {
    id: "program",
    audience: "FREE" as GuideAudience,
    label: { th: "อยากสร้างหรือใช้ Program", en: "Build or use your Program" },
    detail: { th: "เริ่มจากข้อมูลพื้นฐาน → Preview → Activate", en: "Baseline → Preview → Activate" },
  },
  {
    id: "progress",
    audience: "FREE" as GuideAudience,
    label: { th: "อยากติดตามว่ากำลังไปถูกทางไหม", en: "Track whether you are moving in the right direction" },
    detail: { th: "ใช้ Progress เป็น feedback loop", en: "Use Progress as the feedback loop" },
  },
  {
    id: "pro",
    audience: "PRO" as GuideAudience,
    label: { th: "อยากให้มีการทบทวนหลายข้อมูลร่วมกัน", en: "Combine multiple signals into a deeper review" },
    detail: { th: "ใช้ PRO Review", en: "Use PRO Review" },
  },
  {
    id: "knowledge",
    audience: "ALL" as GuideAudience,
    label: { th: "อยากเข้าใจหลักการก่อนใช้เครื่องมือ", en: "Understand the principle before using a tool" },
    detail: { th: "ไป Knowledge / Manga", en: "Go to Knowledge / Manga" },
  },
];

export const guideSections: GuideSection[] = [
  {
    id: "lab",
    audience: "FREE",
    number: "01",
    eyebrow: { th: "LAB · FREE", en: "LAB · FREE" },
    title: { th: "ใช้ LAB เมื่อต้องการรู้ว่าอะไรควรลองต่อ", en: "Use LAB when you need to know what is worth testing next" },
    why: {
      th: "LAB ไม่ได้มีไว้แค่คำนวณตัวเลข ค่าที่วัดได้เป็นบริบทเพื่อช่วยจัดลำดับสิ่งที่ควรทดลองกับการฝึกจริง",
      en: "LAB is not just a calculator. Measurements provide context that helps prioritize what is worth testing in real training.",
    },
    when: {
      th: "ใช้เมื่อมีคำถามเฉพาะ เช่น Squat setup ไหนควรลองก่อน หรือสัดส่วนร่างกายกำลังบอกอะไรได้บ้าง",
      en: "Use it for a specific question, such as which Squat setup to compare first or what a body proportion can actually tell you.",
    },
    steps: [
      { th: "เลือกคำถามที่คุณอยากรู้ ไม่ต้องทำทุกเครื่องมือ", en: "Pick the question you care about. You do not need every tool." },
      { th: "กรอกเฉพาะค่าที่จำเป็น ค่าบางอย่างจะถูกนำไปใช้ต่อใน LAB ที่เกี่ยวข้อง", en: "Enter only what is needed. Some measurements are reused by related LAB tools." },
      { th: "อ่านผลในรูปแบบ “ควรลองอะไรต่อ” แล้วเปรียบเทียบกับผลตอบสนองจริง", en: "Read the result as “what should I test next?” and compare it with your real response." },
    ],
    outcome: {
      th: "เป้าหมายคือได้ next experiment ที่ชัดขึ้น ไม่ใช่ได้เลขที่ดูแม่นแต่เอาไปใช้ต่อไม่ได้",
      en: "The goal is a clearer next experiment, not a precise-looking number with no useful next action.",
    },
    links: [
      { label: { th: "เปิด KDKAMATO LAB", en: "Open KDKAMATO LAB" }, href: "/lab", tone: "primary" },
      { label: { th: "ลอง Exercise Fit", en: "Try Exercise Fit" }, href: "/lab/exercise-fit" },
      { label: { th: "ลอง Squat Setup", en: "Try Squat Setup" }, href: "/lab/squat-geometry" },
    ],
  },
  {
    id: "program",
    audience: "FREE",
    number: "02",
    eyebrow: { th: "PROGRAM · FREE", en: "PROGRAM · FREE" },
    title: { th: "Program เริ่มจากข้อมูลของคุณ ไม่ใช่ template เดียวสำหรับทุกคน", en: "Your Program starts from your inputs, not one template for everyone" },
    why: {
      th: "Program ใช้เป้าหมาย ประสบการณ์ จำนวนวัน อุปกรณ์ เวลาต่อครั้ง และจุดเน้น เพื่อสร้างเวอร์ชันที่มีบริบทของคุณ",
      en: "Program uses your goal, experience, available days, equipment, session duration, and focus to create a version with your context.",
    },
    when: {
      th: "ใช้เมื่อต้องการเริ่ม Program ใหม่ หรือเมื่อข้อมูลตั้งค่าหลักของคุณเปลี่ยน",
      en: "Use it when starting a new Program or when your main setup inputs change.",
    },
    steps: [
      { th: "ตั้งค่าข้อมูลพื้นฐาน", en: "Set your baseline inputs" },
      { th: "ดู Preview ก่อน เพื่อเห็นว่าเวอร์ชันใหม่จะเป็นอย่างไร", en: "Review the Preview before changing the active version" },
      { th: "Activate เมื่อพร้อม Program เดิมจะไม่ถูกเปลี่ยนเงียบ ๆ ระหว่างทาง", en: "Activate when ready. Your current Program is not silently replaced mid-cycle." },
    ],
    outcome: {
      th: "คุณรู้ว่า Program ปัจจุบันมาจากข้อมูลอะไร และรู้ว่าเมื่อใดควรสร้างเวอร์ชันใหม่",
      en: "You can see what the current Program is based on and when a new version is warranted.",
    },
    links: [
      { label: { th: "ตั้งค่าหรืออัปเดตข้อมูล", en: "Set or update inputs" }, href: "/program/start", tone: "primary" },
      { label: { th: "ดู Preview", en: "Open Preview" }, href: "/program/preview" },
      { label: { th: "เปิด Program ปัจจุบัน", en: "Open current Program" }, href: "/program" },
    ],
  },
  {
    id: "progress",
    audience: "FREE",
    number: "03",
    eyebrow: { th: "PROGRESS · FREE", en: "PROGRESS · FREE" },
    title: { th: "ใช้ Progress เพื่อให้ระบบเห็นสิ่งที่เกิดขึ้นจริง", en: "Use Progress to feed real outcomes back into the system" },
    why: {
      th: "Program ที่ดีไม่ควรยึดการคาดการณ์ครั้งแรกตลอดไป ข้อมูลความคืบหน้าและผลตอบสนองจริงช่วยบอกว่าควรคงหรือทบทวนอะไร",
      en: "A useful Program should not rely on the first prediction forever. Progress and real response show what should stay and what deserves review.",
    },
    when: {
      th: "บันทึกเมื่อมีข้อมูลความคืบหน้าที่มีความหมาย ไม่จำเป็นต้องไล่กรอกทุกอย่างทุกวัน",
      en: "Log meaningful progress signals. You do not need to fill every field every day.",
    },
    steps: [
      { th: "บันทึกข้อมูลที่สะท้อนผลจริง", en: "Log signals that reflect real outcomes" },
      { th: "ใช้ร่วมกับ Program และ Exercise feedback", en: "Read them together with Program and exercise feedback" },
      { th: "มองแนวโน้มมากกว่าตัวเลขครั้งเดียว", en: "Focus on trends rather than one isolated reading" },
    ],
    outcome: {
      th: "ระบบมี feedback loop จากการใช้งานจริง แทนที่จะตัดสินใจจากข้อมูลตั้งต้นอย่างเดียว",
      en: "The system gains a feedback loop from real use instead of relying only on baseline inputs.",
    },
    links: [
      { label: { th: "เปิดความคืบหน้า", en: "Open Progress" }, href: "/progress", tone: "primary" },
      { label: { th: "กลับไปดู Program", en: "Review Program" }, href: "/program" },
    ],
  },
  {
    id: "pro",
    audience: "PRO",
    number: "04",
    eyebrow: { th: "PRO REVIEW", en: "PRO REVIEW" },
    title: { th: "PRO เพิ่มการทบทวน ไม่ใช่แค่เพิ่ม feature", en: "PRO adds deeper review, not merely more features" },
    why: {
      th: "PRO Review นำความคืบหน้า ผลการฝึก Exercise Memory ข้อมูล LAB และประวัติ Program มาดูร่วมกัน ก่อนตัดสินใจว่าควรคงหรือปรับอะไร",
      en: "PRO Review combines progress, training response, Exercise Memory, LAB context, and Program history before deciding what should stay or change.",
    },
    when: {
      th: "เหมาะเมื่อคุณต้องการให้การตัดสินใจใช้ข้อมูลหลายช่วงเวลาและหลายแหล่งร่วมกันมากขึ้น",
      en: "Use it when decisions need more longitudinal and multi-source context.",
    },
    steps: [
      { th: "ใช้ Program และบันทึกผลจริงตามปกติ", en: "Use your Program and keep normal outcome records" },
      { th: "PRO Review รวมข้อมูลที่เกี่ยวข้องในรอบทบทวน", en: "PRO Review combines relevant signals for the review cycle" },
      { th: "อ่านว่าอะไรเปลี่ยน อะไรควรคง อะไรควรติดตามต่อ", en: "See what changed, what should stay, and what should be monitored" },
    ],
    outcome: {
      th: "ได้ decision context ที่ลึกขึ้นโดยไม่ต้องเริ่มเก็บข้อมูลใหม่จากศูนย์",
      en: "Get deeper decision context without rebuilding your history from scratch.",
    },
    links: [
      { label: { th: "เปิด PRO Review", en: "Open PRO Review" }, href: "/consult", tone: "primary" },
      { label: { th: "ดู Physical Consult", en: "Open Physical Consult" }, href: "/physical-consult" },
    ],
  },
  {
    id: "knowledge",
    audience: "ALL",
    number: "05",
    eyebrow: { th: "KNOWLEDGE", en: "KNOWLEDGE" },
    title: { th: "ถ้ายังไม่เข้าใจ Why ให้กลับมาที่ Knowledge ก่อน", en: "If the why is unclear, go back to Knowledge first" },
    why: {
      th: "เครื่องมือควรช่วยตัดสินใจ แต่ความเข้าใจหลักการช่วยให้คุณรู้ว่าคำแนะนำมีขอบเขตแค่ไหน และเมื่อใดไม่ควรใช้แบบตรงตัว",
      en: "Tools help with decisions, while understanding the principle helps you see the limits and when not to apply a recommendation literally.",
    },
    when: {
      th: "ใช้เมื่ออยากเข้าใจกลไก หลักฐาน หรือข้อจำกัดของแนวคิดที่อยู่เบื้องหลังเครื่องมือและการฝึก",
      en: "Use it when you want the mechanism, evidence, or limitations behind a tool or training idea.",
    },
    steps: [
      { th: "เริ่มจากคำถามที่สงสัย", en: "Start from the question you care about" },
      { th: "อ่าน Knowledge เมื่ออยากได้คำอธิบายลึก", en: "Use Knowledge for deeper explanation" },
      { th: "ใช้ Manga เมื่ออยากเห็นกลไกผ่านภาพและเรื่องราว", en: "Use Manga when visual storytelling makes the mechanism easier to see" },
    ],
    outcome: {
      th: "เข้าใจเหตุผลก่อนกลับไปใช้ Tool หรือ Program ทำให้การตัดสินใจมีบริบทมากขึ้น",
      en: "Understand the reason first, then return to a Tool or Program with better context.",
    },
    links: [
      { label: { th: "เปิด Knowledge", en: "Open Knowledge" }, href: "/knowledge", tone: "primary" },
      { label: { th: "อ่าน Manga", en: "Read Manga" }, href: "/manga" },
    ],
  },
];

export function textFor(language: GuideLanguage, value: Localized) {
  return value[language] ?? value.th;
}
