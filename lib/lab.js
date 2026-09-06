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
  const lowerSideKey = l < r ? 'left' : r < l ? 'right' : 'equal';
  const lowerSide = lowerSideKey === 'left' ? 'ซ้าย' : lowerSideKey === 'right' ? 'ขวา' : 'เท่ากัน';
  return { left: round(l, 1), right: round(r, 1), mean: round((l + r) / 2, 1), difference: round(diff, 1), lowerSide, lowerSideKey };
}

function reachText(ape, language) {
  if (language === 'en') {
    if (ape.diff === 0) return 'Your arm span is about the same as your height';
    return ape.diff > 0 ? `Your arm span is ${ape.diff} cm longer than your height` : `Your arm span is ${Math.abs(ape.diff)} cm shorter than your height`;
  }
  if (ape.diff === 0) return 'ช่วงแขนของคุณใกล้เคียงกับส่วนสูง';
  return ape.diff > 0 ? `ช่วงแขนของคุณยาวกว่าส่วนสูง ${ape.diff} cm` : `ช่วงแขนของคุณสั้นกว่าส่วนสูง ${Math.abs(ape.diff)} cm`;
}

function femurRelation(ft, language) {
  const d = Math.abs(ft.percent);
  if (language === 'en') {
    if (d < 0.5) return 'Your measured femur and tibia segments are similar in length';
    return ft.percent > 0 ? `Your measured femur segment is about ${d}% longer than your tibia segment` : `Your measured femur segment is about ${d}% shorter than your tibia segment`;
  }
  if (d < 0.5) return 'ช่วงต้นขาและหน้าแข้งที่วัดได้มีความยาวใกล้เคียงกัน';
  return ft.percent > 0 ? `ช่วงต้นขาที่วัดได้ยาวกว่าช่วงหน้าแข้งประมาณ ${d}%` : `ช่วงต้นขาที่วัดได้สั้นกว่าช่วงหน้าแข้งประมาณ ${d}%`;
}

