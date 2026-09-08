import Link from "next/link";
import styles from "./program-app.module.css";

const desktopNav = [
  ["Home", "/home"],
  ["Program", "/program"],
  ["Lab", "/lab"],
  ["Progress", "/progress"],
  ["Consult", "/consult"],
  ["Account", "/account"],
] as const;

const bottomNav = [
  ["Home", "/home"],
  ["Program", "/program"],
  ["Lab", "/lab"],
  ["Progress", "/progress"],
  ["Account", "/account"],
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
