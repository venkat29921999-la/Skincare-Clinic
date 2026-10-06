/* =========================================================
   STACKLY SKINCARE CLINIC — script.js
   GSAP + ScrollTrigger + AOS, with graceful fallbacks
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const hasGSAP = typeof window.gsap !== "undefined";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animate = hasGSAP && !reduce;

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const hasST = hasGSAP && !!window.ScrollTrigger;

  /* ---------- Small helpers ---------- */
  function splitWords(el) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = "1";
    const label = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", label);
    el.innerHTML = el.innerHTML
      .split(/<br\s*\/?>/i)
      .map((part) => part.trim().split(/\s+/).map((w) => `<span class="word" aria-hidden="true"><span>${w}</span></span>`).join(" "))
      .join("<br>");
    return $$(".word > span", el);
  }

  function onceInView(el, cb, margin = "0px 0px -12% 0px") {
    if (!("IntersectionObserver" in window)) return cb();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { io.disconnect(); cb(); }
      });
    }, { rootMargin: margin });
    io.observe(el);
  }

  /* ---------- Year ---------- */
  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- AOS ---------- */
  // Titles that get their own word-by-word reveal should not also use AOS
  $$(".split, #footHead, .ritual__head .title").forEach((el) => el.removeAttribute("data-aos"));
  if (typeof window.AOS !== "undefined" && !reduce) {
    AOS.init({ duration: 900, easing: "ease-out-cubic", once: true, offset: 70 });
    document.documentElement.classList.add("aos-ready");
  }

  /* =========================================================
     HEADER, MENU, SCROLL PROGRESS
     ========================================================= */
  const header = $("#header");
  const burger = $("#burger");
  const nav = $("#nav");
  const progress = $("#progress");
  let lastY = window.scrollY;
  let ticking = false;

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-locked", open);
    header.classList.toggle("menu-open", open);
    if (open) header.classList.remove("is-hidden");
  }
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$(".nav__link", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); closeLogin(); } });
  window.addEventListener("resize", () => { if (window.innerWidth > 980) setMenu(false); });

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-stuck", y > 20);
    /* Header stays fixed at the top at all times (it no longer hides while scrolling down). */
    header.classList.remove("is-hidden");
    lastY = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? y / max : 0;
    progress.style.transform = `scaleX(${p})`;
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* Active nav link (sections map to the 5 menu items) */
  const navMap = {
    home: "home", about: "about", why: "about", ritual: "about",
    services: "services", results: "services",
    gallery: "blog", reviews: "blog", blog: "blog", contact: "contact",
  };
  const navLinks = $$(".nav__link");
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const target = navMap[e.target.id];
        navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + target));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navMap).forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* =========================================================
     CURSOR + MAGNETIC BUTTONS (desktop only)
     ========================================================= */
  const cursor = $("#cursor");
  if (animate && finePointer && window.innerWidth > 980) {
    const cx = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("pointermove", (e) => { cursor.classList.add("is-on"); cx(e.clientX); cy(e.clientY); });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
    document.addEventListener("pointerover", (e) => {
      cursor.classList.toggle("is-link", !!e.target.closest("a, button, .tx, .ba, .g, input, select, textarea"));
    });

    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.4, ease: "power3.out" });
      });
      btn.addEventListener("pointerleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,.4)" }));
    });
  }

  /* =========================================================
     COUNTERS
     ========================================================= */
  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    if (!animate) { el.textContent = target; return; }
    const o = { v: 0 };
    gsap.to(o, { v: target, duration: 2.2, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v); } });
  }
  $$("[data-count]").forEach((el) => onceInView(el, () => runCounter(el), "0px 0px -8% 0px"));

  /* =========================================================
     PRELOADER + HERO INTRO
     ========================================================= */
  const preloader = $("#preloader");
  let introDone = false;

  function heroIntro() {
    if (introDone) return;
    introDone = true;
    if (!animate) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(".hero__title .w", { y: 0, opacity: 1, rotate: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.09 }, 0)
      .to("[data-hero='fade']", { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.25)
      .to(".hero__arch", { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.out" }, 0.1)
      .to(".hero__arch img", { scale: 1.04, duration: 2, ease: "expo.out" }, 0.1)
      .to(".hero__small", { scale: 1, opacity: 1, duration: 1, ease: "back.out(1.6)" }, 0.7)
      .to(".hero__ring", { scale: 1, rotate: 0, opacity: 1, duration: 1.1, ease: "back.out(1.5)" }, 0.8)
      .to(".chip", { scale: 1, opacity: 1, y: 0, duration: 0.9, stagger: 0.18, ease: "back.out(1.6)" }, 1)
      .to(".stats li", { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 1.1)
      .to(".scroll-hint", { opacity: 1, duration: 0.6 }, 1.6);
  }

  if (animate) {
    gsap.set(".hero__title .w", { y: 70, opacity: 0, rotate: 5, filter: "blur(8px)" });
    gsap.set("[data-hero='fade']", { y: 30, opacity: 0 });
    gsap.set(".hero__arch", { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(".hero__arch img", { scale: 1.35 });
    gsap.set(".hero__small", { scale: 0, opacity: 0 });
    gsap.set(".hero__ring", { scale: 0, rotate: -90, opacity: 0 });
    gsap.set(".chip", { scale: 0.6, opacity: 0, y: 20 });
    gsap.set(".stats li", { y: 40, opacity: 0 });
    gsap.set(".scroll-hint", { opacity: 0 });
  }

  function hidePreloader() {
    if (!preloader) return heroIntro();
    if (!animate) { preloader.style.display = "none"; return; }
    gsap.timeline()
      .to(".preloader__bar span", { scaleX: 1, duration: 0.9, ease: "power2.inOut" })
      .to(preloader, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "+=0.1")
      .add(heroIntro, "-=0.45")
      .set(preloader, { display: "none" });
  }
  let loaded = false;
  const finish = () => { if (loaded) return; loaded = true; hidePreloader(); if (hasST) ScrollTrigger.refresh(); if (window.AOS) AOS.refresh(); };
  window.addEventListener("load", finish);
  setTimeout(finish, 3500); // safety net if an image is slow

  /* =========================================================
     HERO — mouse parallax + scroll drift
     ========================================================= */
  const heroVisual = $("#heroVisual");
  if (animate && finePointer && heroVisual) {
    const layers = $$("[data-depth]", heroVisual);
    const arch = $(".hero__arch", heroVisual);
    heroVisual.addEventListener("pointermove", (e) => {
      const r = heroVisual.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l) => gsap.to(l, { x: nx * l.dataset.depth * 2, y: ny * l.dataset.depth * 2, duration: 0.9, ease: "power3.out", overwrite: "auto" }));
      gsap.to(arch, { rotationY: nx * 8, rotationX: -ny * 6, transformPerspective: 900, duration: 0.9, ease: "power3.out" });
    });
    heroVisual.addEventListener("pointerleave", () => {
      layers.forEach((l) => gsap.to(l, { x: 0, y: 0, duration: 1.2, ease: "elastic.out(1,.5)", overwrite: "auto" }));
      gsap.to(arch, { rotationY: 0, rotationX: 0, duration: 1.2, ease: "elastic.out(1,.5)" });
    });
  }
  if (animate && hasST) {
    gsap.to(".hero__copy", { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".blob--1", { yPercent: 40, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  /* =========================================================
     SCROLL-DRIVEN ANIMATIONS (GSAP + ScrollTrigger)
     ========================================================= */
  if (animate && hasST) {
    /* Split-word titles */
    $$(".split, #footHead, .ritual__head .title").forEach((el) => {
      el.classList.add("no-shine"); /* shimmer + transformed word spans = invisible text */
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 115, rotate: 4, duration: 1.1, stagger: 0.07, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    /* About: parallax layers + arch reveal + dashed frame */
    $$("[data-speed]").forEach((el) => {
      gsap.to(el, {
        yPercent: parseFloat(el.dataset.speed) * 100, ease: "none",
        scrollTrigger: { trigger: ".about__visual", start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    });
    gsap.from(".about__arch", { clipPath: "inset(100% 0 0 0)", duration: 1.5, ease: "expo.out", scrollTrigger: { trigger: ".about__visual", start: "top 80%", once: true } });
    gsap.from(".about__arch img", { scale: 1.5, duration: 2, ease: "expo.out", scrollTrigger: { trigger: ".about__visual", start: "top 80%", once: true } });
    gsap.from(".about__circle", { scale: 0, duration: 1.1, delay: 0.4, ease: "back.out(1.6)", scrollTrigger: { trigger: ".about__visual", start: "top 75%", once: true } });
    gsap.from(".about__dash", { scale: 0, transformOrigin: "100% 100%", duration: 1.3, delay: 0.3, ease: "expo.out", scrollTrigger: { trigger: ".about__visual", start: "top 75%", once: true } });

    /* Services entrance */
    gsap.from(".tx", {
      y: 90, opacity: 0, duration: 1, stagger: 0.09, ease: "power3.out", clearProps: "transform,opacity",
      scrollTrigger: { trigger: ".tx-list", start: "top 85%", once: true },
    });

    /* Results: glow drift + stats entrance */
    gsap.to(".results__glow", { yPercent: 25, xPercent: -10, ease: "none", scrollTrigger: { trigger: ".results", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".ba", { clipPath: "inset(0 0 100% 0)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".ba", start: "top 85%", once: true } });

    /* Why: image zoom-in via scrub on the dotted items */
    gsap.from(".why__float", { x: -40, opacity: 0, duration: 1, delay: 0.5, ease: "power3.out", scrollTrigger: { trigger: ".why__frame", start: "top 80%", once: true } });

    /* Ritual steps */
    gsap.from(".step", {
      y: 80, opacity: 0, duration: 1, stagger: 0.14, ease: "power3.out",
      scrollTrigger: { trigger: ".steps", start: "top 85%", once: true },
    });
    gsap.from(".step__img", {
      clipPath: "inset(100% 0 0 0)", duration: 1.4, stagger: 0.14, ease: "expo.out",
      scrollTrigger: { trigger: ".steps", start: "top 85%", once: true },
    });
    gsap.from(".step__icon", {
      scale: 0, duration: 0.8, stagger: 0.14, delay: 0.7, ease: "back.out(2)",
      scrollTrigger: { trigger: ".steps", start: "top 85%", once: true },
    });

    /* Ritual spotlight follows the pointer */
    const ritual = $("#ritual"); const glow = $("#ritualGlow");
    if (ritual && glow && finePointer) {
      const gx = gsap.quickTo(glow, "x", { duration: 1.2, ease: "power3" });
      const gy = gsap.quickTo(glow, "y", { duration: 1.2, ease: "power3" });
      ritual.addEventListener("pointermove", (e) => {
        const r = ritual.getBoundingClientRect(); gx(e.clientX - r.left); gy(e.clientY - r.top);
      });
    }

    /* Gallery */
    gsap.from(".marquee", { opacity: 0, y: 60, duration: 1.1, stagger: 0.18, ease: "power3.out", scrollTrigger: { trigger: ".gallery .marquee", start: "top 90%", once: true } });

    /* Reviews stage */
    gsap.from(".reviews__stage", { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".reviews__stage", start: "top 85%", once: true } });

    /* Footer CTA */
    gsap.from(".footer__cta .btn", { y: 30, opacity: 0, duration: 0.9, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".footer__cta", start: "top 80%", once: true } });
    gsap.from(".footer__grid > *", { y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".footer__grid", start: "top 92%", once: true } });
  }

  /* =========================================================
     TREATMENTS ACCORDION
     ========================================================= */
  const txList = $("#txList");
  const txItems = $$(".tx", txList);
  let txIndex = 0;
  let txTimer = null;
  let txUser = false;

  function setTx(i) {
    txIndex = i;
    txItems.forEach((el, k) => {
      const on = k === i;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-expanded", String(on));
    });
  }
  txItems.forEach((el, i) => {
    el.addEventListener("click", () => { txUser = true; stopTx(); setTx(i); });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); txUser = true; stopTx(); setTx(i); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); const n = (i + 1) % txItems.length; txItems[n].focus(); setTx(n); txUser = true; stopTx(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); const n = (i - 1 + txItems.length) % txItems.length; txItems[n].focus(); setTx(n); txUser = true; stopTx(); }
    });
    if (finePointer) el.addEventListener("mouseenter", () => { if (window.innerWidth > 820) { txUser = true; stopTx(); setTx(i); } });
  });
  function startTx() { if (txTimer || txUser || reduce) return; txTimer = setInterval(() => setTx((txIndex + 1) % txItems.length), 4200); }
  function stopTx() { clearInterval(txTimer); txTimer = null; }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((en) => en.forEach((e) => (e.isIntersecting ? startTx() : stopTx())), { threshold: 0.4 }).observe(txList);
  }

  /* =========================================================
     BEFORE / AFTER SLIDER
     ========================================================= */
  const ba = $("#ba"); const handle = $("#baHandle");
  let baUser = false;
  function setPos(p) {
    p = clamp(p, 0, 100);
    ba.style.setProperty("--pos", p + "%");
    handle.setAttribute("aria-valuenow", Math.round(p));
  }
  function posFromEvent(e) {
    const r = ba.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  }
  let dragging = false;
  ba.addEventListener("pointerdown", (e) => {
    dragging = true; baUser = true; ba.setPointerCapture(e.pointerId); setPos(posFromEvent(e)); hasGSAP && gsap.killTweensOf(baState);
  });
  ba.addEventListener("pointermove", (e) => { if (dragging) setPos(posFromEvent(e)); });
  ["pointerup", "pointercancel"].forEach((ev) => ba.addEventListener(ev, () => { dragging = false; }));
  handle.addEventListener("keydown", (e) => {
    const cur = parseFloat(handle.getAttribute("aria-valuenow"));
    if (e.key === "ArrowLeft") { baUser = true; setPos(cur - 5); e.preventDefault(); }
    if (e.key === "ArrowRight") { baUser = true; setPos(cur + 5); e.preventDefault(); }
    if (e.key === "Home") { baUser = true; setPos(0); e.preventDefault(); }
    if (e.key === "End") { baUser = true; setPos(100); e.preventDefault(); }
  });
  const baState = { p: 50 };
  onceInView(ba, () => {
    ba.classList.add("is-hint");
    if (!animate) return;
    baState.p = 50;
    gsap.timeline({ delay: 0.8 })
      .to(baState, { p: 82, duration: 1.1, ease: "power2.inOut", onUpdate: () => !baUser && setPos(baState.p) })
      .to(baState, { p: 18, duration: 1.6, ease: "power2.inOut", onUpdate: () => !baUser && setPos(baState.p) })
      .to(baState, { p: 50, duration: 1.1, ease: "power2.inOut", onUpdate: () => !baUser && setPos(baState.p) });
  }, "0px 0px -20% 0px");

  /* =========================================================
     MARQUEE GALLERY (infinite, scroll-velocity aware)
     ========================================================= */
  const marquees = [];
  function buildMarquees() {
    marquees.forEach((m) => m.tween && m.tween.kill());
    marquees.length = 0;
    $$(".marquee").forEach((m) => {
      const track = $(".marquee__track", m);
      if (!track.dataset.cloned) {
        const set = Array.from(track.children);
        // repeat enough times to always fill very wide screens
        for (let r = 0; r < 2; r++) set.forEach((n) => { const c = n.cloneNode(true); c.setAttribute("aria-hidden", "true"); const im = c.querySelector("img"); if (im) im.alt = ""; track.appendChild(c); });
        track.dataset.cloned = "1";
      }
      const gap = parseFloat(getComputedStyle(track).columnGap) || 18;
      track.style.paddingRight = gap + "px";
      const total = track.scrollWidth;
      const one = total / 3; // original set + 2 clones
      const dir = parseInt(m.dataset.dir, 10) || 1;
      if (!animate) return;
      const from = dir === 1 ? 0 : -one; const to = dir === 1 ? -one : 0;
      const tween = gsap.fromTo(track, { x: from }, { x: to, duration: one / 55, ease: "none", repeat: -1 });
      m.onmouseenter = () => gsap.to(tween, { timeScale: 0.15, duration: 0.6 });
      m.onmouseleave = () => gsap.to(tween, { timeScale: 1, duration: 0.8 });
      marquees.push({ tween });
    });
  }
  buildMarquees();
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { buildMarquees(); }, 250); });
  if (animate && hasST) {
    ScrollTrigger.create({
      trigger: ".gallery", start: "top bottom", end: "bottom top",
      onUpdate: (self) => {
        const v = Math.min(Math.abs(self.getVelocity()) / 350, 6);
        marquees.forEach((m) => gsap.to(m.tween, { timeScale: 1 + v, duration: 0.25, overwrite: true, onComplete: () => gsap.to(m.tween, { timeScale: 1, duration: 1.2 }) }));
      },
    });
  }

  /* =========================================================
     TESTIMONIAL SLIDER
     ========================================================= */
  const revs = $$(".rev"); const revNow = $("#revNow"); const stage = $("#revStage");
  let revIndex = 0; let revTimer = null; let revBusy = false;

  function showRev(n, dir = 1) {
    n = (n + revs.length) % revs.length;
    if (n === revIndex || revBusy) return;
    const cur = revs[revIndex]; const next = revs[n];
    const swap = () => {
      cur.classList.remove("is-active"); next.classList.add("is-active");
      revIndex = n; revNow.textContent = String(n + 1).padStart(2, "0");
    };
    if (!animate) { swap(); return; }
    revBusy = true;
    gsap.timeline({ onComplete: () => { revBusy = false; } })
      .to(cur, { opacity: 0, x: -40 * dir, duration: 0.35, ease: "power2.in" })
      .add(swap)
      .fromTo(next, { opacity: 0, x: 50 * dir }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" })
      .from($$("footer > *", next), { y: 16, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" }, "-=0.45");
  }
  function startRev() { stopRev(); if (!reduce) revTimer = setInterval(() => showRev(revIndex + 1, 1), 6500); }
  function stopRev() { clearInterval(revTimer); }
  $("#nextRev").addEventListener("click", () => { showRev(revIndex + 1, 1); startRev(); });
  $("#prevRev").addEventListener("click", () => { showRev(revIndex - 1, -1); startRev(); });
  stage.addEventListener("mouseenter", stopRev); stage.addEventListener("mouseleave", startRev);
  let sx = 0;
  stage.addEventListener("pointerdown", (e) => { sx = e.clientX; });
  stage.addEventListener("pointerup", (e) => {
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 50) { showRev(revIndex + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); startRev(); }
  });
  startRev();
  document.addEventListener("visibilitychange", () => (document.hidden ? stopRev() : startRev()));

  /* =========================================================
     BLOG — image tilt (desktop)
     ========================================================= */
  if (animate && finePointer) {
    $$(".post__img").forEach((box) => {
      box.addEventListener("pointermove", (e) => {
        const r = box.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5; const ny = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(box, { rotationY: nx * 7, rotationX: -ny * 7, transformPerspective: 900, duration: 0.6, ease: "power2.out" });
      });
      box.addEventListener("pointerleave", () => gsap.to(box, { rotationX: 0, rotationY: 0, duration: 0.9, ease: "elastic.out(1,.5)" }));
    });
  }

  /* =========================================================
     BOOKING FORM
     ========================================================= */
  const form = $("#bookForm"); const status = $("#formStatus");
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#fName"); const email = $("#fEmail"); const treat = $("#fTreat");
    const checks = [[name, name.value.trim().length > 1], [email, emailOk(email.value.trim())], [treat, !!treat.value]];
    let ok = true;
    checks.forEach(([el, valid]) => { el.closest(".field").classList.toggle("is-error", !valid); if (!valid) ok = false; });
    status.className = "form__status";
    if (!ok) {
      status.textContent = "Please fill in your name, a valid email and a treatment.";
      status.classList.add("is-err");
      if (animate) gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1,.3)" });
      return;
    }
    const btn = $(".form__submit", form); const label = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
    setTimeout(() => {
      btn.disabled = false; btn.innerHTML = label; form.reset();
      status.textContent = "Thank you! Your request is in. We'll confirm your appointment shortly.";
      status.classList.add("is-ok");
    }, 1000);
  });
  $$(".field input, .field select, .field textarea").forEach((el) => el.addEventListener("input", () => el.closest(".field").classList.remove("is-error")));

  /* =========================================================
     LOGIN MODAL
     ========================================================= */
  const modal = $("#loginModal"); let lastFocus = null;
  function openLogin() {
    lastFocus = document.activeElement; setMenu(false);
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false"); document.body.classList.add("is-locked");
    setTimeout(() => $("#lEmail").focus(), 250);
  }
  function closeLogin() {
    if (!modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("is-locked");
    if (lastFocus) lastFocus.focus();
  }
  $$("[data-open-login]").forEach((b) => b.addEventListener("click", openLogin));
  $$("[data-close-login]").forEach((b) => b.addEventListener("click", closeLogin));
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const st = $("#loginStatus"); const em = $("#lEmail").value.trim(); const pw = $("#lPass").value;
    st.className = "form__status";
    if (!emailOk(em) || pw.length < 6) { st.textContent = "Enter a valid email and a password of 6+ characters."; st.classList.add("is-err"); return; }
    st.textContent = "Welcome back! (Demo login - connect your backend here.)"; st.classList.add("is-ok");
    setTimeout(closeLogin, 1400);
  });

  /* ---------- Refresh triggers after layout-affecting loads ---------- */
  window.addEventListener("load", () => setTimeout(() => { if (hasST) ScrollTrigger.refresh(); }, 400));
})();


/* creative.js - extra interactions layered on top of script.js (nothing in script.js is changed) */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* 1. Cursor-follow spotlight on cards */
  $$(".tx, .post, .why__item, .stats li, .form, .reviews__stage").forEach((el) => {
    el.insertAdjacentHTML("beforeend", '<i class="spot" aria-hidden="true"></i>');
    if (!fine) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* 2. Hero glow follows the pointer */
  const hero = $(".hero");
  if (hero && fine) hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--hx", e.clientX - r.left + "px");
    hero.style.setProperty("--hy", e.clientY - r.top + "px");
  });

  /* 3. Treatment ticker after the hero */
  const names = $$(".tx h3").map((h) => h.textContent.trim());
  if (hero && names.length) {
    const row = names.map((n) => `<span>${n}</span><i class="fa-solid fa-spa"></i>`).join("");
    hero.insertAdjacentHTML("afterend", `<div class="ticker" aria-hidden="true"><div class="ticker__track">${row}${row}${row}${row}</div></div>`);
  }

  /* 4. Heading shimmer once when each heading appears */
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((en) => en.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-shine"); io.unobserve(e.target); }
    }), { threshold: 0.6 });
    $$(".title--xl:not(.split), .title--lg").forEach((h) => io.observe(h));
  }

  /* 5. Ritual connector fills with scroll */
  const steps = $("#steps");
  if (steps) {
    const upd = () => {
      const r = steps.getBoundingClientRect(), vh = innerHeight;
      steps.style.setProperty("--fill", Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5))).toFixed(3));
    };
    addEventListener("scroll", upd, { passive: true }); upd();
  }

  /* 6. Testimonial timer bar (restarts on each slide change) */
  const stage = $("#revStage");
  if (stage && !reduce) {
    const bar = document.createElement("i"); bar.className = "rev-bar"; stage.appendChild(bar);
    const restart = () => { bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run"); };
    restart();
    $$(".rev", stage).forEach((r) => new MutationObserver(() => r.classList.contains("is-active") && restart()).observe(r, { attributes: true, attributeFilter: ["class"] }));
  }

  /* 7. Confetti when the booking request is sent */
  const status = $("#formStatus");
  if (status && !reduce) new MutationObserver(() => {
    if (!status.classList.contains("is-ok")) return;
    const r = status.getBoundingClientRect(), cols = ["#efaf93", "#3e9479", "#1a3a30", "#e5ece9"];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement("i"); c.className = "confetti";
      c.style.left = r.left + r.width / 2 + "px"; c.style.top = r.top + "px"; c.style.background = cols[i % 4];
      document.body.appendChild(c);
      const a = Math.random() * Math.PI - Math.PI, d = 90 + Math.random() * 220;
      c.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 160}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
        { duration: 1300 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => c.remove();
    }
  }).observe(status, { attributes: true, attributeFilter: ["class"] });

  /* 8. Footer wordmark */
  const foot = $(".footer");
  if (foot) foot.insertAdjacentHTML("beforeend", '<span class="footer__mark" aria-hidden="true">Stackly</span>');
})();
/* =========================================================
   GALLERY — creative extras (additive, safe if GSAP missing)
   ========================================================= */
