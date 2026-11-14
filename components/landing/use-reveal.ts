"use client";

import { useEffect, type RefObject } from "react";

/**
 * Fades sections in as they scroll into view. Content stays fully visible until this runs
 * (server HTML, no-JS, reduced motion), so nothing is ever hidden by default.
 * A MutationObserver picks up elements React adds or replaces later (for example when the
 * language changes), so nothing can get stuck hidden.
 */
export function useReveal(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return undefined;

    const intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          intersection.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const track = (item: HTMLElement) => {
      if (item.classList.contains("is-in")) return;
      // Only hide what is currently below the fold, so the first screen never flashes.
      if (item.getBoundingClientRect().top > window.innerHeight * 0.92) intersection.observe(item);
      else item.classList.add("is-in");
    };
    const scan = (node: ParentNode) => node.querySelectorAll<HTMLElement>(".reveal").forEach(track);

    scan(root);
    root.dataset.reveal = "on";

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.classList.contains("reveal")) track(node);
          scan(node);
        });
      }
    });
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      intersection.disconnect();
      mutations.disconnect();
    };
  }, [rootRef]);
}
