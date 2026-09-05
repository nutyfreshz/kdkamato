export const LAB_RULESETS = {
  C1: { id: 'LAB_RULESET_C1_v1.1', version: '1.1', evidenceClass: 'DIRECT + GEOMETRY/TENDENCY', lastReviewed: '2026-09-05' },
  C2: { id: 'LAB_RULESET_C2_v1.1', version: '1.1', evidenceClass: 'GEOMETRY + EVIDENCE-SUPPORTED TENDENCY', lastReviewed: '2026-09-05' },
  C3: { id: 'LAB_RULESET_C3_v1.1', version: '1.1', evidenceClass: 'DIRECT + SCENARIO MATH', lastReviewed: '2026-09-05' },
  Q1: { id: 'LAB_RULESET_Q1_v1.1', version: '1.1', evidenceClass: 'DERIVED MEASUREMENT', lastReviewed: '2026-09-05' },
  Q2: { id: 'LAB_RULESET_Q2_v1.1', version: '1.1', evidenceClass: 'DERIVED MEASUREMENT', lastReviewed: '2026-09-05' },
  Q3: { id: 'LAB_RULESET_Q3_v1.1', version: '1.1', evidenceClass: 'DIRECT + DERIVED WBLT CONTEXT', lastReviewed: '2026-09-05' },
  Q4: { id: 'LAB_RULESET_Q4_v1.1', version: '1.1', evidenceClass: 'DERIVED MEASUREMENT', lastReviewed: '2026-09-05' },
  Q5: { id: 'LAB_RULESET_Q5_v1.1', version: '1.1', evidenceClass: 'DERIVED MEASUREMENT', lastReviewed: '2026-09-05' }
};

export function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

export function computeApeIndex(height, armSpan) {
  const h = num(height); const a = num(armSpan);
  if (!h || !a) return null;
  const diff = a - h;
  return { diff: round(diff, 1), ratio: round(a / h, 3) };
}

export function computeFemurTibia(femur, tibia) {
  const f = num(femur); const t = num(tibia);
  if (!f || !t) return null;
  const ratio = f / t;
  const percent = ((f - t) / t) * 100;
  return { ratio: round(ratio, 2), percent: round(percent, 1) };
}

export function computeVTaper(shoulder, waist) {
  const s = num(shoulder); const w = num(waist);
  if (!s || !w) return null;
  return { ratio: round(s / w, 2) };
}

export function computeFFMI(heightCm, weightKg, bodyFatPercent) {
  const h = num(heightCm); const w = num(weightKg);
  const bf = Number(bodyFatPercent);
  if (!h || !w || !Number.isFinite(bf) || bf < 0 || bf >= 100) return null;
  const hm = h / 100;
  const ffm = w * (1 - bf / 100);
  return { ffm: round(ffm, 1), ffmi: round(ffm / (hm * hm), 1) };
}

export function computeKneeToWall(left, right) {
  const l = num(left); const r = num(right);
  if (!l || !r) return null;
  const diff = Math.abs(l - r);
  const lowerSide = l < r ? 'ซ้าย' : r < l ? 'ขวา' : 'เท่ากัน';
  return { left: round(l, 1), right: round(r, 1), mean: round((l + r) / 2, 1), difference: round(diff, 1), lowerSide };
}

function relationText(value, a, b) {
  if (Math.abs(value) < 0.5) return `${a} กับ ${b} ใกล้เคียงกันในการวัดชุดนี้`;
  return value > 0
    ? `${a} ยาวกว่า ${b} ประมาณ ${Math.abs(value).toFixed(1)}% ในการวัดชุดนี้`
    : `${a} สั้นกว่า ${b} ประมาณ ${Math.abs(value).toFixed(1)}% ในการวัดชุดนี้`;
}