(() => {
  "use strict";
  const gal = document.querySelector("#gallery");
  if (!gal) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* 3D tilt on cards (works on cloned marquee cards via delegation) */
  if (fine && !reduce) {
    gal.addEventListener("pointermove", (e) => {
      const g = e.target.closest(".g"); if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 14 + "deg");
      g.style.setProperty("--rx", (0.5 - (e.clientY - r.top) / r.height) * 12 + "deg");
    });
    gal.addEventListener("pointerout", (e) => {
      const g = e.target.closest(".g"); if (!g || g.contains(e.relatedTarget)) return;
      g.style.setProperty("--rx", "0deg"); g.style.setProperty("--ry", "0deg");
    });
  }

  /* count-up stats */
  const nums = gal.querySelectorAll("[data-count]");
  const run = (el) => {
    const end = +el.dataset.count; const t0 = performance.now(); const dur = 1800;
    const tick = (t) => { const p = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(tick); };
    reduce ? (el.textContent = end.toLocaleString()) : requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }), { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
  } else nums.forEach(run);

  /* parallax on glow orbs */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.utils.toArray(".gfx__orb").forEach((o, i) => gsap.to(o, { yPercent: (i % 2 ? -40 : 40), ease: "none", scrollTrigger: { trigger: gal, start: "top bottom", end: "bottom top", scrub: 1 } }));
  }
})();

