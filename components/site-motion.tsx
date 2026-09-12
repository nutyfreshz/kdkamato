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
  [".knowledge-visual", 12],
  [".manga-cover.real-cover", 10],
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
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
        node.style.setProperty("--motion-delay", `${Math.min(index * 55, 220)}ms`);
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
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );

    revealNodes.forEach((node) => observer.observe(node));

    const parallaxNodes = PARALLAX_SELECTORS.flatMap(([selector, strength]) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map((node) => ({ node, strength })),
    );
    const descent = document.querySelector<HTMLElement>(".descent");
    const visualStory = document.querySelector<HTMLElement>(".visual-story");
    const training = document.querySelector<HTMLElement>(".visual-scene-training");
    const trainingImage = document.querySelector<HTMLElement>(".visual-scene-training .training-image");
    const trainingCopy = document.querySelector<HTMLElement>(".visual-scene-training .training-copy");
    const kendo = document.querySelector<HTMLElement>(".visual-scene-kendo");
    const kendoImage = document.querySelector<HTMLElement>(".visual-scene-kendo .kendo-image");
    const kendoCopy = document.querySelector<HTMLElement>(".visual-scene-kendo .kendo-copy");

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
        descent.style.setProperty("--descent-motion-y", `${((0.5 - progress) * 18).toFixed(2)}px`);
      }

      if (visualStory && training && trainingImage && trainingCopy && kendo && kendoImage && kendoCopy) {
        const rect = visualStory.getBoundingClientRect();
        const travel = Math.max(1, rect.height - viewport);
        const progress = clamp(-rect.top / travel);

        const imageHandoff = smoothstep((progress - 0.12) / 0.56);
        const trainingExit = smoothstep((progress - 0.16) / 0.42);
        const kendoCopyIn = smoothstep((progress - 0.5) / 0.24);
        const veilProgress = clamp((progress - 0.1) / 0.72);
        const veil = Math.sin(Math.PI * veilProgress) * 0.16;

        visualStory.style.setProperty("--story-progress", progress.toFixed(4));
        visualStory.style.setProperty("--story-veil", veil.toFixed(4));

        training.style.setProperty("--training-dim", (imageHandoff * 0.68).toFixed(4));
        trainingImage.style.setProperty("--training-scale", (1.035 + imageHandoff * 0.035).toFixed(4));
        trainingImage.style.setProperty("--training-y", `${(-imageHandoff * 18).toFixed(2)}px`);
        trainingCopy.style.setProperty("--training-copy-opacity", (1 - trainingExit * 0.94).toFixed(4));
        trainingCopy.style.setProperty("--training-copy-y", `${(-trainingExit * 24).toFixed(2)}px`);

        kendo.style.setProperty("--kendo-scene-opacity", imageHandoff.toFixed(4));
        kendoImage.style.setProperty("--kendo-scale", (1.095 - imageHandoff * 0.045).toFixed(4));
        kendoImage.style.setProperty("--kendo-y", `${((1 - imageHandoff) * 34).toFixed(2)}px`);
        kendoCopy.style.setProperty("--kendo-copy-opacity", kendoCopyIn.toFixed(4));
        kendoCopy.style.setProperty("--kendo-copy-y", `${((1 - kendoCopyIn) * 28).toFixed(2)}px`);
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
      visualStory?.style.removeProperty("--story-progress");
      visualStory?.style.removeProperty("--story-veil");
      training?.style.removeProperty("--training-dim");
      trainingImage?.style.removeProperty("--training-scale");
      trainingImage?.style.removeProperty("--training-y");
      trainingCopy?.style.removeProperty("--training-copy-opacity");
      trainingCopy?.style.removeProperty("--training-copy-y");
      kendo?.style.removeProperty("--kendo-scene-opacity");
      kendoImage?.style.removeProperty("--kendo-scale");
      kendoImage?.style.removeProperty("--kendo-y");
      kendoCopy?.style.removeProperty("--kendo-copy-opacity");
      kendoCopy?.style.removeProperty("--kendo-copy-y");
      document.documentElement.classList.remove("kdk-motion-ready");
      body.classList.remove("kdk-route-enter");
    };
  }, [pathname]);

  return null;
}
