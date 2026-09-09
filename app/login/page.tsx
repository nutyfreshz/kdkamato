import Link from "next/link";
import { LoginPanel } from "@/components/login-panel";
import styles from "@/components/program-app.module.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ physical?: string }> }) {
  const params = await searchParams;
  const physicalMode = params.physical === "1";

  return <main className={styles.standalone}>
    <Link className={styles.standaloneBrand} href="/">KDKAMATO <span>PROGRAM</span></Link>
    <h1>{physicalMode ? "Physical Consult Login" : "เข้าสู่ระบบเดียวกับ Program history ของคุณ"}</h1>
    <p>{physicalMode ? "สำหรับ Trainer ที่กำลังใช้ session ของ user เดิมบนอุปกรณ์นี้" : "ข้อมูล Free จะต่อเนื่องไป Lab และ PRO ภายใต้ user เดิม."}</p>
    <LoginPanel redirectTo={physicalMode ? "/physical-consult" : "/home"} physicalMode={physicalMode} />
    {!physicalMode ? <p style={{ marginTop: 18 }}><Link href="/login?physical=1">เปิด Physical Consult Login →</Link></p> : <p style={{ marginTop: 18 }}><Link href="/login">กลับ Login ปกติ →</Link></p>}
  </main>;
}
