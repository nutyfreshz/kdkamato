import Link from "next/link";
import { LoginPanel } from "@/components/login-panel";
import styles from "@/components/program-app.module.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ physical?: string }> }) {
  const params = await searchParams;
  const physicalMode = params.physical === "1";

  return <main className={`${styles.standalone} program-standalone`}>
    <Link className={styles.standaloneBrand} href="/">KDKAMATO <span>PROGRAM</span></Link>
    <h1>{physicalMode ? "เข้าสู่ระบบสำหรับปรึกษาเทรนเนอร์" : "ใช้บัญชีเดิมเพื่อดูประวัติโปรแกรมต่อเนื่อง"}</h1>
    <p>{physicalMode ? "สำหรับใช้งานบัญชีของผู้ฝึกบนอุปกรณ์เทรนเนอร์" : "ข้อมูลจาก FREE ใช้ต่อใน LAB และ PRO ได้ผ่านบัญชีเดิม"}</p>
    <LoginPanel redirectTo={physicalMode ? "/physical-consult" : "/home"} physicalMode={physicalMode} />
    {!physicalMode ? <p style={{ marginTop: 18 }}><Link href="/login?physical=1">เปิดหน้าเข้าสู่ระบบสำหรับปรึกษาเทรนเนอร์ →</Link></p> : <p style={{ marginTop: 18 }}><Link href="/login">กลับหน้าเข้าสู่ระบบทั่วไป →</Link></p>}
  </main>;
}
