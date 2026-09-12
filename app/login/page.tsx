import Link from "next/link";
import { LoginPanel } from "@/components/login-panel";
import styles from "@/components/program-app.module.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ physical?: string }> }) {
  const params = await searchParams;
  const physicalMode = params.physical === "1";

  return <main className={`${styles.standalone} program-standalone`}>
    <Link className={styles.standaloneBrand} href="/">KDKAMATO <span>PROGRAM</span></Link>
    <h1>{physicalMode ? "เข้าสู่ Physical Consult" : "เข้าสู่ระบบด้วยบัญชีเดียว เพื่อใช้ประวัติ Program ต่อเนื่อง"}</h1>
    <p>{physicalMode ? "สำหรับ Trainer ที่กำลังใช้เซสชันของผู้ใช้เดิมบนอุปกรณ์นี้" : "ข้อมูลระดับ Free จะต่อเนื่องไปยัง LAB และ PRO ภายใต้บัญชีเดิม"}</p>
    <LoginPanel redirectTo={physicalMode ? "/physical-consult" : "/home"} physicalMode={physicalMode} />
    {!physicalMode ? <p style={{ marginTop: 18 }}><Link href="/login?physical=1">เปิดหน้าเข้าสู่ระบบ Physical Consult →</Link></p> : <p style={{ marginTop: 18 }}><Link href="/login">กลับไปหน้าเข้าสู่ระบบปกติ →</Link></p>}
  </main>;
}