/* =========================================================
   TESTIMONIALS — creative extras (additive; the original slider is untouched)
   ========================================================= */
(() => {
  "use strict";
  const stage = document.querySelector("#revStage");
  if (!stage) return;
  const revs = Array.from(stage.querySelectorAll(".rev"));
  const thumbs = Array.from(document.querySelectorAll("#revThumbs button"));
  const bar = stage.querySelector(".rprog i");
  const next = document.querySelector("#nextRev");
  const hasGSAP = typeof window.gsap !== "undefined";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const animate = hasGSAP && !reduce;

  /* split quotes into words (kept as plain text for readers) */
  revs.forEach((r) => {
    const p = r.querySelector("p"); if (!p || p.dataset.split) return;
    p.dataset.split = "1";
    const text = p.textContent; p.setAttribute("aria-label", text);
    p.innerHTML = text.split(/(\s+)/).map((w) => (w.trim() ? `<span class="w" aria-hidden="true">${w}</span>` : w)).join("");
  });

  /* progress bar restart */
  const runBar = () => { if (!bar || reduce) return; bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run"); };

  /* when a slide becomes active: word-by-word reveal, stars pop, thumb highlight */
  const onActive = (rev) => {
    const i = revs.indexOf(rev);
    thumbs.forEach((t, k) => t.classList.toggle("is-on", k === i));
    runBar();
    if (!animate) return;
    gsap.fromTo(rev.querySelectorAll("p .w"), { y: 22, opacity: 0, rotate: 4 }, { y: 0, opacity: 1, rotate: 0, duration: 0.6, stagger: 0.035, ease: "power3.out", clearProps: "transform" });
    gsap.from(rev.querySelectorAll(".stars i"), { scale: 0, rotate: -90, duration: 0.5, stagger: 0.09, ease: "back.out(2.4)", delay: 0.35, clearProps: "transform" });
  };
  const mo = new MutationObserver((list) => list.forEach((m) => { if (m.target.classList.contains("is-active") && !(m.oldValue || "").includes("is-active")) onActive(m.target); }));
  revs.forEach((r) => mo.observe(r, { attributes: true, attributeFilter: ["class"], attributeOldValue: true }));
  runBar();

  /* keep timer bar in sync with the original hover-pause behaviour */
  stage.addEventListener("mouseleave", runBar);

  /* thumbnails: jump by pressing "next" the needed number of times */
  let jumping = false;
  thumbs.forEach((t, target) => t.addEventListener("click", () => {
    const cur = revs.findIndex((r) => r.classList.contains("is-active"));
    let steps = (target - cur + revs.length) % revs.length;
    if (!steps || jumping) return;
    jumping = true;
    const go = () => { next.click(); if (--steps > 0) setTimeout(go, 1150); else setTimeout(() => (jumping = false), 1150); };
    go();
  }));

  /* spotlight follows cursor + gentle 3D tilt */
  if (fine) {
    stage.addEventListener("pointermove", (e) => {
      const b = stage.getBoundingClientRect(); const x = (e.clientX - b.left) / b.width; const y = (e.clientY - b.top) / b.height;
      stage.style.setProperty("--mx", x * 100 + "%"); stage.style.setProperty("--my", y * 100 + "%");
      if (animate) gsap.to(stage, { rotationY: (x - 0.5) * 5, rotationX: (0.5 - y) * 4, transformPerspective: 1000, duration: 0.6, ease: "power2.out" });
    });
    stage.addEventListener("pointerleave", () => animate && gsap.to(stage, { rotationX: 0, rotationY: 0, duration: 1, ease: "elastic.out(1,.5)" }));
  }

  /* rating count-up */
  const rate = document.querySelector("#rateNum");
  if (rate) {
    const end = parseFloat(rate.dataset.rate) || 4.9;
    const show = (v) => (rate.textContent = v.toFixed(1));
    if (reduce || !("IntersectionObserver" in window)) show(end);
    else new IntersectionObserver((es, io) => es.forEach((en) => {
      if (!en.isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const tick = (t) => { const p = Math.min((t - t0) / 1600, 1); show(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 }).observe(rate);
  }
})();

/* =========================================================
   PRELOADER upgrade · PAGE TRANSITIONS · GSAP SECTION HEADINGS (additive)
   ========================================================= */
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = typeof window.gsap !== "undefined" && !reduce;
  const hasST = animate && !!window.ScrollTrigger;
  if (!animate) return;

  /* ---------- 1. Preloader: live % counter, progress ring, cycling words ---------- */
  const pl = document.querySelector("#preloader");
  if (pl) {
    const num = pl.querySelector("#plNum"); const ring = pl.querySelector(".pl__ring"); const word = pl.querySelector("#plWord");
    const C = 2 * Math.PI * 46; const st = { p: 0 };
    ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C;
    const paint = () => { num.textContent = Math.round(st.p); ring.style.strokeDashoffset = C * (1 - st.p / 100); };
    const words = ["Cleansing", "Hydrating", "Renewing", "Glowing"]; let wi = 0;
    gsap.from(pl.querySelectorAll(".pl__orb, img, .preloader__bar, .pl__word"), { y: 26, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" });
    const prog = gsap.to(st, { p: 88, duration: 2.6, ease: "power2.out", onUpdate: paint });
    const cyc = setInterval(() => { wi = (wi + 1) % words.length; word.textContent = words[wi]; gsap.fromTo(word, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }); }, 650);
    let done = false;
    const complete = () => { if (done) return; done = true; prog.kill(); clearInterval(cyc); word.textContent = "Glowing"; gsap.to(st, { p: 100, duration: 0.9, ease: "power2.inOut", onUpdate: paint }); };
    window.addEventListener("load", complete);
    setTimeout(complete, 3500); // same safety net as the original loader
  }

  /* ---------- 2. Page transition for the main menu pages ---------- */
  const pt = document.querySelector("#pageTrans");
  if (pt) {
    const [pa, pb] = pt.querySelectorAll(".pt__p"); const label = pt.querySelector(".pt__label");
    const small = pt.querySelector("#ptSmall"); const big = pt.querySelector("#ptBig");
    const names = { home: ["Welcome", "Home"], about: ["Our Story", "About Us"], services: ["Our Care", "Treatments"], blog: ["Stories & Glow", "The Journal"], contact: ["Let's Talk", "Book a Visit"] };
    let busy = false;
    document.querySelectorAll(".nav__link, .header__logo").forEach((a) => a.addEventListener("click", (e) => {
      const id = (a.getAttribute("href") || "").slice(1); const target = id && document.getElementById(id);
      if (!target || !names[id]) return;
      const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 78;
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - (id === "home" ? 0 : offset));
      if (busy) { e.preventDefault(); return; }
      if (Math.abs(top - window.scrollY) < 160) return; // already there: normal behaviour
      e.preventDefault(); busy = true;
      small.textContent = names[id][0]; big.textContent = names[id][1];
      pt.classList.add("is-on"); gsap.set([pa, pb], { y: "112vh" });
      gsap.timeline({ onComplete: () => { pt.classList.remove("is-on"); busy = false; } })
        .to(pa, { y: 0, duration: 0.55, ease: "power3.inOut" })
        .to(pb, { y: 0, duration: 0.55, ease: "power3.inOut" }, "-=0.38")
        .from(label.children, { y: 34, opacity: 0, stagger: 0.09, duration: 0.55, ease: "power3.out" })
        .add(() => { window.scrollTo({ top, behavior: "instant" }); history.replaceState(null, "", "#" + id); if (hasST) ScrollTrigger.update(); }, "+=0.05")
        .to(label.children, { opacity: 0, y: -20, duration: 0.3, stagger: 0.05 }, "+=0.3")
        .to(pb, { y: "-112vh", duration: 0.65, ease: "power3.inOut" })
        .to(pa, { y: "-112vh", duration: 0.65, ease: "power3.inOut" }, "-=0.48");
    }));
  }

  /* ---------- 3. GSAP text animation for every section heading ---------- */
  /* No clipping masks: words/letters fade + rise + de-blur, and always finish fully visible. */
  const ATOMIC = ".gal__shine, .rshine, em"; // inline accents stay whole so their styling survives
  function split(el, mode) {
    el.dataset.split = "2";
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    const units = [];
    const walk = (node) => Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (!tok.trim()) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "hw"; w.setAttribute("aria-hidden", "true");
          if (mode === "chars") Array.from(tok).forEach((ch) => { const c = document.createElement("span"); c.className = "hc"; c.textContent = ch; w.appendChild(c); units.push(c); });
          else { w.textContent = tok; units.push(w); }
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") {
        if (n.matches(ATOMIC)) { n.classList.add("hw"); n.setAttribute("aria-hidden", "true"); units.push(n); }
        else walk(n);
      }
    });
    walk(el);
    return units;
  }

  const heads = [];
  document.querySelectorAll("main .title").forEach((el) => {
    if (el.dataset.split || el.closest(".hero")) return; // hero + headings already split by the original script are skipped
    const xl = el.classList.contains("title--xl");
    const units = split(el, xl ? "chars" : "words");
    if (!units.length) return;
    el.removeAttribute("data-aos"); // GSAP replaces the AOS fade for headings
    gsap.set(units, xl ? { opacity: 0, y: 38, rotate: 6, filter: "blur(6px)" } : { opacity: 0, y: 30, skewY: 5 });
    heads.push({ el, units, xl, shown: false });
  });

  const reveal = (h) => {
    if (h.shown) return; h.shown = true;
    gsap.to(h.units, { opacity: 1, y: 0, rotate: 0, skewY: 0, filter: "blur(0px)", duration: 0.9, stagger: h.xl ? 0.03 : 0.08, ease: "power3.out", clearProps: "all" });
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      const h = heads.find((x) => x.el === en.target); if (h) reveal(h); io.unobserve(en.target);
    }), { rootMargin: "0px 0px -8% 0px" });
    heads.forEach((h) => io.observe(h.el));
  } else heads.forEach(reveal);
  // safety net: a heading that is on screen is never left hidden
  window.addEventListener("load", () => setTimeout(() => heads.forEach((h) => { const r = h.el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) reveal(h); }), 4500));

  if (window.AOS) AOS.refreshHard();
})();

