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
  ".training-copy > *",
  ".kendo-copy > *",
  ".portal > .eyebrow",
  ".portal > h2",
  ".portal-links",
  ".listing-page > *",
  ".reader-head > *",
  ".article-page > header > *",
  ".footer > *",
];

const PARALLAX_SELECTORS = [
  [".training-image", 34],
  [".kendo-image", 30],
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
    const training = document.querySelector<HTMLElement>(".training");
    const kendo = document.querySelector<HTMLElement>(".kendo");

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

      /* Training -> Kendo is treated as one cinematic handoff instead of two stacked blocks.
         The incoming scene feathers in while the outgoing scene is gently dimmed. */
      if (training && kendo) {
        const rect = kendo.getBoundingClientRect();
        const transition = clamp((viewport - rect.top) / (viewport * 0.72));
        const eased = 1 - Math.pow(1 - transition, 3);

        kendo.style.setProperty("--scene-in", eased.toFixed(4));
        kendo.style.setProperty("--scene-in-opacity", (0.18 + eased * 0.82).toFixed(4));
        kendo.style.setProperty("--scene-in-y", `${((1 - eased) * 42).toFixed(2)}px`);
        training.style.setProperty("--scene-out", eased.toFixed(4));
        training.style.setProperty("--scene-out-dim", (eased * 0.64).toFixed(4));
        training.style.setProperty("--scene-out-copy", Math.max(0.18, 1 - eased * 0.86).toFixed(4));
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrollMotion);
    };

    updateScrollMotion();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      revealNodes.forEach((node) => {
        delete node.dataset.motionReveal;
        delete node.dataset.motionVisible;
        node.style.removeProperty("--motion-delay");
      });
      parallaxNodes.forEach(({ node }) => node.style.removeProperty("--motion-y"));
      descent?.style.removeProperty("--descent-motion-progress");
      descent?.style.removeProperty("--descent-entry");
      descent?.style.removeProperty("--descent-motion-y");
      training?.style.removeProperty("--scene-out");
      training?.style.removeProperty("--scene-out-dim");
      training?.style.removeProperty("--scene-out-copy");
      kendo?.style.removeProperty("--scene-in");
      kendo?.style.removeProperty("--scene-in-opacity");
      kendo?.style.removeProperty("--scene-in-y");
      document.documentElement.classList.remove("kdk-motion-ready");
      body.classList.remove("kdk-route-enter");
    };
  }, [pathname]);

  return null;
}
