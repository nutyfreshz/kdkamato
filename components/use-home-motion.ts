"use client";

import { useEffect, useRef } from "react";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => n * n * (3 - 2 * n);

/** The homepage owns exactly one scroll subscription. All measurements happen
 * before writes and are cached until content, fonts or viewport change. */
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
    const hero = home.querySelector<HTMLElement>(".hero");
    const descent = home.querySelector<HTMLElement>(".descent");
    const frames = Array.from(home.querySelectorAll<HTMLElement>(".descent-frame"));
    const captions = Array.from(home.querySelectorAll<HTMLElement>(".descent-copy"));
    const story = home.querySelector<HTMLElement>("[data-home-story]");
    const chapters = Array.from(home.querySelectorAll<HTMLElement>("[data-story-chapter]"));
    let bounds: { node: HTMLElement; top: number; height: number }[] = [];
    let descentTop = 0, descentHeight = 1, storyTop = 0, viewport = 1;
    let dirty = true, frame = 0, disposed = false;

    const measure = () => {
      const y = window.scrollY;
      viewport = window.innerHeight;
      bounds = targets.map(node => ({ node, top: node.getBoundingClientRect().top + y - parseFloat(node.style.getPropertyValue("--home-lift") || "0"), height: node.offsetHeight }));
      if (descent) {
        descentTop = descent.getBoundingClientRect().top + y;
        descentHeight = descent.offsetHeight;
      }
      if (story) storyTop = story.getBoundingClientRect().top + y;
      dirty = false;
    };
    const update = () => {
      frame = 0;
      if (disposed) return;
      if (dirty) measure();
      const y = window.scrollY;
      const reduce = reduced.matches;
      home.dataset.homeMotion = reduce ? "reduced" : "active";
      const distance = compact.matches ? 22 : 52;
      bounds.forEach(({ node, top }) => {
        const p = reduce ? 1 : ease(clamp((y + viewport - top) / (viewport * .56)));
        node.style.setProperty("--home-lift", `${((1 - p) * distance).toFixed(2)}px`);
        node.style.setProperty("--home-open", p.toFixed(4));
      });
      const heroP = reduce ? 0 : clamp(y / viewport);
      hero?.style.setProperty("--hero-pan", `${(heroP * viewport * .16).toFixed(2)}px`);
      hero?.style.setProperty("--hero-copy-y", `${(-heroP * 75).toFixed(2)}px`);

      if (descent) {
        const p = clamp((y - descentTop) / Math.max(1, descentHeight - viewport));
        descent.style.setProperty("--descent-progress", reduce ? "0" : p.toFixed(4));
        const position = p * (frames.length - 1);
        frames.forEach((node, index) => {
          // Successive opaque planes wipe upward. No dissolve between bodies.
          const entry = reduce ? (index <= Math.floor(position + .3) ? 1 : 0) : index === 0 ? 1 : ease(clamp((position - index + .7) / .7));
          node.style.setProperty("--descent-reveal", `${((1 - entry) * 100).toFixed(3)}%`);
          node.style.setProperty("--descent-camera", `${((1 - entry) * 28).toFixed(2)}px`);
          const active = index === Math.min(frames.length - 1, Math.floor(position + .3));
          captions[index]?.setAttribute("aria-hidden", active ? "false" : "true");
          captions[index]?.classList.toggle("is-active", active);
        });
      }
      const t = (y - storyTop) / viewport;
      chapters.forEach((node, index) => {
        const p = reduce || compact.matches ? 0 : ease(clamp(t - index * 1.45));
        node.style.setProperty("--story-scale", (1 + p * .035).toFixed(4));
        node.style.setProperty("--story-copy-y", `${(-p * 36).toFixed(2)}px`);
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const invalidate = () => { dirty = true; schedule(); };
    const observer = new ResizeObserver(invalidate);
    observer.observe(home);
    targets.forEach(node => observer.observe(node));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", invalidate);
    window.addEventListener("hashchange", schedule);
    window.addEventListener("pageshow", invalidate);
    reduced.addEventListener("change", invalidate);
    compact.addEventListener("change", invalidate);
    home.addEventListener("load", invalidate, true);
    document.fonts.ready.then(() => { if (!disposed) invalidate(); });
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
    };
  }, []);
  return root;
}