/* =========================================================
   WHY CHOOSE US: stat counters + scroll resync
   ========================================================= */
/* Why choose us: count-up numbers when the strip scrolls into view */
(() => {
  const els = document.querySelectorAll(".why__stats [data-count]");
  if (!els.length || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const fmt = (e, v) => {
    const d = +(e.dataset.dec || 0);
    e.textContent = v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) + (e.dataset.suffix || "");
  };
  const run = e => {
    const end = +e.dataset.count, t0 = performance.now();
    const k = t => { const q = Math.min((t - t0) / 1600, 1); fmt(e, end * (1 - Math.pow(1 - q, 3))); if (q < 1) requestAnimationFrame(k); };
    requestAnimationFrame(k);
  };
  els.forEach(e => fmt(e, 0));
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } }), { threshold: .6 });
  els.forEach(e => io.observe(e));
})();

/* Keep scroll animations in sync when the page height changes (lazy images, fonts, new sections).
   Without this, headings further down can stay hidden because their trigger points are stale. */
(() => {
  if (!window.ScrollTrigger) return;
  let t;
  const sync = () => {
    clearTimeout(t);
    t = setTimeout(() => { ScrollTrigger.refresh(); if (window.AOS) AOS.refresh(); }, 200);
  };
  if ("ResizeObserver" in window) new ResizeObserver(sync).observe(document.body);
  document.querySelectorAll("img").forEach(i => { if (!i.complete) i.addEventListener("load", sync, { once: true }); });
  addEventListener("load", () => setTimeout(sync, 600));
  addEventListener("pageshow", sync);
})();

