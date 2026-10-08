/* =========================================================
   Lenis creative extras, part 2 (load after lenis-init.js)
   1) Cards tilt slightly (alternating left/right) with scroll speed, then settle
   2) Photos zoom gently and settle as they reach the middle of the screen
   3) Intro paragraphs light up word by word while you scroll
   4) Hero headings drift upward a little as you scroll away
   Opt-in attributes:  data-lenis-zoom   (zoom an image)   data-lenis-scrub  (word-by-word text)
   Everything uses the separate `rotate` / `scale` / `translate` properties, so existing animations are untouched.
   ========================================================= */
(() => {
  "use strict";
  const lenis = window.lenis;
  if (!lenis) return;

  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const vh = () => window.innerHeight;

  /* ---------- 1) velocity tilt on cards ---------- */
  const CARDS = ".ct-card, .svc-tile, .svc-arch, .svc-trio article, .svc-jr__in, .post";
  const cards = $$(CARDS);
  const seen = new Set();
  if (cards.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : (seen.delete(e.target), e.target.style.rotate = ""))));
    cards.forEach((c) => io.observe(c));
  }
  let tilt = 0, tiltTarget = 0, tiltRun = false;
  const tiltLoop = () => {
    tilt += (tiltTarget - tilt) * 0.12;
    tiltTarget *= 0.88;
    cards.forEach((c) => {
      if (!seen.has(c)) return;
      const i = cards.indexOf(c);
      c.style.rotate = (tilt * (i % 2 ? 1 : -1)).toFixed(3) + "deg";
    });
    if (Math.abs(tilt) > 0.005 || Math.abs(tiltTarget) > 0.005) requestAnimationFrame(tiltLoop);
    else { tiltRun = false; cards.forEach((c) => (c.style.rotate = "")); }
  };

  /* ---------- 2) zoom-and-settle photos ---------- */
  const zoomImgs = $$(".svc-aging__fig img, .svc-jr__ph img, .svc-res2__imgs img, [data-lenis-zoom]");
  const zoomTick = () => {
    const h = vh();
    zoomImgs.forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.bottom < -100 || r.top > h + 100) return;
      const d = clamp(Math.abs(r.top + r.height / 2 - h / 2) / h, 0, 1);
      img.style.scale = (1 + 0.12 * d).toFixed(4);
    });
  };

  /* ---------- 3) word-by-word text reveal ---------- */
  const scrubs = $$(".svc-lead, .ct-faq__intro, [data-lenis-scrub]").filter((p) => p.children.length === 0 && p.textContent.trim());
  const scrubData = scrubs.map((p) => {
    const words = p.textContent.trim().split(/\s+/);
    p.setAttribute("aria-label", p.textContent.trim());
    p.innerHTML = words.map((w) => '<span aria-hidden="true" style="opacity:.2;transition:opacity .25s">' + w.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])) + "</span>").join(" ");
    return { p, spans: Array.from(p.children) };
  });
  const scrubTick = () => {
    const h = vh();
    scrubData.forEach(({ p, spans }) => {
      const r = p.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h) return;
      const prog = clamp((h * 0.9 - r.top) / (h * 0.45), 0, 1) * spans.length;
      spans.forEach((s, i) => (s.style.opacity = (0.2 + 0.8 * clamp(prog - i, 0, 1)).toFixed(2)));
    });
  };

  /* ---------- 4) hero heading drift ---------- */
  const heroes = $$(".hero__title, .svc-hero__t, .ct-hero__title, .ah__title, .ap__title");

  lenis.on("scroll", ({ velocity, scroll }) => {
    tiltTarget = clamp(velocity * 0.12, -1.6, 1.6);
    if (!tiltRun && cards.length) { tiltRun = true; requestAnimationFrame(tiltLoop); }
    zoomTick();
    scrubTick();
    if (scroll < vh() * 1.3) heroes.forEach((el) => (el.style.translate = "0 " + (scroll * 0.18).toFixed(1) + "px"));
  });
  zoomTick();
  scrubTick();
  window.addEventListener("load", () => { zoomTick(); scrubTick(); });
})();