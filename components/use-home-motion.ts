"use client";

import { useEffect, useRef } from "react";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => n * n * (3 - 2 * n);

type MotionBound = { node: HTMLElement; top: number; height: number };

export function useHomeMotion() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const home = root.current;
    if (!home) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia("(max-width: 900px), (max-height: 640px)");

    const targets = Array.from(home.querySelectorAll<HTMLElement>(
      ".section-heading, .manga-feature, .manga-row, .knowledge-stage, .article-grid, .lab-demo, .tool-teasers, .portal-links"
    ));
    const sceneNodes = Array.from(home.querySelectorAll<HTMLElement>(
      ".manga, .knowledge, .lab, .portal"
    ));
    const hero = home.querySelector<HTMLElement>(".hero");
    const descent = home.querySelector<HTMLElement>(".descent");
    const frames = Array.from(home.querySelectorAll<HTMLElement>(".descent-frame"));
    const captions = Array.from(home.querySelectorAll<HTMLElement>(".descent-copy"));
    const story = home.querySelector<HTMLElement>("[data-home-story]");
    const chapters = Array.from(home.querySelectorAll<HTMLElement>("[data-story-chapter]"));

    let bounds: MotionBound[] = [];
    let sceneBounds: MotionBound[] = [];
    let descentTop = 0;
    let descentHeight = 1;
    let storyTop = 0;
    let storyHeight = 1;
    let viewport = 1;
    let dirty = true;
    let frame = 0;
    let disposed = false;

    const measure = () => {
      const y = window.scrollY;
      viewport = Math.max(1, window.innerHeight);
      bounds = targets.map((node) => ({
        node,
        top: node.getBoundingClientRect().top + y - parseFloat(node.style.getPropertyValue("--home-lift") || "0"),
        height: node.offsetHeight,
      }));
      sceneBounds = sceneNodes.map((node) => ({
        node,
        top: node.getBoundingClientRect().top + y,
        height: node.offsetHeight,
      }));
      if (descent) {
        descentTop = descent.getBoundingClientRect().top + y;
        descentHeight = descent.offsetHeight;
      }
      if (story) {
        storyTop = story.getBoundingClientRect().top + y;
        storyHeight = story.offsetHeight;
      }
      dirty = false;
    };

    const update = () => {
      frame = 0;
      if (disposed) return;
      if (dirty) measure();

      const y = window.scrollY;
      const reduce = reduced.matches;
      const isCompact = compact.matches;
      home.dataset.homeMotion = reduce ? "reduced" : "active";

      const distance = isCompact ? 18 : 34;
      bounds.forEach(({ node, top }) => {
        const p = reduce ? 1 : ease(clamp((y + viewport - top) / (viewport * 0.56)));
        node.style.setProperty("--home-lift", `${((1 - p) * distance).toFixed(2)}px`);
        node.style.setProperty("--home-open", p.toFixed(4));
      });

      const heroP = reduce ? 0 : ease(clamp(y / (viewport * 0.92)));
      hero?.style.setProperty("--hero-pan", `${(heroP * viewport * 0.10).toFixed(2)}px`);
      hero?.style.setProperty("--hero-copy-y", `${(-heroP * 34).toFixed(2)}px`);
      hero?.style.setProperty("--hero-copy-opacity", (1 - heroP * 0.72).toFixed(4));
      hero?.style.setProperty("--hero-handoff", (0.26 + heroP * 0.74).toFixed(4));

      hero?.style.setProperty("--v3-hero-x", `${(heroP * -34).toFixed(2)}px`);
      hero?.style.setProperty("--v3-hero-scale", (1.08 + heroP * 0.16).toFixed(4));
      hero?.style.setProperty("--v3-hero-sat", (1 - heroP * 0.18).toFixed(4));
      hero?.style.setProperty("--v3-hero-bright", (1 - heroP * 0.20).toFixed(4));
      hero?.style.setProperty("--v3-hero-copy-y", `${(-heroP * 80).toFixed(2)}px`);
      hero?.style.setProperty("--v3-hero-copy-scale", (1 - heroP * 0.08).toFixed(4));
      hero?.style.setProperty("--v3-hero-copy-opacity", (1 - heroP * 0.78).toFixed(4));
      hero?.style.setProperty("--v3-hero-glow", `${(heroP * 42).toFixed(2)}px`);
      hero?.style.setProperty("--v3-hero-orbit-x", `${(-heroP * 110).toFixed(2)}px`);
      hero?.style.setProperty("--v3-hero-orbit-y", `${(heroP * 40).toFixed(2)}px`);
      hero?.style.setProperty("--v3-hero-orbit-scale", (1 + heroP * 0.18).toFixed(4));

      sceneBounds.forEach(({ node, top, height }) => {
        const enter = reduce ? 1 : ease(clamp((y + viewport - top) / (viewport * 0.55)));
        const exit = reduce ? 0 : ease(clamp((y + viewport - (top + height)) / (viewport * 0.55)));
        const center = clamp((y + viewport - top) / Math.max(1, viewport + height));
        const sheen = reduce ? 0.25 : Math.sin(Math.PI * center);
        const stageP = reduce || isCompact ? 1 : clamp((y - top) / Math.max(1, height - viewport));
        const a = reduce || isCompact ? 1 : ease(clamp(stageP / 0.34));
        const b = reduce || isCompact ? 1 : ease(clamp((stageP - 0.22) / 0.36));
        const c = reduce || isCompact ? 1 : ease(clamp((stageP - 0.56) / 0.34));

        node.style.setProperty("--scene-top-opacity", (1 - enter).toFixed(4));
        node.style.setProperty("--scene-bottom-opacity", exit.toFixed(4));
        node.style.setProperty("--scene-ambient-y", `${((0.5 - center) * (isCompact ? 10 : 26)).toFixed(2)}px`);
        node.style.setProperty("--scene-sheen-opacity", (sheen * 0.58).toFixed(4));
        node.style.setProperty("--v3-p", stageP.toFixed(4));
        node.style.setProperty("--v3-a", a.toFixed(4));
        node.style.setProperty("--v3-b", b.toFixed(4));
        node.style.setProperty("--v3-c", c.toFixed(4));

        if (node.classList.contains("manga")) {
          node.style.setProperty("--v3-manga-bg-y", `${(-stageP * 170).toFixed(2)}px`);
          node.style.setProperty("--v3-manga-heading-opacity", Math.max(0.08, 1 - b * 0.94).toFixed(4));
          node.style.setProperty("--v3-manga-heading-y", `${(-b * 120).toFixed(2)}px`);
          node.style.setProperty("--v3-manga-cover-x", `${(-b * 18).toFixed(2)}vw`);
          node.style.setProperty("--v3-manga-cover-y", `${(-b * 8).toFixed(2)}vh`);
          node.style.setProperty("--v3-manga-cover-scale", (1.08 - b * 0.28).toFixed(4));
          node.style.setProperty("--v3-manga-cover-ry", `${(-b * 7).toFixed(2)}deg`);
          node.style.setProperty("--v3-manga-cover-bright", (1 - c * 0.42).toFixed(4));
          node.style.setProperty("--v3-manga-copy-opacity", Math.max(0.06, 1 - b * 0.94).toFixed(4));
          node.style.setProperty("--v3-manga-copy-y", `${(-b * 110).toFixed(2)}px`);
          node.style.setProperty("--v3-manga-row-opacity", c.toFixed(4));
          node.style.setProperty("--v3-manga-row-y", `${((1 - c) * 190).toFixed(2)}px`);
          node.style.setProperty("--v3-card-1-y", `${((1 - c) * 120).toFixed(2)}px`);
          node.style.setProperty("--v3-card-2-y", `${((1 - c) * 190).toFixed(2)}px`);
          node.style.setProperty("--v3-card-3-y", `${((1 - c) * 260).toFixed(2)}px`);
          node.style.setProperty("--v3-card-1-r", `${(-2 + c * 2).toFixed(2)}deg`);
          node.style.setProperty("--v3-card-2-r", `${(1 - c).toFixed(2)}deg`);
          node.style.setProperty("--v3-card-3-r", `${(2 - c * 2).toFixed(2)}deg`);
        }

        if (node.classList.contains("knowledge")) {
          node.style.setProperty("--v3-knowledge-heading-opacity", Math.max(0.04, 1 - b * 0.96).toFixed(4));
          node.style.setProperty("--v3-knowledge-heading-y", `${(-b * 120).toFixed(2)}px`);
          node.style.setProperty("--v3-knowledge-stage-x", `${((1 - a) * 120 - c * 120).toFixed(2)}px`);
          node.style.setProperty("--v3-knowledge-stage-y", `${(-c * 70).toFixed(2)}px`);
          node.style.setProperty("--v3-knowledge-stage-scale", (0.82 + a * 0.22 - c * 0.16).toFixed(4));
          node.style.setProperty("--v3-knowledge-stage-opacity", Math.max(0.15, 1 - c * 0.82).toFixed(4));
          node.style.setProperty("--v3-knowledge-stage-blur", `${(c * 8).toFixed(2)}px`);
          node.style.setProperty("--v3-knowledge-articles-opacity", c.toFixed(4));
          node.style.setProperty("--v3-knowledge-articles-y", `${((1 - c) * 190).toFixed(2)}px`);
          node.style.setProperty("--v3-knowledge-horizon-opacity", c.toFixed(4));
          node.style.setProperty("--v3-knowledge-horizon-y", `${((1 - c) * 100).toFixed(2)}px`);
        }

        if (node.classList.contains("lab")) {
          node.style.setProperty("--v3-lab-heading-opacity", Math.max(0.04, 1 - b * 0.96).toFixed(4));
          node.style.setProperty("--v3-lab-heading-y", `${(-b * 110).toFixed(2)}px`);
          node.style.setProperty("--v3-lab-grid-opacity", (0.48 + a * 0.34 - c * 0.16).toFixed(4));
          node.style.setProperty("--v3-lab-grid-tilt", `${(64 - a * 42 + c * 10).toFixed(2)}deg`);
          node.style.setProperty("--v3-lab-grid-y", `${(-7 + stageP * 20).toFixed(2)}vh`);
          node.style.setProperty("--v3-lab-grid-scale", (1.35 - a * 0.22 + c * 0.12).toFixed(4));
          node.style.setProperty("--v3-lab-demo-y", `${((1 - a) * 110 - c * 85).toFixed(2)}px`);
          node.style.setProperty("--v3-lab-demo-scale", (0.80 + a * 0.20 - c * 0.12).toFixed(4));
          node.style.setProperty("--v3-lab-demo-tilt", `${((1 - a) * 12 + c * 3).toFixed(2)}deg`);
          node.style.setProperty("--v3-lab-demo-opacity", Math.max(0.26, 1 - c * 0.65).toFixed(4));
          node.style.setProperty("--v3-lab-tools-opacity", c.toFixed(4));
          node.style.setProperty("--v3-lab-tools-y", `${((1 - c) * 180).toFixed(2)}px`);
        }

        if (node.classList.contains("portal")) {
          node.style.setProperty("--v3-portal-heading-opacity", (0.18 + enter * 0.82).toFixed(4));
          node.style.setProperty("--v3-portal-heading-y", `${((1 - enter) * 90).toFixed(2)}px`);
          node.style.setProperty("--v3-portal-row-opacity", enter.toFixed(4));
          node.style.setProperty("--v3-portal-row-y", `${((1 - enter) * 100).toFixed(2)}px`);
        }
      });

      if (descent) {
        const p = clamp((y - descentTop) / Math.max(1, descentHeight - viewport));
        const entry = reduce ? 1 : ease(clamp((y + viewport - descentTop) / (viewport * 0.72)));
        descent.style.setProperty("--descent-progress", p.toFixed(4));
        descent.style.setProperty("--descent-entry", entry.toFixed(4));
        descent.style.setProperty("--descent-motion-y", `${((0.5 - p) * (isCompact ? 8 : 18)).toFixed(2)}px`);
        descent.style.setProperty("--v3-descent-scale", (1.09 - p * 0.07).toFixed(4));
        descent.style.setProperty("--v3-descent-sat", (0.88 + p * 0.18).toFixed(4));
        descent.style.setProperty("--v3-descent-contrast", (1.08 + Math.sin(Math.PI * p) * 0.08).toFixed(4));
        descent.style.setProperty("--v3-descent-copy-x", `${((0.5 - p) * 60).toFixed(2)}px`);

        const activeIndex = Math.min(frames.length - 1, Math.floor(p * frames.length));
        frames.forEach((node, index) => {
          const active = index === activeIndex;
          node.classList.toggle("is-active", active);
          node.style.setProperty("--descent-depth", `${Math.abs(index - activeIndex)}`);
        });
        captions.forEach((node, index) => {
          const active = index === activeIndex;
          node.setAttribute("aria-hidden", active ? "false" : "true");
          node.classList.toggle("is-active", active);
        });
      }

      if (story && chapters.length >= 2) {
        const p = clamp((y - storyTop) / Math.max(1, storyHeight - viewport));
        const entry = reduce ? 1 : ease(clamp((y + viewport - storyTop) / (viewport * 0.58)));
        story.style.setProperty("--story-entry", entry.toFixed(4));
        story.style.setProperty("--story-entry-y", `${((1 - entry) * 22).toFixed(2)}px`);
        story.style.setProperty("--v3-story-atmosphere", (0.28 + Math.sin(Math.PI * p) * 0.58).toFixed(4));
        story.style.setProperty("--v3-story-sat", (1.02 + Math.sin(Math.PI * p) * 0.12).toFixed(4));
        story.style.setProperty("--v3-story-contrast", (1.02 + Math.sin(Math.PI * p) * 0.08).toFixed(4));

        const handoff = reduce || isCompact ? 1 : ease(clamp((p - 0.12) / 0.56));
        const trainingExit = reduce || isCompact ? 0 : ease(clamp((p - 0.16) / 0.42));
        const kendoCopyIn = reduce || isCompact ? 1 : ease(clamp((p - 0.5) / 0.24));

        const training = chapters[0];
        const kendo = chapters[1];
        training.style.setProperty("--story-dim", (handoff * 0.68).toFixed(4));
        training.style.setProperty("--story-art-scale", (1.035 + handoff * 0.035).toFixed(4));
        training.style.setProperty("--story-art-y", `${(-handoff * 18).toFixed(2)}px`);
        training.style.setProperty("--story-copy-opacity", (1 - trainingExit * 0.94).toFixed(4));
        training.style.setProperty("--story-copy-y", `${(-trainingExit * 24).toFixed(2)}px`);

        kendo.style.setProperty("--story-scene-opacity", handoff.toFixed(4));
        kendo.style.setProperty("--story-art-scale", (1.095 - handoff * 0.045).toFixed(4));
        kendo.style.setProperty("--story-art-y", `${((1 - handoff) * 34).toFixed(2)}px`);
        kendo.style.setProperty("--story-copy-opacity", kendoCopyIn.toFixed(4));
        kendo.style.setProperty("--story-copy-y", `${((1 - kendoCopyIn) * 28).toFixed(2)}px`);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const invalidate = () => {
      dirty = true;
      schedule();
    };

    const observer = new ResizeObserver(invalidate);
    observer.observe(home);
    targets.forEach((node) => observer.observe(node));
    sceneNodes.forEach((node) => observer.observe(node));
    if (story) observer.observe(story);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", invalidate);
    window.addEventListener("hashchange", schedule);
    window.addEventListener("pageshow", invalidate);
    reduced.addEventListener("change", invalidate);
    compact.addEventListener("change", invalidate);
    home.addEventListener("load", invalidate, true);
    document.fonts.ready.then(() => {
      if (!disposed) invalidate();
    });

    update();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("pageshow", invalidate);
      reduced.removeEventListener("change", invalidate);
      compact.removeEventListener("change", invalidate);
      home.removeEventListener("load", invalidate, true);
      delete home.dataset.homeMotion;

      [hero, descent, story].forEach((node) => {
        if (!node) return;
        Array.from(node.style).forEach((name) => {
          if (name.startsWith("--v3-") || name.startsWith("--hero-") || name.startsWith("--descent-") || name.startsWith("--story-")) {
            node.style.removeProperty(name);
          }
        });
      });

      sceneNodes.forEach((node) => {
        Array.from(node.style).forEach((name) => {
          if (name.startsWith("--v3-") || name.startsWith("--scene-")) node.style.removeProperty(name);
        });
      });

      frames.forEach((node, index) => {
        node.classList.toggle("is-active", index === 0);
        node.style.removeProperty("--descent-depth");
      });
      captions.forEach((node, index) => {
        node.classList.toggle("is-active", index === 0);
        node.setAttribute("aria-hidden", index === 0 ? "false" : "true");
      });
      chapters.forEach((node) => {
        node.style.removeProperty("--story-dim");
        node.style.removeProperty("--story-art-scale");
        node.style.removeProperty("--story-art-y");
        node.style.removeProperty("--story-copy-opacity");
        node.style.removeProperty("--story-copy-y");
        node.style.removeProperty("--story-scene-opacity");
      });
    };
  }, []);

  return root;
}
