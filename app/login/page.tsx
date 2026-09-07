import Link from "next/link";
import { LoginPanel } from "@/components/login-panel";

export default function LoginPage() {
  return <main className="main"><div style={{ padding: "48px 0 24px" }}><Link className="brand" href="/">KDKAMATO <span>PROGRAM</span></Link></div><h2>เข้าสู่ระบบเดียวกับ Program history ของคุณ</h2><p>ข้อมูล Free จะต่อเนื่องไป Lab และ PRO ภายใต้ user เดิม.</p><LoginPanel /></main>;
}
