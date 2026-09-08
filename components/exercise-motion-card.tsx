import styles from "./program-app.module.css";

type MotionKind = "MACHINE_CHEST_PRESS" | "LAT_PULLDOWN" | "LEG_PRESS";

type Spec = {
  title: string;
  subtitle: string;
  setup: string;
  move: string;
  avoid: string;
};

const SPECS: Record<MotionKind, Spec> = {
  MACHINE_CHEST_PRESS: {
    title: "Machine Chest Press",
    subtitle: "Horizontal press · chest dominant",
    setup: "Seat heightให้ handle อยู่ประมาณ mid-chest · สะบักนิ่งกับพนัก",
    move: "กดไปข้างหน้าโดยให้ศอกเดินตามแนว handle แล้วคุมกลับ",
    avoid: "ไหล่ลอยไปด้านหน้า · หลังแอ่นเพื่อไล่น้ำหนัก",
  },
  LAT_PULLDOWN: {
    title: "Lat Pulldown",
    subtitle: "Vertical pull · lat dominant",
    setup: "ล็อกต้นขาใต้ pad · ลำตัวเอนเพียงเล็กน้อย · เริ่มจากแขนยาว",
    move: "ดึงศอกลงข้างลำตัว ให้ bar ลงสู่ช่วง upper-chest แล้วคุมกลับ",
    avoid: "เหวี่ยงลำตัว · ดึงหลังคอ · ยักไหล่ขึ้นตลอด rep",
  },
  LEG_PRESS: {
    title: "45° Leg Press",
    subtitle: "Knee-dominant press · quads/glutes",
    setup: "หลังและเชิงกรานสัมผัสพนัก · วางเท้าให้เข่าเดินตามแนวปลายเท้า",
    move: "ลงลึกเท่าที่เชิงกรานยังนิ่ง แล้วดัน platform กลับโดยไม่ล็อกเข่ากระแทก",
    avoid: "ก้นม้วนลอยจากพนัก · เข่าพับเข้าด้านใน · ปล่อย sled ลงเร็ว",
  },
};

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff6b1a" strokeWidth="5" strokeLinecap="round" />
    <path d={`M ${x2 - 12} ${y2 - 8} L ${x2} ${y2} L ${x2 - 12} ${y2 + 8}`} fill="none" stroke="#ff6b1a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </g>;
}

function HumanTorso({ x, y, ghost = false }: { x: number; y: number; ghost?: boolean }) {
  const opacity = ghost ? 0.25 : 1;
  return <g opacity={opacity}>
    <circle cx={x} cy={y - 58} r="17" fill="#d9e1e5" />
    <path d={`M ${x - 22} ${y - 36} Q ${x} ${y - 48} ${x + 22} ${y - 36} L ${x + 30} ${y + 24} Q ${x} ${y + 38} ${x - 30} ${y + 24} Z`} fill="#60717c" />
    <ellipse cx={x} cy={y + 34} rx="24" ry="13" fill="#485963" />
  </g>;
}

function Limb({ d, ghost = false, width = 15 }: { d: string; ghost?: boolean; width?: number }) {
  return <path d={d} fill="none" stroke={ghost ? "#91a3ad" : "#d9e1e5"} strokeOpacity={ghost ? .28 : 1} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
}

function ChestPressSvg() {
  return <svg className={styles.motionSvg} viewBox="0 0 640 360" role="img" aria-label="Machine chest press start and finish technical illustration">
    <defs>
      <linearGradient id="mcp-frame" x1="0" x2="1"><stop stopColor="#26343c"/><stop offset="1" stopColor="#40515a"/></linearGradient>
    </defs>
    <rect x="18" y="18" width="604" height="324" rx="22" fill="#0a0f12" stroke="#24323a" />
    <path d="M455 55 L455 300 M455 72 L548 72 M548 72 L548 296" stroke="url(#mcp-frame)" strokeWidth="12" strokeLinecap="round" />
    <rect x="502" y="100" width="42" height="155" rx="8" fill="#121a1f" stroke="#3a4a53" />
    {[0,1,2,3,4].map(i=><rect key={i} x="508" y={112+i*25} width="30" height="16" rx="3" fill="#52636d" />)}
    <rect x="180" y="236" width="104" height="22" rx="8" fill="#34454e" />
    <rect x="192" y="135" width="28" height="110" rx="10" fill="#3c4d56" transform="rotate(-9 206 190)" />
    <path d="M280 142 L392 142 L448 116" stroke="#3d4d55" strokeWidth="12" strokeLinecap="round" />
    <rect x="365" y="125" width="18" height="45" rx="8" fill="#99a7ae" />
    <rect x="391" y="125" width="18" height="45" rx="8" fill="#99a7ae" />

    <HumanTorso x={247} y={188} ghost />
    <Limb ghost d="M228 226 L210 275 L222 316" width={18}/><Limb ghost d="M266 226 L285 276 L300 316" width={18}/>
    <Limb ghost d="M224 166 L275 151 L334 146" /><Limb ghost d="M270 166 L312 154 L374 146" />

    <HumanTorso x={247} y={188} />
    <Limb d="M228 226 L210 275 L222 316" width={18}/><Limb d="M266 226 L285 276 L300 316" width={18}/>
    <Limb d="M224 166 L292 146 L367 146" /><Limb d="M270 166 L327 147 L398 146" />
    <Arrow x1={315} y1={105} x2={401} y2={105}/>
    <text x="64" y="55" fill="#91a3ad" fontSize="14" fontWeight="800">START</text>
    <text x="64" y="78" fill="#f4f7f8" fontSize="13">elbows back · chest loaded</text>
    <text x="465" y="320" fill="#ff6b1a" fontSize="14" fontWeight="800">FINISH</text>
  </svg>;
}

