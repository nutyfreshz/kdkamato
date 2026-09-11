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
    th: "เข้าใจหลักการก่อน แล้วค่อยเลือกเครื่องมือ",
    en: "Understand why before deciding what to do",
  },
  intro: {
    th: "หน้านี้อธิบายว่าแต่ละส่วนของ KDKAMATO มีไว้ทำอะไร ใช้เมื่อไหร่ และควรคาดหวังผลแบบไหน อ่านเฉพาะหัวข้อที่คุณต้องใช้ได้เลย",
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
    title: { th: "ดูบริบท", en: "CONTEXT" },
    copy: { th: "ดูข้อมูลร่วมกับเป้าหมายและสถานการณ์ของคุณ", en: "Interpret it in your goal and training context" },
  },
  {
    key: "03",
    title: { th: "เลือกสิ่งที่น่าลอง", en: "DECISION" },
    copy: { th: "ผลลัพธ์ช่วยบอกว่าควรเริ่มลองจากอะไร ไม่ได้ตัดสินจากเลขตัวเดียว", en: "Prioritize what is worth trying instead of guessing from one number" },
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
    label: { th: "อยากเข้าใจก่อนว่าเครื่องมือคิดยังไง", en: "Understand the principle before using a tool" },
    detail: { th: "อ่านหลักการสั้น ๆ ในหน้านี้ก่อน", en: "Read the core principle here first" },
  },
  {
    id: "lab",
    audience: "FREE" as GuideAudience,
    label: { th: "อยากรู้ว่าร่างกายตัวเองเหมาะกับอะไร", en: "Understand your body or choose what to test" },
    detail: { th: "เริ่มจาก LAB", en: "Start with LAB" },
  },
  {
    id: "program",
    audience: "FREE" as GuideAudience,
    label: { th: "อยากเริ่มหรือปรับ Program", en: "Build or use your Program" },
    detail: { th: "ตั้งข้อมูล → ดู Preview → Activate", en: "Baseline → Preview → Activate" },
  },
  {
    id: "progress",
    audience: "FREE" as GuideAudience,
    label: { th: "อยากรู้ว่าที่ทำอยู่ได้ผลไหม", en: "Track whether you are moving in the right direction" },
    detail: { th: "ดูแนวโน้มจาก Progress", en: "Use Progress as the feedback loop" },
  },
  {
    id: "pro",
    audience: "PRO" as GuideAudience,
    label: { th: "อยากให้ระบบช่วยดูหลายข้อมูลพร้อมกัน", en: "Combine multiple signals into a deeper review" },
    detail: { th: "ใช้ PRO Review", en: "Use PRO Review" },
  },
];

