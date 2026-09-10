import Link from "next/link";
import styles from "./program-app.module.css";

const desktopNav = [
  ["หน้าแรก", "/home"],
  ["Program", "/program"],
  ["LAB", "/lab"],
  ["ความคืบหน้า", "/progress"],
  ["PRO Review", "/consult"],
  ["บัญชี", "/account"],
] as const;

const bottomNav = [
  ["หน้าแรก", "/home"],
  ["Program", "/program"],
  ["LAB", "/lab"],
  ["ความคืบหน้า", "/progress"],
  ["บัญชี", "/account"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/home">KDKAMATO <span>PROGRAM</span></Link>
        <nav className={styles.nav}>{desktopNav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      </aside>
      <main className={styles.main}>{children}</main>
      <nav className={styles.bottomNav}>{bottomNav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    </div>
  );
}