export function exerciseFitResult({ height, armSpan, femur, tibia, torso, movement }, language = 'th') {
  const ape = computeApeIndex(height, armSpan);
  const ft = computeFemurTibia(femur, tibia);
  const tr = num(torso); const h = num(height);
  if (!ape || !ft || !tr || !h) return null;
  const reach = reachText(ape, language);
  const leg = femurRelation(ft, language);

  if (language === 'en') {
    if (movement === 'BENCH') return {
      result: reach,
      metric: `Ape Index ${ape.diff >= 0 ? '+' : ''}${ape.diff} cm · ${ape.ratio}×`,
      meaning: `${reach}. With the same setup, reach can change how far the bar travels during pressing.`,
      use: 'Use this as context when comparing grip width, range of motion (ROM), and barbell versus dumbbell pressing. Keep the setup where you can control your shoulder position and bar path.',
      watch: 'Ape Index does not predict your 1RM or whether Bench Press is suitable for you. Strength also depends on muscle mass, technique, joint moments, skill, and other factors.',
      nextHref: '/lab/ape-index', nextLabel: 'CHECK MY REACH', resultCode: ape.diff >= 0 ? 'C1_BENCH_REACH_NONNEGATIVE' : 'C1_BENCH_REACH_NEGATIVE'
    };
    if (movement === 'DEADLIFT') return {
      result: 'Your reach and leg segments change the start position you need',
      metric: `Ape ${ape.diff >= 0 ? '+' : ''}${ape.diff} cm · Femur:Tibia ${ft.ratio}`,
      meaning: `${reach}. ${leg}. Together they change where your hips, knees, torso, and hands need to be to reach the bar.`,
      use: 'Use this as a starting point to compare Conventional and Sumo. Watch your hip position, bar path, control, and comfort rather than choosing a style from one ratio.',
      watch: 'A few anthropometric measurements cannot reliably predict whether Conventional or Sumo will perform better for you.',
      nextHref: '/lab/ape-index', nextLabel: 'CHECK MY REACH', resultCode: 'C1_DEADLIFT_CONSERVATIVE_GEOMETRY'
    };
    return {
      result: leg,
      metric: `Femur:Tibia ${ft.ratio} · Torso estimate ${tr} cm`,
      meaning: `${leg}. In a Squat, this relationship changes how your hips, knees, and torso need to arrange to keep balance over the foot.`,
      use: 'Compare flat shoes with a small heel elevation and notice which setup makes balance and forward knee travel easier to control. Then open C2 to compare Squat variants.',
      watch: 'One ratio cannot decide whether Front or Back Squat is better for you. The torso value is an external measurement estimate, not an exact skeletal length.',
      nextHref: '/lab/squat-geometry', nextLabel: 'OPEN SQUAT GEOMETRY', resultCode: ft.percent >= 0 ? 'C1_SQUAT_FEMUR_RELATIVE_LONGER' : 'C1_SQUAT_FEMUR_RELATIVE_SHORTER'
    };
  }

  if (movement === 'BENCH') return {
    result: reach,
    metric: `Ape Index ${ape.diff >= 0 ? '+' : ''}${ape.diff} cm · ${ape.ratio}×`,
    meaning: `${reach} ถ้าการจัดท่าอื่นเหมือนกัน ระยะเอื้อมที่ต่างกันอาจทำให้บาร์ต้องเดินทางไกลหรือน้อยลงในท่าดัน`,
    use: 'ใช้เป็นข้อมูลประกอบเมื่อเทียบความกว้างมือ ช่วงการเคลื่อนไหว (ROM) และ Barbell กับ Dumbbell แล้วเลือกการจัดท่าที่คุณควบคุมหัวไหล่และแนวทางของบาร์ได้ดี',
    watch: 'Ape Index ไม่ได้ทำนาย 1RM และไม่ได้บอกว่า Bench Press เหมาะหรือไม่เหมาะกับคุณ ความแข็งแรงจริงยังขึ้นกับมวลกล้ามเนื้อ เทคนิค แรงรอบข้อต่อ ทักษะ และปัจจัยอื่น',
    nextHref: '/lab/ape-index', nextLabel: 'ดูระยะเอื้อมของฉัน', resultCode: ape.diff >= 0 ? 'C1_BENCH_REACH_NONNEGATIVE' : 'C1_BENCH_REACH_NEGATIVE'
  };
  if (movement === 'DEADLIFT') return {
    result: 'ระยะเอื้อมและสัดส่วนช่วงขาของคุณเปลี่ยนตำแหน่งเริ่มต้นที่ต้องใช้',
    metric: `Ape ${ape.diff >= 0 ? '+' : ''}${ape.diff} cm · Femur:Tibia ${ft.ratio}`,
    meaning: `${reach} และ${leg} เมื่อรวมกันจึงเปลี่ยนตำแหน่งของสะโพก เข่า ลำตัว และมือที่ต้องใช้เพื่อเอื้อมถึงบาร์`,
    use: 'ใช้เป็นจุดเริ่มต้นในการลอง Conventional กับ Sumo แล้วเทียบตำแหน่งสะโพก แนวทางของบาร์ การควบคุม และความรู้สึกของตัวเอง',
    watch: 'สัดส่วนร่างกายเพียงไม่กี่ค่าไม่สามารถทำนายได้แน่นอนว่า Conventional หรือ Sumo จะทำผลงานดีกว่าสำหรับคุณ',
    nextHref: '/lab/ape-index', nextLabel: 'ดูระยะเอื้อมของฉัน', resultCode: 'C1_DEADLIFT_CONSERVATIVE_GEOMETRY'
  };
  return {
    result: leg,
    metric: `Femur:Tibia ${ft.ratio} · ค่าประมาณลำตัว ${tr} cm`,
    meaning: `${leg} เวลา Squat ความสัมพันธ์นี้มีผลต่อว่าตำแหน่งสะโพก เข่า และลำตัวต้องจัดอย่างไรเพื่อรักษาสมดุลเหนือเท้า`,
    use: 'ลองเทียบพื้นราบกับการยกส้นเล็กน้อย แล้วดูว่าแบบไหนช่วยให้คุณรักษาสมดุลและปล่อยเข่าเดินหน้าได้ง่ายกว่า จากนั้นเปิด C2 เพื่อเทียบรูปแบบ Squat',
    watch: 'อัตราส่วนเดียวไม่สามารถตัดสินว่า Front หรือ Back Squat เหมาะกว่า และค่าลำตัวจากสายวัดเป็นเพียงค่าประมาณจากภายนอก ไม่ใช่ความยาวกระดูกจริง',
    nextHref: '/lab/squat-geometry', nextLabel: 'ลอง Squat Geometry', resultCode: ft.percent >= 0 ? 'C1_SQUAT_FEMUR_RELATIVE_LONGER' : 'C1_SQUAT_FEMUR_RELATIVE_SHORTER'
  };
}