/* =========================================================
   CONTACT v2: treatment chips, live open/closed badge, today's hours
   ========================================================= */
(() => {
  const sel = document.querySelector("#fTreat"), chips = [...document.querySelectorAll(".bk__chip")];
  const paint = () => chips.forEach(c => c.setAttribute("aria-checked", String(sel && sel.value === c.textContent.trim())));
  if (sel) {
    chips.forEach(c => c.addEventListener("click", () => {
      sel.value = c.textContent.trim();
      sel.dispatchEvent(new Event("input", { bubbles: true }));   /* clears the error state */
      paint();
    }));
    sel.closest("form").addEventListener("reset", () => setTimeout(paint));
  }

  const now = new Date(), d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  const open = d !== 0 && h >= 10 && h < 19;
  const badge = document.querySelector("#liveStatus");
  if (badge) {
    let t = "Open now · until 7pm";
    if (!open) t = d === 0 ? "Closed today · opens Monday 10am"
      : h < 10 ? "Closed · opens today at 10am"
      : d === 6 ? "Closed · opens Monday 10am" : "Closed · opens tomorrow at 10am";
    badge.classList.toggle("is-closed", !open);
    badge.querySelector("b").textContent = t;
  }
  const row = document.querySelector('#hours [data-d="' + d + '"]');
  if (row) row.classList.add("is-today");
})();

