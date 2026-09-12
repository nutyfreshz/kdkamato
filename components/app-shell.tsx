import Link from "next/link";
import styles from "./program-app.module.css";
import { RouteAwareLink } from "./route-aware-link";

const desktopNav = [
  ["หน้าแรก", "/home", true],
  ["โปรแกรม", "/program", false],
  ["LAB", "/lab", false],
  ["ผลการฝึก", "/progress", true],
  ["PRO Review", "/consult", false],
  ["คู่มือ", "/guide", false],
  ["บัญชี", "/account", true],
] as const;

const bottomNav = [
  ["หน้าแรก", "/home", true],
  ["โปรแกรม", "/program", false],
  ["LAB", "/lab", false],
  ["ผลการฝึก", "/progress", true],
  ["บัญชี", "/account", true],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${styles.root} app-shell`}>
      <a className="skip-link" href="#app-main-content">ข้ามไปเนื้อหา</a>
      <aside className={`${styles.sidebar} app-sidebar`}>
        <Link className={styles.brand} href="/home">KDKAMATO <span>PROGRAM</span></Link>
        <nav className={`${styles.nav} app-nav`} aria-label="เมนูโปรแกรม">
          {desktopNav.map(([label, href, exact]) => (
            <RouteAwareLink key={href} href={href} exact={exact}>{label}</RouteAwareLink>
          ))}
        </nav>
      </aside>
      <main id="app-main-content" className={`${styles.main} app-main`} tabIndex={-1}>
        <div className="app-mobile-guide"><Link href="/guide">คู่มือการใช้งาน</Link></div>
        {children}
      </main>
      <nav className={`${styles.bottomNav} app-bottom-nav`} aria-label="เมนูโปรแกรมบนมือถือ">
        {bottomNav.map(([label, href, exact]) => (
          <RouteAwareLink key={href} href={href} exact={exact}>{label}</RouteAwareLink>
        ))}
      </nav>
    </div>
  );
}
