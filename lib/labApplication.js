import { computeApeIndex, computeFemurTibia } from './lab';

function validNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function reachText(ape, th) {
  if (Math.abs(ape.diff) < 0.05) return th ? 'ช่วงแขนของคุณใกล้เคียงกับส่วนสูง' : 'Your arm span is about the same as your height';
  if (ape.diff > 0) return th ? `ช่วงแขนยาวกว่าส่วนสูง ${ape.diff} ซม.` : `Your arm span is ${ape.diff} cm longer than your height`;
  return th ? `ช่วงแขนสั้นกว่าส่วนสูง ${Math.abs(ape.diff)} ซม.` : `Your arm span is ${Math.abs(ape.diff)} cm shorter than your height`;
}

function legText(ft, th) {
  const d = Math.abs(ft.percent);
  if (d < 0.5) return th ? 'ช่วงต้นขาและหน้าแข้งใกล้เคียงกัน' : 'Your measured femur and tibia segments are similar in length';
  if (ft.percent > 0) return th ? `ช่วงต้นขายาวกว่าหน้าแข้งประมาณ ${d}%` : `Your measured femur segment is about ${d}% longer than your tibia segment`;
  return th ? `ช่วงต้นขาสั้นกว่าหน้าแข้งประมาณ ${d}%` : `Your measured femur segment is about ${d}% shorter than your tibia segment`;
}

export function exerciseFitApplicationResult({ movement, height, armSpan, femur, tibia }, language='th') {
  const th = language !== 'en';

  if (movement === 'BENCH') {
    if (!validNumber(height) || !validNumber(armSpan)) return null;
    const ape = computeApeIndex(height, armSpan);
    const reach = reachText(ape, th);
    return {
      result: reach,
      metric: th ? `Ape Index ${ape.diff >= 0 ? '+' : ''}${ape.diff} ซม. · ${ape.ratio}×` : `Ape Index ${ape.diff >= 0 ? '+' : ''}${ape.diff} cm · ${ape.ratio}×`,
      meaning: th
        ? `${reach} ใช้ประกอบการดูระยะเอื้อมและระยะเคลื่อนที่ของบาร์ ยังใช้ตัดสินความสามารถใน Bench Press ไม่ได้`
        : `${reach}. Use this as reach and range-of-motion context, not as a Bench Press performance score.`,
      use: th
        ? "ลองเปรียบเทียบความกว้างมือและช่วงการเคลื่อนไหวที่คุมไหล่กับแนวบาร์ได้ดี โดยเปลี่ยนทีละอย่าง"
        : 'Compare grip width and ROM while keeping the setup where you can control shoulder position and bar path.',
      watch: th
        ? "อัตราส่วนช่วงแขนต่อส่วนสูงเพียงค่าเดียวใช้ตัดสินไม่ได้ว่าบาร์เบล ดัมเบล หรือเครื่องฝึกเหมาะที่สุด"
        : 'Ape Index alone cannot decide whether a barbell, dumbbell, or machine press is best for you.',
      nextHref:'/lab/ape-index',
      nextLabel: th ? 'ดูค่าระยะเอื้อมของฉัน' : 'VIEW MY REACH',
      resultCode: ape.diff >= 0 ? 'C1_BENCH_REACH_NONNEGATIVE' : 'C1_BENCH_REACH_NEGATIVE'
    };
  }

  if (movement === 'DEADLIFT') {
    if (!validNumber(height) || !validNumber(armSpan) || !validNumber(femur) || !validNumber(tibia)) return null;
    const ape = computeApeIndex(height, armSpan);
    const ft = computeFemurTibia(femur, tibia);
    const reach = reachText(ape, th);
    const leg = legText(ft, th);
    return {
      result: th ? 'ระยะเอื้อมและสัดส่วนช่วงขาทำให้ตำแหน่งเริ่มต้นที่ต้องใช้เปลี่ยนไป' : 'Reach and leg proportions change the start position you need',
      metric: th ? `Ape ${ape.diff >= 0 ? '+' : ''}${ape.diff} ซม. · Femur:Tibia ${ft.ratio}` : `Ape ${ape.diff >= 0 ? '+' : ''}${ape.diff} cm · Femur:Tibia ${ft.ratio}`,
      meaning: th ? `${reach} และ ${leg} สองค่านี้ทำให้ตำแหน่งสะโพก เข่า และมือที่ต้องใช้เพื่อเอื้อมถึงบาร์เปลี่ยนไป` : `${reach}. ${leg}. Together they change the hip, knee, and hand position needed to reach the bar.`,
      use: th ? "ลองเดดลิฟต์แบบ Conventional และ Sumo โดยใช้ค่านี้เป็นจุดเริ่มต้น แล้วเทียบแนวเคลื่อนที่ของบาร์ การคุมท่า และความสบายขณะฝึก" : 'Use this as a starting point to compare Conventional and Sumo, then judge bar path, control, and real comfort.',
      watch: th ? "สัดส่วนร่างกายอย่างเดียวใช้เลือก Conventional หรือ Sumo อย่างแน่นอนไม่ได้" : 'Body proportions cannot guarantee whether Conventional or Sumo will work better for you.',
      nextHref:'/lab/ape-index',
      nextLabel: th ? 'ดูค่าระยะเอื้อมของฉัน' : 'VIEW MY REACH',
      resultCode:'C1_DEADLIFT_CONSERVATIVE_GEOMETRY'
    };
  }

  if (!validNumber(femur) || !validNumber(tibia)) return null;
  const ft = computeFemurTibia(femur, tibia);
  const leg = legText(ft, th);
  return {
    result: leg,
    metric:`Femur:Tibia ${ft.ratio}`,
    meaning: th ? `${leg} ความสัมพันธ์นี้ทำให้การจัดตำแหน่งข้อสะโพกและเข่าเพื่อรักษาสมดุลใน Squat เปลี่ยนไป` : `${leg}. This relationship changes how the hip and knee need to arrange to keep balance in a Squat.`,
    use: th ? "ลองเทียบพื้นราบกับยกส้นเล็กน้อย ดูว่าแบบไหนดันเข่าไปข้างหน้าและทรงตัวได้ง่ายกว่า แล้วใช้เครื่องมือ C2 เปรียบเทียบการจัดท่าต่อ" : 'Compare flat shoes with a small heel elevation and notice which makes forward knee travel and balance easier, then use C2 to compare setups.',
    watch: th ? "สัดส่วนต้นขาต่อหน้าแข้งเพียงค่าเดียวใช้ตัดสินไม่ได้ว่า Front Squat หรือ Back Squat เหมาะกว่า" : 'Femur:Tibia alone cannot decide whether Front or Back Squat is better for you.',
    nextHref:'/lab/squat-geometry',
    nextLabel: th ? "ทดลองจัดท่าสควอตต่อ" : 'COMPARE SQUAT SETUPS',
    resultCode: ft.percent >= 0 ? 'C1_SQUAT_FEMUR_RELATIVE_LONGER' : 'C1_SQUAT_FEMUR_RELATIVE_SHORTER'
  };
}
