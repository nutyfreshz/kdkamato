import Link from "next/link";
import styles from "./program-app.module.css";

const nav = [
  ["Home", "/home"],
  ["Program", "/program"],
  ["Lab", "/lab"],
  ["Progress", "/progress"],
  ["Consult", "/consult"],
  ["Account", "/account"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/home">KDKAMATO <span>PROGRAM</span></Link>
        <nav className={styles.nav}>{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      </aside>
      <main className={styles.main}>{children}</main>
      <nav className={styles.bottomNav}>{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    </div>
  );
}
