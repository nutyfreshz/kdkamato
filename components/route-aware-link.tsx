"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  exact?: boolean;
};

export function RouteAwareLink({ href, children, exact = false, ...props }: Props) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : href.pathname ?? "";
  const active = target
    ? exact
      ? pathname === target
      : pathname === target || pathname.startsWith(`${target}/`)
    : false;

  return (
    <Link href={href} aria-current={active ? "page" : undefined} {...props}>
      {children}
    </Link>
  );
}
