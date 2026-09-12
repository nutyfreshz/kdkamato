"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_GROUPS = [
  { selector: ".hero-copy > *", x: 0, y: 16, scale: 0.995, step: 58 },
  { selector: ".manga .section-heading > *", x: -10, y: 22, scale: 0.994, step: 54 },
  { selector: ".manga-feature", x: 0, y: 28, scale: 0.988, step: 0 },
  { selector: ".manga-row .manga-card", x: 0, y: 24, scale: 0.992, step: 70 },
  { selector: ".manga .section-link", x: 10, y: 12, scale: 1, step: 0 },
  { selector: ".knowledge .section-heading > *", x: -12, y: 20, scale: 0.994, step: 52 },
  { selector: ".knowledge-stage", x: 0, y: 30, scale: 0.989, step: 0 },
  { selector: ".article-grid article", x: 0, y: 24, scale: 0.992, step: 72 },
  { selector: ".lab .section-heading > *", x: -10, y: 20, scale: 0.994, step: 52 },
  { selector: ".lab-demo", x: 0, y: 30, scale: 0.989, step: 0 },
  { selector: ".tool-teasers a", x: 0, y: 20, scale: 0.994, step: 66 },
  { selector: ".training-copy > *", x: -8, y: 20, scale: 0.995, step: 56 },
  { selector: ".kendo-copy > *", x: -8, y: 20, scale: 0.995, step: 56 },
  { selector: ".portal > .eyebrow", x: -8, y: 16, scale: 1, step: 0 },
  { selector: ".portal > h2", x: -12, y: 22, scale: 0.995, step: 0 },
  { selector: ".portal-links a", x: 0, y: 18, scale: 0.996, step: 62 },
  { selector: ".listing-page > *", x: 0, y: 18, scale: 0.996, step: 50 },
  { selector: ".reader-head > *", x: 0, y: 18, scale: 0.996, step: 50 },
  { selector: ".article-page > header > *", x: 0, y: 18, scale: 0.996, step: 50 },
  { selector: ".footer > *", x: 0, y: 16, scale: 0.997, step: 60 },
] as const;

const PARALLAX_SELECTORS = [
  [".knowledge-visual", 14],
  [".manga-cover.real-cover", 12],
] as const;

