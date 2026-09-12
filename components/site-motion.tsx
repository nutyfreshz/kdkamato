"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_GROUPS = [
  ".listing-page > *", ".reader-head > *", ".article-page > header > *", ".footer > *",
];

export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    // HomePage mounts its own controller after streamed content is present.
    if (pathname === "/") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const body = document.body;

    body.classList.remove("kdk-route-enter");
    void body.offsetWidth;
    body.classList.add("kdk-route-enter");

    const revealNodes: HTMLElement[] = [];
    REVEAL_GROUPS.forEach((selector) => {
      const group = Array.from(document.querySelectorAll<HTMLElement>(selector));
      group.forEach((node, index) => {
        node.dataset.motionReveal = "true";
        node.style.setProperty("--motion-delay", `${Math.min(index * 70, 280)}ms`);
        revealNodes.push(node);
      });
    });

    if (reduceMotion) {
      revealNodes.forEach((node) => {
        node.dataset.motionVisible = "true";
      });
      return () => body.classList.remove("kdk-route-enter");
    }

    document.documentElement.classList.add("kdk-motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const node = entry.target as HTMLElement;
          node.dataset.motionVisible = "true";
          observer.unobserve(node);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
    );

    revealNodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
      revealNodes.forEach((node) => {
        delete node.dataset.motionReveal;
        delete node.dataset.motionVisible;
        node.style.removeProperty("--motion-delay");
      });
      document.documentElement.classList.remove("kdk-motion-ready");
      body.classList.remove("kdk-route-enter");
    };
  }, [pathname]);

  return null;
}
