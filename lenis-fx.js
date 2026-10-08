/* =========================================================
   Lenis creative extras (needs lenis-init.js to be loaded first)
   1) Marquees & ticker bands speed up while you scroll, and run backwards when you scroll up
   2) Rotating seals / badges spin faster while you scroll
   3) Optional parallax: add data-lenis-speed="0.15" to any element (try a figure or image wrapper)
   ========================================================= */
(() => {
  "use strict";
  const lenis = window.lenis;
  if (!lenis) return;                                   // Lenis off (reduced motion / offline): do nothing

  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const MARQUEES = ".ticker__track, .gband__track, .svc-mq__row, .ct-mq__track, .ct-film__track";
  const SEALS = ".gseal, .rp__seal, .ac__badge svg, .ah__seal svg, .ct-stamp svg, .svc-rs__badge, .svc-ring";

  const anims = (sel, reversible) => $$(sel).flatMap((el) =>
    el.getAnimations().filter((a) => a.animationName !== undefined).map((a) => ({ a, reversible })));
  let list = [];
  const collect = () => { list = anims(MARQUEES, true).concat(anims(SEALS, false)); };
  collect();
  window.addEventListener("load", collect);

  /* 1 + 2: speed follows scroll velocity, then eases back to normal */
  let boost = 0, target = 0, running = false;
  const apply = () => {
    boost += (target - boost) * 0.08;
    target *= 0.9;
    const speed = Math.min(Math.abs(boost), 6);
    const dir = boost < 0 ? -1 : 1;
    list.forEach(({ a, reversible }) => {
      try { a.playbackRate = reversible ? dir * (1 + speed) : 1 + speed * 0.8; } catch (e) {}
    });
    if (Math.abs(boost) > 0.01 || Math.abs(target) > 0.01) requestAnimationFrame(apply);
    else { running = false; list.forEach(({ a }) => { try { a.playbackRate = 1; } catch (e) {} }); }
  };
  lenis.on("scroll", ({ velocity }) => {
    target = Math.max(-6, Math.min(6, velocity * 0.45));
    if (!running) { running = true; requestAnimationFrame(apply); }
  });

  /* 3: opt-in parallax (uses the separate `translate` property, so it never fights existing transforms) */
  const par = $$("[data-lenis-speed]");
  if (par.length) {
    const tick = () => {
      const vh = innerHeight;
      par.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const k = parseFloat(el.dataset.lenisSpeed) || 0.1;
        el.style.translate = "0 " + (((r.top + r.height / 2) - vh / 2) * -k).toFixed(1) + "px";
      });
    };
    lenis.on("scroll", tick); tick();
  }
})();