export function exerciseFitResult({ height, armSpan, femur, tibia, torso, movement }) {
  const ape = computeApeIndex(height, armSpan);
  const ft = computeFemurTibia(femur, tibia);
  const tr = num(torso); const h = num(height);
  if (!ape || !ft || !tr || !h) return null;
  const femurRelation = relationText(ft.percent, 'Femur (กระดูกต้นขา)', 'Tibia (กระดูกหน้าแข้ง)');
  const reachText = ape.diff === 0 ? 'ช่วงแขนใกล้เคียงกับส่วนสูง' : ape.diff > 0 ? `ช่วงแขนยาวกว่าส่วนสูง ${ape.diff} cm` : `ช่วงแขนสั้นกว่าส่วนสูง ${Math.abs(ape.diff)} cm`;

  if (movement === 'BENCH') return {
    result: reachText,
    metric: `Ape Index ${ape.diff >= 0 ? '+' : ''}${ape.diff} cm · ${ape.ratio}×`,
    meaning: `${reachText}. ถ้า setup อื่นเท่ากัน reach ที่ต่างกันสามารถเปลี่ยนระยะที่ bar ต้องเดินทางใน pressing ได้`,
    use: 'ใช้เป็น context เวลาเทียบ grip, ROM และ barbell vs dumbbell แล้วเลือก setup ที่คุณคุม shoulder กับ bar path ได้ดี',
    watch: 'Ape Index ไม่ได้ทำนาย 1RM และไม่ได้บอกว่า Bench เหมาะหรือไม่เหมาะกับคุณ แรงจริงยังขึ้นกับ muscle mass, technique, joint moments และ skill',
    nextHref: '/lab/ape-index', nextLabel: 'ดูช่วงแขนของฉัน', resultCode: ape.diff >= 0 ? 'C1_BENCH_REACH_NONNEGATIVE' : 'C1_BENCH_REACH_NEGATIVE'
  };

  if (movement === 'DEADLIFT') return {
    result: 'Reach และช่วงขาของคุณเปลี่ยนตำแหน่งเริ่มต้นที่ต้องใช้',
    metric: `Ape ${ape.diff >= 0 ? '+' : ''}${ape.diff} cm · Femur:Tibia ${ft.ratio}`,
    meaning: `Reach ของแขนและ segment ขาของคุณเปลี่ยนตำแหน่งที่ต้องใช้เพื่อเอามือถึง bar. ${femurRelation}`,
    use: 'ใช้เป็นจุดเริ่มต้นเพื่อเทียบ Conventional กับ Sumo โดยดู hip position, bar path และ comfort ของตัวเอง',
    watch: 'Anthropometry เพียงไม่กี่ค่าไม่สามารถทำนายว่า Conventional หรือ Sumo จะทำผลงานดีกว่าสำหรับคุณแน่นอน และไม่ควรเลือก style จาก Ape Index อย่างเดียว',
    nextHref: '/lab/ape-index', nextLabel: 'ดู Reach Context', resultCode: 'C1_DEADLIFT_CONSERVATIVE_GEOMETRY'
  };

  return {
    result: ft.percent >= 0 ? `ต้นขายาวกว่าหน้าแข้งประมาณ ${Math.abs(ft.percent)}%` : `ต้นขาสั้นกว่าหน้าแข้งประมาณ ${Math.abs(ft.percent)}%`,
    metric: `Femur:Tibia ${ft.ratio} · Torso proxy ${tr} cm`,
    meaning: `${femurRelation}. เวลา squat ตำแหน่งสะโพก เข่า และลำตัวจึงต้องจัดกันตาม segment relationship นี้`,
    use: 'ลองเทียบ Flat vs Heel-Elevated และดูว่าตำแหน่งไหนช่วยให้คุณรักษาสมดุลและ knee travel ได้ง่ายกว่า จากนั้นเปิด C2 เพื่อเทียบ squat variant',
    watch: 'Ratio เดียวไม่ได้ตัดสินว่า Front หรือ Back Squat เหมาะกว่า และ torso ที่วัดด้วยสายวัดเป็นเพียง external proxy ไม่ใช่ความยาวกระดูกจริง',
    nextHref: '/lab/squat-geometry', nextLabel: 'ลอง Squat Geometry', resultCode: ft.percent >= 0 ? 'C1_SQUAT_FEMUR_RELATIVE_LONGER' : 'C1_SQUAT_FEMUR_RELATIVE_SHORTER'
  };
}

export function squatScenarioCopy({ heel, stance, variant, kneeTravel }) {
  const heelCopy = heel === 'flat'
    ? 'Flat เป็น baseline สำหรับเทียบกับ setup ยกส้น'
    : 'Heel elevation สามารถเพิ่ม tibial progression / knee ROM และช่วยให้ลำตัวตั้งขึ้นง่ายขึ้นในบางเงื่อนไข แต่ demand ที่ knee extensors อาจเพิ่มขึ้น';
  const stanceCopy = stance === 'narrow'
    ? 'Stance แคบลงเปลี่ยน hip/knee mechanics และในบางเงื่อนไขอาจเพิ่ม knee-extensor contribution'
    : stance === 'wide'
      ? 'Stance กว้างขึ้นเปลี่ยน hip/knee mechanics และเพิ่มข้อกำหนดด้าน hip position / rotation ในบางคน'
      : 'Medium stance ใช้เป็น neutral comparison point ก่อนลองกว้างหรือแคบกว่า';
  const variantCopy = variant === 'front'
    ? 'Front Squat ต้องจัด torso/bar relationship ต่างจาก Back Squat และอาจ demanding ต่อการรักษาตำแหน่งลำตัวตั้งมากกว่า'
    : variant === 'lowbar'
      ? 'Low-Bar Back Squat ยอมให้ใช้ forward trunk lean และ hip contribution ได้มากขึ้นในหลาย setup'
      : 'High-Bar Back Squat ใช้เป็นจุดเทียบระหว่าง Front และ Low-Bar ในหลาย pattern';
  const kneeCopy = kneeTravel > 65 ? 'Scenario นี้ตั้งให้ knee travel มากขึ้น' : kneeTravel < 35 ? 'Scenario นี้ตั้งให้ knee travel น้อยลง' : 'Scenario นี้ใช้ knee travel ระดับกลาง';
  return { heelCopy, stanceCopy, variantCopy, kneeCopy };
}