/* =========================================================
   HEADER v2: search panel + bag/cart notes
   ========================================================= */
(() => {
  const btn = document.querySelector("#hdSearch"), box = document.querySelector("#hdSearchBox");
  if (!btn || !box) return;
  const input = box.querySelector("input"), form = box.querySelector("form");

  const toast = document.createElement("div");
  toast.className = "hd-toast"; toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  let tt;
  const say = (m) => { toast.textContent = m; toast.classList.add("is-on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("is-on"), 2600); };

  const toggle = (open) => {
    box.hidden = !open; btn.setAttribute("aria-expanded", String(open));
    if (open) setTimeout(() => input.focus(), 50);
  };
  btn.addEventListener("click", () => toggle(box.hidden));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) { toggle(false); btn.focus(); } });
  document.addEventListener("click", (e) => { if (!box.hidden && !box.contains(e.target) && !btn.contains(e.target)) toggle(false); });

  const map = [
    [/facial|acne|hydrat|anti|age|pigment|peel|laser|treat|serv|skin care|brighten/, "services"],
    [/result|before|after|proof/, "results"],
    [/why|expert|special|technolog|product/, "why"],
    [/ritual|process|consult|step/, "ritual"],
    [/gallery|photo|image/, "gallery"],
    [/review|testimon|client|rating/, "reviews"],
    [/blog|journal|tip|article|story/, "blog"],
    [/about|clinic|team|who/, "about"],
    [/contact|book|appoint|visit|hour|open|address|phone|email|call|direction/, "contact"]
  ];
  const go = (q) => {
    q = q.toLowerCase().trim();
    if (!q) return;
    const hit = map.find(([re]) => re.test(q));
    const target = hit && document.getElementById(hit[1]);
    if (!target) { say("No match for “" + q + "”. Try facial, acne, blog or contact."); return; }
    toggle(false);
    target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); go(input.value); });
  box.querySelectorAll(".hd-suggest button").forEach((b) => b.addEventListener("click", () => go(b.dataset.q)));

  document.querySelectorAll("[data-hd-note]").forEach((b) => b.addEventListener("click", () => say(b.dataset.hdNote)));
})();

