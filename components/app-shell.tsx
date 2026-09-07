import Link from "next/link";

const nav = [
  ["Home", "/home"],
  ["Program", "/program"],
  ["Lab", "/lab"],
  ["Progress", "/progress"],
  ["Account", "/account"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/home">KDKAMATO <span>PROGRAM</span></Link>
        <nav className="nav">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      </aside>
      <main className="main">{children}</main>
      <nav className="bottom-nav">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    </div>
  );
}
