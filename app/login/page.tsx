import Link from "next/link";
import { LoginPanel } from "@/components/login-panel";
import styles from "@/components/program-app.module.css";

export default function LoginPage() {
  return <main className={styles.standalone}>
    <Link className={styles.standaloneBrand} href="/">KDKAMATO <span>PROGRAM</span></Link>
    <h1>เข้าสู่ระบบเดียวกับ Program history ของคุณ</h1>
    <p>ข้อมูล Free จะต่อเนื่องไป Lab และ PRO ภายใต้ user เดิม.</p>
    <LoginPanel />
  </main>;
}
