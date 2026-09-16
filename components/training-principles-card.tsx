export function TrainingPrinciplesCard() {
  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">หลักการฝึก</div>
      <h2>เซตไม่ต้องเยอะ แต่ทุกเซตต้องมีคุณภาพ</h2>
      <p>
        จำนวนเซตใน Program คือ <strong>เซตฝึกจริง (working set)</strong> ไม่รวมเซตวอร์มอัพ
        เป้าหมายคือให้แต่ละเซตหนักพอและยังควบคุมท่าได้ ไม่เพิ่มเซตเพียงเพื่อให้โปรแกรมดูหนักขึ้น
      </p>
      <p style={{ marginBottom: 6 }}>
        <strong>RIR</strong> คือจำนวนครั้งที่คุณคิดว่ายังทำต่อได้ก่อนหมดแรง เช่น RIR 2 = จบเซตแล้วน่าจะทำต่อได้อีกประมาณ 2 ครั้ง
      </p>
      <p style={{ marginBottom: 0 }}>
        ถ้าทำจำนวนครั้งถึงเป้าแล้วแต่ท่ายังไม่นิ่งหรือช่วงลงยังคุมไม่ได้ ให้คงน้ำหนักเดิมก่อน แล้วทำให้เซตนั้นดีขึ้น
      </p>
    </section>
  );
}