/* =========================================================
   SEARCH v4: Enter or the "Go" button opens 404.html (when something is typed)
   (additive: runs before the older search handler and replaces its behaviour)
   ========================================================= */
(() => {
  "use strict";
  const box = document.querySelector("#hdSearchBox");
  if (!box) return;
  const form = box.querySelector("form");
  const input = box.querySelector("input");
  if (!form || !input) return;

  /* capture phase on the panel = this runs before the older submit handler on the form */
  box.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!input.value.trim()) {              /* nothing typed: stay here and nudge the field */
      input.focus();
      form.classList.remove("is-empty"); void form.offsetWidth; form.classList.add("is-empty");
      return;
    }
    window.location.href = "404.html";
  }, true);
})();

/* =========================================================
   SEARCH v5: when you come back from 404.html the search panel is closed and empty
   (additive: nothing above is changed)
   ========================================================= */
(() => {
  "use strict";
  const box = document.querySelector("#hdSearchBox"), btn = document.querySelector("#hdSearch");
  if (!box) return;
  const form = box.querySelector("form"), input = box.querySelector("input");
  if (!form || !input) return;

  const reset = () => {
    input.value = "";
    form.classList.remove("is-empty");
    box.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  };

  /* clear right before the page is left, so the "back" view is not saved with the old text */
  window.addEventListener("pagehide", reset);
  /* clear again when the page is shown (back button / bfcache / browser form restore) */
  window.addEventListener("pageshow", () => { reset(); setTimeout(reset, 80); });
  window.addEventListener("load", () => setTimeout(reset, 80));
})();