export const guideSections: GuideSection[] = [
  {
    id: "principles",
    audience: "ALL",
    number: "00",
    eyebrow: { th: "หลักการก่อนใช้", en: "BEFORE YOU USE THE TOOLS" },
    title: { th: "เครื่องมือช่วยให้ตัดสินใจดีขึ้น ไม่ได้ตัดสินแทนคุณ", en: "The tools support better decisions. They do not decide for you." },
    why: {
      th: "ค่าที่วัดได้เพียงค่าเดียวบอกทุกอย่างไม่ได้ KDKAMATO จึงเอาข้อมูลมาดูร่วมกับเป้าหมายและสถานการณ์ของคุณ แล้วบอกว่าสิ่งไหนน่าลองก่อน",
      en: "One measurement cannot explain everything. KDKAMATO combines inputs with your goal and context to suggest what is worth testing first.",
    },
    when: {
      th: "อ่านส่วนนี้ก่อนใช้ LAB หรือ Program ครั้งแรก เพื่อเข้าใจว่าผลลัพธ์ควรถูกใช้เป็นคำแนะนำ ไม่ใช่คำตัดสินตายตัว",
      en: "Read this before using LAB or Program for the first time so results are treated as guidance rather than absolute answers.",
    },
    steps: [
      { th: "วัดหรือกรอกข้อมูลที่จำเป็น", en: "Enter only the information needed for the question" },
      { th: "ดูผลพร้อมเหตุผลว่าเพราะอะไรถึงแนะนำแบบนั้น", en: "Read the result together with the reason behind it" },
      { th: "เอาคำแนะนำไปลอง แล้วใช้ผลจริงของคุณเป็นตัวตัดสินรอบต่อไป", en: "Test the recommendation and use your real response to guide the next decision" },
    ],
    outcome: {
      th: "คุณควรรู้ว่า “ทำไมถึงได้คำแนะนำนี้” และ “ควรลองอะไรต่อ” ไม่ใช่แค่ได้ตัวเลขหนึ่งค่า",
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
      th: "LAB ไม่ได้มีไว้แค่คำนวณเลข แต่ช่วยแปลค่าที่วัดได้ให้เป็นคำแนะนำที่เอาไปลองกับการฝึกจริงได้",
      en: "LAB is not just a calculator. Measurements provide context that helps prioritize what is worth testing in real training.",
    },
    when: {
      th: "ใช้เมื่อมีคำถามชัด ๆ เช่น ควรลอง Squat แบบไหนก่อน หรือสัดส่วนร่างกายของคุณมีผลกับการเลือกท่าอย่างไร",
      en: "Use it for a specific question, such as which Squat setup to compare first or what a body proportion can actually tell you.",
    },
    steps: [
      { th: "เลือกคำถามที่อยากรู้ ไม่ต้องทำทุกเครื่องมือ", en: "Pick the question you care about. You do not need every tool." },
      { th: "กรอกเฉพาะค่าที่เครื่องมือนั้นต้องใช้", en: "Enter only what is needed. Some measurements are reused by related LAB tools." },
      { th: "อ่านว่าได้ค่านี้แล้วควรลองอะไรต่อ จากนั้นดูผลจริงของตัวเอง", en: "Read the result as “what should I test next?” and compare it with your real response." },
    ],
    outcome: {
      th: "สุดท้ายคุณควรได้สิ่งที่น่าลองต่ออย่างชัดเจน ไม่ใช่แค่ตัวเลขที่ดูแม่นแต่ไม่รู้จะเอาไปทำอะไร",
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
    title: { th: "Program สร้างจากข้อมูลของคุณ ไม่ใช่สูตรเดียวสำหรับทุกคน", en: "Your Program starts from your inputs, not one template for everyone" },
    why: {
      th: "ระบบใช้เป้าหมาย ประสบการณ์ จำนวนวันที่ฝึก อุปกรณ์ เวลา และจุดที่อยากเน้น เพื่อสร้าง Program ที่เข้ากับเงื่อนไขของคุณมากขึ้น",
      en: "Program uses your goal, experience, available days, equipment, session duration, and focus to create a version with your context.",
    },
    when: {
      th: "ใช้ตอนเริ่ม Program ใหม่ หรือเมื่อข้อมูลหลักของคุณเปลี่ยนจน Program เดิมไม่เหมาะแล้ว",
      en: "Use it when starting a new Program or when your main setup inputs change.",
    },
    steps: [
      { th: "ใส่ข้อมูลพื้นฐานของคุณ", en: "Set your baseline inputs" },
      { th: "ดู Preview ก่อน ว่า Program ใหม่หน้าตาเป็นอย่างไร", en: "Review the Preview before changing the active version" },
      { th: "กด Activate เมื่อพร้อม แล้วค่อยใช้เวอร์ชันใหม่นั้น", en: "Activate when ready. Your current Program is not silently replaced mid-cycle." },
    ],
    outcome: {
      th: "คุณรู้ว่า Program ถูกสร้างจากข้อมูลอะไร และเห็นก่อนว่าจะเปลี่ยนอะไรบ้าง",
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
    title: { th: "Progress ใช้ดูว่าสิ่งที่ทำอยู่ได้ผลจริงไหม", en: "Use Progress to feed real outcomes back into the system" },
    why: {
      th: "Program ตอนเริ่มเป็นแค่จุดตั้งต้น ผลจริงระหว่างฝึกต่างหากที่บอกว่าควรทำต่อ ปรับ หรือกลับมาดูใหม่",
      en: "A useful Program should not rely on the first prediction forever. Progress and real response show what should stay and what deserves review.",
    },
    when: {
      th: "บันทึกเมื่อมีข้อมูลที่ช่วยให้เห็นความเปลี่ยนแปลง ไม่จำเป็นต้องกรอกทุกอย่างทุกวัน",
      en: "Log meaningful progress signals. You do not need to fill every field every day.",
    },
    steps: [
      { th: "บันทึกผลที่เกิดขึ้นจริง", en: "Log signals that reflect real outcomes" },
      { th: "ดูร่วมกับ Program และ feedback จากท่าฝึก", en: "Read them together with Program and exercise feedback" },
      { th: "ดูแนวโน้มหลายครั้ง มากกว่าตัดสินจากวันเดียว", en: "Focus on trends rather than one isolated reading" },
    ],
    outcome: {
      th: "คุณเห็นว่าร่างกายกำลังตอบสนองไปทางไหน และมีข้อมูลพอที่จะตัดสินใจรอบต่อไปได้ดีขึ้น",
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
    title: { th: "PRO ช่วยดูหลายข้อมูลพร้อมกันก่อนตัดสินใจว่าจะปรับอะไร", en: "PRO adds deeper review, not merely more features" },
    why: {
      th: "PRO Review เอาความคืบหน้า ผลการฝึก Exercise Memory ข้อมูลจาก LAB และประวัติ Program มาดูร่วมกัน เพื่อไม่ให้ปรับจากข้อมูลชิ้นเดียว",
      en: "PRO Review combines progress, training response, Exercise Memory, LAB context, and Program history before deciding what should stay or change.",
    },
    when: {
      th: "เหมาะเมื่อคุณมีข้อมูลสะสมแล้ว และอยากให้การปรับ Program ดูทั้งภาพรวม ไม่ใช่ดูแค่ผลล่าสุด",
      en: "Use it when decisions need more longitudinal and multi-source context.",
    },
    steps: [
      { th: "ใช้ Program และบันทึกผลจริงตามปกติ", en: "Use your Program and keep normal outcome records" },
      { th: "ให้ PRO Review ดึงข้อมูลที่เกี่ยวข้องมาดูพร้อมกัน", en: "PRO Review combines relevant signals for the review cycle" },
      { th: "ดูว่าอะไรควรทำต่อ อะไรควรปรับ และอะไรควรรอดูเพิ่ม", en: "See what changed, what should stay, and what should be monitored" },
    ],
    outcome: {
      th: "คุณได้เหตุผลที่ชัดขึ้นก่อนปรับ Program โดยใช้ข้อมูลที่สะสมไว้แล้ว",
      en: "Get deeper decision context without rebuilding your history from scratch.",
    },
    links: [
      { label: { th: "เปิด PRO Review", en: "Open PRO Review" }, href: "/consult", tone: "primary" },
      { label: { th: "ดู Physical Consult", en: "Open Physical Consult" }, href: "/physical-consult" },
    ],
  },
];

export function textFor(language: GuideLanguage, value: Localized) {
  return value[language] ?? value.th;
}
