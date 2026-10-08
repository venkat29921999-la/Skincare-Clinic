/* =========================================================
   Lenis smooth scroll (shared by every page that scrolls)
   Load order on each page: Lenis library -> (gsap, ScrollTrigger, script.js) -> this file
   ========================================================= */
(() => {
  "use strict";
  if (typeof window.Lenis === "undefined") return;                       // library blocked/offline: page scrolls normally
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // respect reduced-motion

  const hasGSAP = typeof window.gsap !== "undefined";
  const hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
    autoRaf: !hasGSAP,                       // when GSAP is on the page, it drives Lenis (below)
    /* inner scrollers keep their own normal scrolling */
    prevent: (node) => !!(node.closest && node.closest(
      "[data-lenis-prevent], #side, .nav, .mail__l, .mail__r, .au-card, .modal__card, textarea, select"
    ))
  });
  window.lenis = lenis;

  /* keep GSAP ScrollTrigger in step with Lenis */
  if (hasGSAP) {
    if (hasST) lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* pause smooth scrolling while a menu / popup / lightbox locks the page (body.is-locked) */
  const syncLock = () => (document.body.classList.contains("is-locked") ? lenis.stop() : lenis.start());
  new MutationObserver(syncLock).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  syncLock();

  /* the site's own smooth jumps (e.g. search results) now glide with Lenis too */
  const nativeIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (opts) {
    if (opts && typeof opts === "object" && opts.behavior === "smooth") {
      const off = parseFloat(getComputedStyle(this).scrollMarginTop) || 0;
      lenis.scrollTo(this, { offset: -off });
      return;
    }
    return nativeIntoView.call(this, opts);
  };

  /* recalculate sizes after images/fonts finish loading */
  window.addEventListener("load", () => { lenis.resize(); if (hasST) ScrollTrigger.refresh(); });
})();