/* =========================================================
   BEFORE / AFTER photos for the draggable arch (Assests/before-slide.webp + after-slide.webp)
   (additive: the drag code above is unchanged)
   ========================================================= */
(() => {
  const ba = document.querySelector("#ba");
  if (!ba) return;
  ba.querySelectorAll("img").forEach((img) => {
    img.src = img.closest(".ba__before") ? "Assests/before-slide.webp" : "Assests/after-slide.webp";
  });
})();

/* =========================================================
   WHY CHOOSE US v3: hovering a reason swaps the photo
   ========================================================= */
(() => {
  const frame = document.querySelector(".why__frame"), list = document.querySelector(".why__list");
  const items = [...document.querySelectorAll(".why__item")], layers = [...document.querySelectorAll(".why__layer")];
  if (!frame || !list || !layers.length || items.length !== layers.length) return;
  const tagI = frame.querySelector(".why__float i"), tagT = frame.querySelector(".why__float span");
  const def = { i: tagI.className, t: tagT.textContent };
  let cur = -1, tm, auto = null, user = false, idx = -1;

  const label = (ic, tx) => {
    tagI.className = ic; tagT.textContent = tx;
    frame.classList.remove("swap"); void frame.offsetWidth; frame.classList.add("swap");
  };
  const show = (i) => {
    if (i === cur) return;
    const prev = layers[cur], n = layers[i];
    layers.forEach((l, k) => { if (k !== i && l !== prev) { l.classList.add("no-tr"); l.classList.remove("is-on", "is-prev"); } });
    if (prev) { prev.classList.remove("is-on"); prev.classList.add("is-prev"); prev.style.zIndex = 1; }
    n.classList.add("no-tr"); n.classList.remove("is-on", "is-prev"); void n.offsetWidth;
    n.classList.remove("no-tr"); n.style.zIndex = 2; n.classList.add("is-on");
    items.forEach((it, k) => it.classList.toggle("is-active", k === i));
    label(items[i].querySelector(".why__icon i").className, items[i].querySelector("h3").textContent);
    cur = i; clearTimeout(tm);
    tm = setTimeout(() => { if (prev && layers[cur] !== prev) { prev.classList.add("no-tr"); prev.classList.remove("is-prev"); } }, 1300);
  };
  const reset = () => {
    if (cur < 0) return;
    clearTimeout(tm);
    const c = layers[cur];
    layers.forEach((l) => { if (l !== c) { l.classList.add("no-tr"); l.classList.remove("is-on", "is-prev"); } });
    c.classList.remove("is-on", "is-prev");
    items.forEach((it) => it.classList.remove("is-active"));
    label(def.i, def.t); cur = -1;
  };
  const stopAuto = () => { user = true; clearInterval(auto); auto = null; };

  items.forEach((it, k) => {
    it.addEventListener("pointerenter", () => { stopAuto(); show(k); });
    it.addEventListener("focusin", () => { stopAuto(); show(k); });
  });
  list.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") reset(); });
  list.addEventListener("focusout", (e) => { if (!list.contains(e.relatedTarget)) reset(); });

  /* touch screens have no hover: cycle gently while the section is on screen until the visitor taps */
  if (matchMedia("(hover: none)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !user && !auto) auto = setInterval(() => { idx = (idx + 1) % items.length; show(idx); }, 3800);
      else if (!en.isIntersecting) { clearInterval(auto); auto = null; if (!user) reset(); }
    }, { threshold: .4 }).observe(frame);
  }
})();

/* =========================================================
   RESULTS: week buttons move the before/after slider
   ========================================================= */
(() => {
  const ba = document.querySelector("#ba"), handle = document.querySelector("#baHandle");
  const btns = [...document.querySelectorAll(".journey__steps button")];
  if (!ba || !handle || !btns.length) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf, busy = false;
  const put = (p) => { ba.style.setProperty("--pos", p + "%"); handle.setAttribute("aria-valuenow", Math.round(p)); };
  const go = (to) => {
    cancelAnimationFrame(raf);
    if (still) { put(to); return; }
    const from = parseFloat(handle.getAttribute("aria-valuenow")) || 50, t0 = performance.now(), d = 800;
    busy = true;
    const step = (t) => {
      const q = Math.min((t - t0) / d, 1), e = 1 - Math.pow(1 - q, 3);
      put(from + (to - from) * e);
      if (q < 1) raf = requestAnimationFrame(step); else busy = false;
    };
    raf = requestAnimationFrame(step);
  };
  const mark = (i) => btns.forEach((b, k) => b.classList.toggle("is-on", k === i));
  btns.forEach((b, i) => b.addEventListener("click", () => { mark(i); go(+b.dataset.pos); }));
  /* dragging the slider by hand highlights the nearest week */
  new MutationObserver(() => {
    if (busy) return;
    const p = parseFloat(handle.getAttribute("aria-valuenow"));
    let best = 0, bd = Infinity;
    btns.forEach((b, i) => { const d = Math.abs(+b.dataset.pos - p); if (d < bd) { bd = d; best = i; } });
    mark(best);
  }).observe(handle, { attributes: true, attributeFilter: ["aria-valuenow"] });
})();