function LatPulldownSvg() {
  return <svg className={styles.motionSvg} viewBox="0 0 640 360" role="img" aria-label="Lat pulldown start and finish technical illustration">
    <rect x="18" y="18" width="604" height="324" rx="22" fill="#0a0f12" stroke="#24323a" />
    <path d="M118 50 L118 310 M118 54 L505 54 M505 54 L505 310" stroke="#3d4d55" strokeWidth="12" strokeLinecap="round" />
    <circle cx="314" cy="65" r="13" fill="#647680" />
    <path d="M314 78 L314 98" stroke="#7d8d95" strokeWidth="5" />
    <path d="M235 102 Q314 80 393 102" fill="none" stroke="#b9c3c8" strokeWidth="9" strokeLinecap="round" />
    <rect x="270" y="240" width="92" height="18" rx="8" fill="#40515a" />
    <rect x="276" y="219" width="80" height="17" rx="8" fill="#60717c" />
    <rect x="134" y="92" width="42" height="150" rx="8" fill="#121a1f" stroke="#3a4a53" />
    {[0,1,2,3,4].map(i=><rect key={i} x="140" y={104+i*24} width="30" height="15" rx="3" fill="#52636d" />)}

    <HumanTorso x={315} y={206} ghost />
    <Limb ghost d="M292 185 L268 137 L245 104" /><Limb ghost d="M338 185 L362 137 L385 104" />
    <Limb ghost d="M300 244 L287 286 L286 318" width={18}/><Limb ghost d="M330 244 L344 286 L345 318" width={18}/>

    <HumanTorso x={315} y={206} />
    <Limb d="M292 185 L273 171 L258 155" /><Limb d="M338 185 L357 171 L372 155" />
    <path d="M255 154 Q314 140 375 154" fill="none" stroke="#b9c3c8" strokeWidth="9" strokeLinecap="round" />
    <Limb d="M300 244 L287 286 L286 318" width={18}/><Limb d="M330 244 L344 286 L345 318" width={18}/>
    <Arrow x1={430} y1={108} x2={430} y2={166}/>
    <text x="64" y="55" fill="#91a3ad" fontSize="14" fontWeight="800">START</text>
    <text x="64" y="78" fill="#f4f7f8" fontSize="13">arms long · shoulders controlled</text>
    <text x="454" y="320" fill="#ff6b1a" fontSize="14" fontWeight="800">FINISH</text>
  </svg>;
}

function LegPressSvg() {
  return <svg className={styles.motionSvg} viewBox="0 0 640 360" role="img" aria-label="45 degree leg press start and finish technical illustration">
    <rect x="18" y="18" width="604" height="324" rx="22" fill="#0a0f12" stroke="#24323a" />
    <path d="M160 300 L420 74" stroke="#3d4d55" strokeWidth="14" strokeLinecap="round" />
    <path d="M215 310 L455 99" stroke="#26343c" strokeWidth="9" strokeLinecap="round" />
    <rect x="410" y="58" width="112" height="92" rx="12" fill="#4a5b64" transform="rotate(-41 466 104)" />
    <rect x="135" y="225" width="128" height="34" rx="10" fill="#34454e" transform="rotate(-12 199 242)" />
    <rect x="116" y="167" width="42" height="103" rx="12" fill="#465760" transform="rotate(-12 137 219)" />

    <HumanTorso x={190} y={188} ghost />
    <Limb ghost d="M190 226 L265 220 L330 170" width={20}/><Limb ghost d="M205 232 L278 232 L345 183" width={20}/>
    <circle cx="331" cy="169" r="8" fill="#91a3ad" opacity=".3" /><circle cx="346" cy="182" r="8" fill="#91a3ad" opacity=".3" />

    <HumanTorso x={190} y={188} />
    <Limb d="M190 226 L286 188 L390 123" width={20}/><Limb d="M205 232 L301 200 L404 135" width={20}/>
    <circle cx="390" cy="123" r="8" fill="#d9e1e5" /><circle cx="404" cy="135" r="8" fill="#d9e1e5" />
    <Arrow x1={345} y1={222} x2={415} y2={160}/>
    <text x="64" y="55" fill="#91a3ad" fontSize="14" fontWeight="800">START</text>
    <text x="64" y="78" fill="#f4f7f8" fontSize="13">hips stable · knees flexed</text>
    <text x="458" y="320" fill="#ff6b1a" fontSize="14" fontWeight="800">FINISH</text>
  </svg>;
}

export function ExerciseMotionCard({ kind }: { kind: MotionKind }) {
  const spec = SPECS[kind];
  return <article className={styles.motionCard}>
    <div className={styles.motionHeader}>
      <div><div className="kicker">Technical Motion Card · prototype</div><h2>{spec.title}</h2><p>{spec.subtitle}</p></div>
      <span className={styles.motionBadge}>VECTOR 2.5D</span>
    </div>
    {kind === "MACHINE_CHEST_PRESS" ? <ChestPressSvg /> : kind === "LAT_PULLDOWN" ? <LatPulldownSvg /> : <LegPressSvg />}
    <div className={styles.motionCues}>
      <div><strong>SETUP</strong><span>{spec.setup}</span></div>
      <div><strong>MOVE</strong><span>{spec.move}</span></div>
      <div><strong>AVOID</strong><span>{spec.avoid}</span></div>
    </div>
  </article>;
}
