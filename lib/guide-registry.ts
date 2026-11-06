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
  eyebrow: { th: "KDKAMATO GUIDELINE", en: "KDKAMATO GUIDELINE" },
  title: {
    th: "เข้าใจหลักการ แล้วเลือกเครื่องมือที่ต้องใช้",
    en: "Understand why before deciding what to do",
  },
  intro: {
    th: "ดูว่าแต่ละส่วนของ KDKAMATO ใช้ทำอะไร ใช้เมื่อไร และให้ผลแบบไหน เลือกอ่านเฉพาะหัวข้อที่ต้องการได้",
    en: "This is not a manual you need to read from cover to cover. Pick what you are trying to do and jump straight to the relevant tool or Program step.",
  },
  primaryCta: { th: "เข้าใจหลักการก่อน", en: "Start in 60 seconds" },
  secondaryCta: { th: "เลือกหัวข้อที่ต้องใช้", en: "Choose a topic" },
};

export const guideJourney = [
  {
    key: "01",
    title: { th: "ข้อมูล", en: "INPUT" },
    copy: { th: "ใส่เฉพาะข้อมูลที่เกี่ยวกับคำถามนั้น", en: "Give the system only what it needs" },
  },
  {
    key: "02",
    title: { th: "ดูข้อมูลประกอบ", en: "CONTEXT" },
    copy: { th: "ดูข้อมูลร่วมกับเป้าหมายและสถานการณ์ของคุณ", en: "Interpret it in your goal and training context" },
  },
  {
    key: "03",
    title: { th: "เลือกสิ่งที่น่าลอง", en: "DECISION" },
    copy: { th: "ผลลัพธ์ช่วยจัดลำดับสิ่งที่น่าลอง โดยพิจารณาข้อมูลหลายด้านร่วมกัน", en: "Prioritize what is worth trying instead of guessing from one number" },
  },
  {
    key: "04",
    title: { th: "ดูผลจริง", en: "TEST" },
    copy: { th: "ลองใช้ แล้วดูว่าร่างกายและการฝึกของคุณตอบสนองอย่างไร", en: "Apply it and observe your real response" },
  },
];

export const guideEntryCards = [
  {
    id: "principles",
    audience: "ALL" as GuideAudience,
    label: { th: "อยากเข้าใจวิธีทำงานของเครื่องมือ", en: "Understand the principle before using a tool" },
    detail: { th: "อ่านหลักการสั้น ๆ ในหน้านี้ก่อน", en: "Read the core principle here first" },
  },
  {
    id: "lab",
    audience: "FREE" as GuideAudience,
    label: { th: "อยากเลือกสิ่งที่น่าลองให้เข้ากับร่างกาย", en: "Understand your body or choose what to test" },
    detail: { th: "เริ่มจาก LAB", en: "Start with LAB" },
  },
  {
    id: "program",
    audience: "FREE" as GuideAudience,
    label: { th: "อยากเริ่มหรือปรับ โปรแกรม", en: "Build or use your Program" },
    detail: { th: "กรอกข้อมูล → ดูตัวอย่าง → เปิดใช้โปรแกรม", en: "Baseline → Preview → Activate" },
  },
  {
    id: "progress",
    audience: "FREE" as GuideAudience,
    label: { th: "อยากรู้ว่าที่ทำอยู่ได้ผลไหม", en: "Track whether you are moving in the right direction" },
    detail: { th: "ดูแนวโน้มในหน้าความก้าวหน้า", en: "Use Progress as the feedback loop" },
  },
  {
    id: "pro",
    audience: "PRO" as GuideAudience,
    label: { th: "อยากให้ระบบช่วยดูหลายข้อมูลพร้อมกัน", en: "Combine multiple signals into a deeper review" },
    detail: { th: "ใช้ การทบทวน PRO", en: "Use PRO Review" },
  },
];