export function squatScenarioCopy({ heel, stance, variant, kneeTravel }, language = 'th') {
  if (language === 'en') {
    const heelCopy = heel === 'flat'
      ? 'Flat is the baseline for comparison.'
      : 'Heel elevation can allow more forward knee travel and may make a more upright torso easier in some conditions, while increasing knee-extensor demand.';
    const stanceCopy = stance === 'narrow'
      ? 'A narrower stance changes hip and knee mechanics and can increase knee-extensor contribution in some conditions.'
      : stance === 'wide'
        ? 'A wider stance changes hip and knee mechanics and may require more hip positioning and rotation.'
        : 'A medium stance is a neutral comparison point before testing narrower or wider positions.';
    const variantCopy = variant === 'front'
      ? 'Front Squat changes the torso-to-bar relationship and can make an upright torso more demanding to maintain.'
      : variant === 'lowbar'
        ? 'Low-Bar Back Squat generally allows more forward trunk lean and hip contribution.'
        : 'High-Bar Back Squat provides a useful middle comparison between Front and Low-Bar patterns.';
    const kneeCopy = kneeTravel > 65 ? 'This scenario uses more forward knee travel.' : kneeTravel < 35 ? 'This scenario uses less forward knee travel.' : 'This scenario uses a moderate amount of forward knee travel.';
    return { heelCopy, stanceCopy, variantCopy, kneeCopy };
  }

  const heelCopy = heel === 'flat'
    ? 'พื้นราบเป็นจุดตั้งต้นสำหรับเทียบกับการยกส้น'
    : 'การยกส้นช่วยให้เข่าเดินหน้าได้มากขึ้น และอาจช่วยให้ลำตัวตั้งขึ้นง่ายขึ้นในบางเงื่อนไข แต่ภาระที่กล้ามเนื้อเหยียดเข่าอาจเพิ่มขึ้น';
  const stanceCopy = stance === 'narrow'
    ? 'การยืนแคบลงเปลี่ยนกลไกของสะโพกและเข่า และในบางเงื่อนไขอาจเพิ่มงานของกล้ามเนื้อเหยียดเข่า'
    : stance === 'wide'
      ? 'การยืนกว้างขึ้นเปลี่ยนกลไกของสะโพกและเข่า และอาจต้องใช้ตำแหน่งหรือการหมุนของสะโพกมากขึ้น'
      : 'ความกว้างระดับกลางใช้เป็นจุดตั้งต้น ก่อนลองแคบหรือกว้างกว่า';
  const variantCopy = variant === 'front'
    ? 'Front Squat เปลี่ยนความสัมพันธ์ระหว่างลำตัวกับบาร์ และมักต้องควบคุมลำตัวให้ตั้งมากขึ้น'
    : variant === 'lowbar'
      ? 'Low-Bar Back Squat เปิดให้ใช้การก้มลำตัวและแรงจากสะโพกมากขึ้นในหลายรูปแบบการจัดท่า'
      : 'High-Bar Back Squat ใช้เป็นจุดเปรียบเทียบระหว่าง Front และ Low-Bar ได้ง่าย';
  const kneeCopy = kneeTravel > 65 ? 'สถานการณ์นี้ให้เข่าเดินหน้าได้มากขึ้น' : kneeTravel < 35 ? 'สถานการณ์นี้จำกัดการเดินหน้าของเข่ามากขึ้น' : 'สถานการณ์นี้ใช้การเดินหน้าของเข่าระดับกลาง';
  return { heelCopy, stanceCopy, variantCopy, kneeCopy };
}
