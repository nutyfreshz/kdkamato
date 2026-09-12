"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_GROUPS = [
  ".hero-copy > *",
  ".manga .section-heading",
  ".manga-feature",
  ".manga-row .manga-card",
  ".manga .section-link",
  ".knowledge .section-heading",
  ".knowledge-stage",
  ".article-grid article",
  ".lab .section-heading",
  ".lab-demo",
  ".tool-teasers a",
  ".portal > .eyebrow",
  ".portal > h2",
  ".portal-links",
  ".listing-page > *",
  ".reader-head > *",
  ".article-page > header > *",
  ".footer > *",
];

const PARALLAX_SELECTORS = [
  [".knowledge-visual", 16],
  [".manga-cover.real-cover", 12],
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
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

    const parallaxNodes = PARALLAX_SELECTORS.flatMap(([selector, strength]) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map((node) => ({ node, strength })),
    );
    const descent = document.querySelector<HTMLElement>(".descent");
    const chapters = Array.from(document.querySelectorAll<HTMLElement>("[data-story-chapter]"));
    let chapterBounds: { node: HTMLElement; top: number; height: number }[] = [];
    let dimensionsDirty = true;
    const storyLayout = window.matchMedia("(min-width: 901px) and (min-height: 641px)");
    const resizeObserver = new ResizeObserver(() => {
      dimensionsDirty = true;
      onScroll();
    });

    let frame = 0;
    const updateScrollMotion = () => {
      frame = 0;
      const viewport = Math.max(1, window.innerHeight);

      parallaxNodes.forEach(({ node, strength }) => {
        const rect = node.getBoundingClientRect();
        const progress = clamp((viewport - rect.top) / (viewport + rect.height));
        const y = (0.5 - progress) * strength;
        node.style.setProperty("--motion-y", `${y.toFixed(2)}px`);
      });

      if (descent) {
        const rect = descent.getBoundingClientRect();
        const travel = Math.max(1, rect.height - viewport);
        const progress = clamp(-rect.top / travel);
        const entry = clamp((viewport - rect.top) / viewport);
        descent.style.setProperty("--descent-motion-progress", progress.toFixed(4));
        descent.style.setProperty("--descent-entry", entry.toFixed(4));
        descent.style.setProperty("--descent-motion-y", `${((0.5 - progress) * 22).toFixed(2)}px`);
      }

      // Cache untransformed chapter geometry only after a layout change.
      // Native sticky owns the handoff; this controller only reframes the camera.
      if (dimensionsDirty) {
        chapterBounds = chapters.map((node) => ({
          node, top: node.getBoundingClientRect().top + window.scrollY, height: node.offsetHeight,
        }));
        dimensionsDirty = false;
      }
      chapterBounds.forEach(({ node, top, height }) => {
        if (!storyLayout.matches) {
          node.style.removeProperty("--story-scale");
          node.style.removeProperty("--story-copy-y");
          return;
        }
        const p = clamp((window.scrollY - top) / Math.max(1, height - viewport));
        node.style.setProperty("--story-scale", (1 + p * 0.025).toFixed(4));
        node.style.setProperty("--story-copy-y", `${(-p * 24).toFixed(2)}px`);
      });
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrollMotion);
    };

    updateScrollMotion();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => { dimensionsDirty = true; onScroll(); };
    resizeObserver.observe(document.body);
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      revealNodes.forEach((node) => {
        delete node.dataset.motionReveal;
        delete node.dataset.motionVisible;
        node.style.removeProperty("--motion-delay");
      });
      parallaxNodes.forEach(({ node }) => node.style.removeProperty("--motion-y"));
      descent?.style.removeProperty("--descent-motion-progress");
      descent?.style.removeProperty("--descent-entry");
      descent?.style.removeProperty("--descent-motion-y");
      chapters.forEach((node) => {
        node.style.removeProperty("--story-scale");
        node.style.removeProperty("--story-copy-y");
      });
      document.documentElement.classList.remove("kdk-motion-ready");
      body.classList.remove("kdk-route-enter");
    };
  }, [pathname]);

  return null;
}
