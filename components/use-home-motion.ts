"use client";

import { useEffect, useRef } from "react";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => n * n * (3 - 2 * n);

type MotionBound = { node: HTMLElement; top: number; height: number };

/** Homepage cinematic motion controller.
 * One passive scroll listener + rAF batching. Historical cinematic handoffs are
 * restored without changing content, routing, data, or section markup. */
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

      const heroP = reduce ? 0 : ease(clamp(y / (viewport * 0.9)));
      hero?.style.setProperty("--hero-pan", `${(heroP * viewport * 0.12).toFixed(2)}px`);
      hero?.style.setProperty("--hero-copy-y", `${(-heroP * 34).toFixed(2)}px`);
      hero?.style.setProperty("--hero-copy-opacity", (1 - heroP * 0.72).toFixed(4));
      hero?.style.setProperty("--hero-handoff", (0.26 + heroP * 0.74).toFixed(4));

      sceneBounds.forEach(({ node, top, height }) => {
        const enter = reduce ? 1 : ease(clamp((y + viewport - top) / (viewport * 0.55)));
        const exit = reduce ? 0 : ease(clamp((y + viewport - (top + height)) / (viewport * 0.55)));
        const center = clamp((y + viewport - top) / Math.max(1, viewport + height));
        const sheen = reduce ? 0.25 : Math.sin(Math.PI * center);
        node.style.setProperty("--scene-top-opacity", (1 - enter).toFixed(4));
        node.style.setProperty("--scene-bottom-opacity", exit.toFixed(4));
        node.style.setProperty("--scene-ambient-y", `${((0.5 - center) * (isCompact ? 10 : 26)).toFixed(2)}px`);
        node.style.setProperty("--scene-sheen-opacity", (sheen * 0.58).toFixed(4));
      });

      if (descent) {
        const p = clamp((y - descentTop) / Math.max(1, descentHeight - viewport));
        const entry = reduce ? 1 : ease(clamp((y + viewport - descentTop) / (viewport * 0.72)));
        descent.style.setProperty("--descent-progress", p.toFixed(4));
        descent.style.setProperty("--descent-entry", entry.toFixed(4));
        descent.style.setProperty("--descent-motion-y", `${((0.5 - p) * (isCompact ? 8 : 18)).toFixed(2)}px`);

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

      hero?.style.removeProperty("--hero-pan");
      hero?.style.removeProperty("--hero-copy-y");
      hero?.style.removeProperty("--hero-copy-opacity");
      hero?.style.removeProperty("--hero-handoff");
      descent?.style.removeProperty("--descent-progress");
      descent?.style.removeProperty("--descent-entry");
      descent?.style.removeProperty("--descent-motion-y");
      sceneNodes.forEach((node) => {
        node.style.removeProperty("--scene-top-opacity");
        node.style.removeProperty("--scene-bottom-opacity");
        node.style.removeProperty("--scene-ambient-y");
        node.style.removeProperty("--scene-sheen-opacity");
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
      story?.style.removeProperty("--story-entry");
      story?.style.removeProperty("--story-entry-y");
    };
  }, []);

  return root;
}