const HOME_SCENE_SELECTORS = [".manga", ".knowledge", ".lab", ".portal"] as const;

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
    REVEAL_GROUPS.forEach(({ selector, x, y, scale, step }) => {
      const group = Array.from(document.querySelectorAll<HTMLElement>(selector));
      group.forEach((node, index) => {
        node.dataset.motionReveal = "true";
        node.style.setProperty("--motion-delay", `${Math.min(index * step, 240)}ms`);
        node.style.setProperty("--motion-x-start", `${x}px`);
        node.style.setProperty("--motion-y-start", `${y}px`);
        node.style.setProperty("--motion-scale-start", String(scale));
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
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );

    revealNodes.forEach((node) => observer.observe(node));

    const parallaxNodes = PARALLAX_SELECTORS.flatMap(([selector, strength]) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map((node) => ({ node, strength })),
    );
    const homeScenes = HOME_SCENE_SELECTORS.flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)),
    );
    const hero = document.querySelector<HTMLElement>(".hero");
    const breather = document.querySelector<HTMLElement>(".breather");
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

      if (hero) {
        const rect = hero.getBoundingClientRect();
        const exit = smoothstep(-rect.top / Math.max(1, viewport * 0.72));
        hero.style.setProperty("--hero-exit", exit.toFixed(4));
        hero.style.setProperty("--hero-copy-opacity", (1 - exit * 0.72).toFixed(4));
        hero.style.setProperty("--hero-copy-y", `${(-exit * 30).toFixed(2)}px`);
        hero.style.setProperty("--hero-handoff", (0.26 + exit * 0.74).toFixed(4));
      }

      parallaxNodes.forEach(({ node, strength }) => {
        const rect = node.getBoundingClientRect();
        const progress = clamp((viewport - rect.top) / (viewport + rect.height));
        const y = (0.5 - progress) * strength;
        node.style.setProperty("--motion-y", `${y.toFixed(2)}px`);
      });

      homeScenes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const enter = smoothstep((viewport - rect.top) / Math.max(1, viewport * 0.55));
        const exit = smoothstep((viewport - rect.bottom) / Math.max(1, viewport * 0.55));
        const center = clamp((viewport - rect.top) / Math.max(1, viewport + rect.height));
        const sheen = Math.sin(Math.PI * center);
        node.style.setProperty("--scene-enter", enter.toFixed(4));
        node.style.setProperty("--scene-exit", exit.toFixed(4));
        node.style.setProperty("--scene-top-opacity", (1 - enter).toFixed(4));
        node.style.setProperty("--scene-bottom-opacity", exit.toFixed(4));
        node.style.setProperty("--scene-ambient-y", `${((0.5 - center) * 26).toFixed(2)}px`);
        node.style.setProperty("--scene-sheen-opacity", (sheen * 0.58).toFixed(4));
      });

      if (breather) {
        const rect = breather.getBoundingClientRect();
        const progress = clamp((viewport - rect.top) / Math.max(1, viewport + rect.height));
        const glow = Math.sin(Math.PI * progress);
        breather.style.setProperty("--breather-progress", progress.toFixed(4));
        breather.style.setProperty("--breather-glow", (glow * 0.82).toFixed(4));
        breather.style.setProperty("--breather-y", `${((0.5 - progress) * 34).toFixed(2)}px`);
      }

      if (descent) {
        const rect = descent.getBoundingClientRect();
        const travel = Math.max(1, rect.height - viewport);
        const progress = clamp(-rect.top / travel);
        const entry = smoothstep((viewport - rect.top) / Math.max(1, viewport * 0.72));
        descent.style.setProperty("--descent-motion-progress", progress.toFixed(4));
        descent.style.setProperty("--descent-entry", entry.toFixed(4));
        descent.style.setProperty("--descent-motion-y", `${((0.5 - progress) * 18).toFixed(2)}px`);
      }

      if (visualStory && training && trainingImage && trainingCopy && kendo && kendoImage && kendoCopy) {
        const rect = visualStory.getBoundingClientRect();
        const travel = Math.max(1, rect.height - viewport);
        const progress = clamp(-rect.top / travel);
        const storyEntry = smoothstep((viewport - rect.top) / Math.max(1, viewport * 0.58));

        const imageHandoff = smoothstep((progress - 0.12) / 0.56);
        const trainingExit = smoothstep((progress - 0.16) / 0.42);
        const kendoCopyIn = smoothstep((progress - 0.5) / 0.24);
        const veilProgress = clamp((progress - 0.1) / 0.72);
        const veil = Math.sin(Math.PI * veilProgress) * 0.16;

        visualStory.style.setProperty("--story-progress", progress.toFixed(4));
        visualStory.style.setProperty("--story-entry", storyEntry.toFixed(4));
        visualStory.style.setProperty("--story-entry-y", `${((1 - storyEntry) * 22).toFixed(2)}px`);
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
        node.style.removeProperty("--motion-x-start");
        node.style.removeProperty("--motion-y-start");
        node.style.removeProperty("--motion-scale-start");
      });
      parallaxNodes.forEach(({ node }) => node.style.removeProperty("--motion-y"));
      homeScenes.forEach((node) => {
        node.style.removeProperty("--scene-enter");
        node.style.removeProperty("--scene-exit");
        node.style.removeProperty("--scene-top-opacity");
        node.style.removeProperty("--scene-bottom-opacity");
        node.style.removeProperty("--scene-ambient-y");
        node.style.removeProperty("--scene-sheen-opacity");
      });
      hero?.style.removeProperty("--hero-exit");
      hero?.style.removeProperty("--hero-copy-opacity");
      hero?.style.removeProperty("--hero-copy-y");
      hero?.style.removeProperty("--hero-handoff");
      breather?.style.removeProperty("--breather-progress");
      breather?.style.removeProperty("--breather-glow");
      breather?.style.removeProperty("--breather-y");
      descent?.style.removeProperty("--descent-motion-progress");
      descent?.style.removeProperty("--descent-entry");
      descent?.style.removeProperty("--descent-motion-y");
      visualStory?.style.removeProperty("--story-progress");
      visualStory?.style.removeProperty("--story-entry");
      visualStory?.style.removeProperty("--story-entry-y");
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