export const guideSections: GuideSection[] = [
  {
    id: "principles",
    audience: "ALL",
    number: "00",
    eyebrow: { th: "หลักการก่อนใช้", en: "BEFORE YOU USE THE TOOLS" },
    title: { th: "ใช้เครื่องมือประกอบการตัดสินใจ", en: "The tools support better decisions. They do not decide for you." },
    why: {
      th: "ระบบพิจารณาข้อมูลหลายด้านร่วมกับเป้าหมายและสถานการณ์ของคุณ เพื่อจัดลำดับสิ่งที่น่าลองก่อน",
      en: "One measurement cannot explain everything. KDKAMATO combines inputs with your goal and context to suggest what is worth testing first.",
    },
    when: {
      th: "อ่านก่อนใช้ LAB หรือโปรแกรมครั้งแรก เพื่อเข้าใจวิธีใช้ผลลัพธ์เป็นแนวทางทดลองและติดตามผล",
      en: "Read this before using LAB or Program for the first time so results are treated as guidance rather than absolute answers.",
    },
    steps: [
      { th: "วัดหรือกรอกข้อมูลที่จำเป็น", en: "Enter only the information needed for the question" },
      { th: "อ่านผลพร้อมเหตุผลที่ระบบแนะนำ", en: "Read the result together with the reason behind it" },
      { th: "นำคำแนะนำไปลอง แล้วใช้ผลฝึกจริงประกอบการตัดสินใจครั้งถัดไป", en: "Test the recommendation and use your real response to guide the next decision" },
    ],
    outcome: {
      th: "คุณควรเข้าใจเหตุผลของคำแนะนำและรู้ว่าจะลองอะไรต่อ",
      en: "You should know why the recommendation was made and what to test next, not just receive a number.",
    },
    links: [],
  },
  {
    id: "lab",
    audience: "FREE",
    number: "01",
    eyebrow: { th: "LAB · FREE", en: "LAB · FREE" },
    title: { th: "LAB ช่วยตอบคำถามเฉพาะเรื่องของร่างกายและการฝึก", en: "Use LAB when you need to know what is worth testing next" },
    why: {
      th: "LAB แปลค่าที่วัดได้เป็นสิ่งที่คุณนำไปลองกับการฝึกจริงได้",
      en: "LAB is not just a calculator. Measurements provide context that helps prioritize what is worth testing in real training.",
    },
    when: {
      th: "ใช้เมื่อมีคำถามเฉพาะ เช่น ควรลองสควอตแบบไหน หรือสัดส่วนร่างกายอาจเกี่ยวข้องกับการเลือกท่าอย่างไร",
      en: "Use it for a specific question, such as which Squat setup to compare first or what a body proportion can actually tell you.",
    },
    steps: [
      { th: "เลือกคำถามที่อยากรู้ ไม่ต้องทำทุกเครื่องมือ", en: "Pick the question you care about. You do not need every tool." },
      { th: "กรอกเฉพาะค่าที่เครื่องมือนั้นต้องใช้", en: "Enter only what is needed. Some measurements are reused by related LAB tools." },
      { th: "อ่านว่าได้ค่านี้แล้วควรลองอะไรต่อ จากนั้นดูผลจริงของตัวเอง", en: "Read the result as “what should I test next?” and compare it with your real response." },
    ],
    outcome: {
      th: "คุณควรรู้ว่าจะนำผลไปลองใช้อย่างไร พร้อมเข้าใจข้อจำกัดของตัวเลข",
      en: "The goal is a clearer next experiment, not a precise-looking number with no useful next action.",
    },
    links: [
      { label: { th: "เปิด KDKAMATO LAB", en: "Open KDKAMATO LAB" }, href: "/lab", tone: "primary" },
      { label: { th: "ลอง เครื่องมือเลือกท่าฝึก", en: "Try Exercise Fit" }, href: "/lab/exercise-fit" },
      { label: { th: "ลอง การจัดท่าสควอต", en: "Try Squat Setup" }, href: "/lab/squat-geometry" },
    ],
  },
  {
    id: "program",
    audience: "FREE",
    number: "02",
    eyebrow: { th: "PROGRAM · FREE", en: "PROGRAM · FREE" },
    title: { th: "สร้างโปรแกรมตามข้อมูลของคุณ", en: "Your Program starts from your inputs, not one template for everyone" },
    why: {
      th: "ระบบใช้เป้าหมาย ประสบการณ์ จำนวนวันฝึก อุปกรณ์ เวลา และกล้ามเนื้อที่อยากเน้น เพื่อสร้างโปรแกรมตามเงื่อนไขของคุณ",
      en: "Program uses your goal, experience, available days, equipment, session duration, and focus to create a version with your context.",
    },
    when: {
      th: "ใช้เมื่อเริ่มโปรแกรมใหม่ หรือข้อมูลหลักเปลี่ยนจนต้องทบทวนโปรแกรมเดิม",
      en: "Use it when starting a new Program or when your main setup inputs change.",
    },
    steps: [
      { th: "ใส่ข้อมูลพื้นฐานของคุณ", en: "Set your baseline inputs" },
      { th: "ดูตัวอย่างก่อนว่าโปรแกรมใหม่มีอะไรบ้าง", en: "Review the Preview before changing the active version" },
      { th: "กดเปิดใช้เมื่อพร้อม แล้วเริ่มฝึกตามเวอร์ชันใหม่", en: "Activate when ready. Your current Program is not silently replaced mid-cycle." },
    ],
    outcome: {
      th: "คุณเห็นว่าโปรแกรมใช้ข้อมูลอะไร และมีอะไรเปลี่ยนก่อนเปิดใช้",
      en: "You can see what the current Program is based on and when a new version is warranted.",
    },
    links: [
      { label: { th: "ตั้งค่าหรืออัปเดตข้อมูล", en: "Set or update inputs" }, href: "/program/start", tone: "primary" },
      { label: { th: "ดู ตัวอย่าง", en: "Open Preview" }, href: "/program/preview" },
      { label: { th: "เปิด โปรแกรมปัจจุบัน", en: "Open current Program" }, href: "/program" },
    ],
  },
  {
    id: "progress",
    audience: "FREE",
    number: "03",
    eyebrow: { th: "PROGRESS · FREE", en: "PROGRESS · FREE" },
    title: { th: "ติดตามผลว่าสิ่งที่ทำอยู่ได้ผลอย่างไร", en: "Use Progress to feed real outcomes back into the system" },
    why: {
      th: "โปรแกรมแรกเป็นจุดเริ่มต้น ใช้ผลระหว่างฝึกพิจารณาว่าควรทำต่อ ปรับแผน หรือทบทวนข้อมูลเพิ่ม",
      en: "A useful Program should not rely on the first prediction forever. Progress and real response show what should stay and what deserves review.",
    },
    when: {
      th: "บันทึกเมื่อมีข้อมูลใหม่ที่ช่วยดูความเปลี่ยนแปลง ไม่จำเป็นต้องกรอกทุกอย่างทุกวัน",
      en: "Log meaningful progress signals. You do not need to fill every field every day.",
    },
    steps: [
      { th: "บันทึกผลที่เกิดขึ้นจริง", en: "Log signals that reflect real outcomes" },
      { th: "พิจารณาร่วมกับโปรแกรมและผลรายท่า", en: "Read them together with Program and exercise feedback" },
      { th: "ดูผลหลายครั้งประกอบกันก่อนตัดสินใจ", en: "Focus on trends rather than one isolated reading" },
    ],
    outcome: {
      th: "คุณเห็นแนวโน้มการตอบสนองของร่างกาย และมีข้อมูลประกอบการตัดสินใจครั้งถัดไป",
      en: "The system gains a feedback loop from real use instead of relying only on baseline inputs.",
    },
    links: [
      { label: { th: "เปิดความก้าวหน้า", en: "Open Progress" }, href: "/progress", tone: "primary" },
      { label: { th: "กลับไปดู โปรแกรม", en: "Review Program" }, href: "/program" },
    ],
  },
  {
    id: "pro",
    audience: "PRO",
    number: "04",
    eyebrow: { th: "PRO REVIEW", en: "PRO REVIEW" },
    title: { th: "PRO ทบทวนข้อมูลหลายด้านก่อนแนะนำการปรับแผน", en: "PRO adds deeper review, not merely more features" },
    why: {
      th: "PRO พิจารณาความก้าวหน้า ผลฝึก ประวัติรายท่า ผล LAB และประวัติโปรแกรมร่วมกัน เพื่อลดการตัดสินจากข้อมูลเพียงจุดเดียว",
      en: "PRO Review combines progress, training response, Exercise Memory, LAB context, and Program history before deciding what should stay or change.",
    },
    when: {
      th: "เหมาะเมื่อมีข้อมูลสะสมและต้องการทบทวนภาพรวมก่อนปรับโปรแกรม",
      en: "Use it when decisions need more longitudinal and multi-source context.",
    },
    steps: [
      { th: "ใช้ โปรแกรม และบันทึกผลจริงตามปกติ", en: "Use your Program and keep normal outcome records" },
      { th: "ให้ PRO รวบรวมข้อมูลที่เกี่ยวข้องมาทบทวน", en: "PRO Review combines relevant signals for the review cycle" },
      { th: "ดูว่าอะไรควรทำต่อ อะไรควรปรับ และอะไรควรรอดูเพิ่ม", en: "See what changed, what should stay, and what should be monitored" },
    ],
    outcome: {
      th: "คุณเห็นเหตุผลประกอบการปรับโปรแกรมจากข้อมูลที่สะสมไว้",
      en: "Get deeper decision context without rebuilding your history from scratch.",
    },
    links: [
      { label: { th: "เปิด การทบทวน PRO", en: "Open PRO Review" }, href: "/consult", tone: "primary" },
      { label: { th: "ดู การปรึกษาเทรนเนอร์", en: "Open Physical Consult" }, href: "/physical-consult" },
    ],
  },
];

export function textFor(language: GuideLanguage, value: Localized) {
  return value[language] ?? value.th;
}
