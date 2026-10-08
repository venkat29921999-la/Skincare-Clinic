/* =========================================================
   RETURN FROM 404.html: remember the page and section you left from, so
   the back button on 404.html brings you to the same page and section.
   (added at the very top so it still runs if later code stops on a page)
   ========================================================= */
(() => {
  "use strict";
  const KEY = "stackly:return";
  const file = () => (location.pathname.split("/").pop() || "index.html");
  const is404 = () => file().toLowerCase() === "404.html";
  const to404 = (a) => /(^|\/)404\.html([?#]|$)/i.test(a.getAttribute("href") || "");
  const secOf = (el) => el && el.closest ? el.closest("section[id], footer[id]") : null;
  const save = (sec) => {
    try {
      if (!sec) { const mid = document.elementFromPoint(innerWidth / 2, innerHeight / 2); sec = secOf(mid); }
      sessionStorage.setItem(KEY, file() + (sec && sec.id ? "#" + sec.id : ""));
    } catch (e) {}
  };

  let clicked = false;
  if (!is404()) {
    /* open 404.html links in the same tab, so the way back is simple */
    const untarget = () => document.querySelectorAll("a[href]").forEach((a) => { if (to404(a) && a.getAttribute("target") === "_blank") a.removeAttribute("target"); });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", untarget); else untarget();
    /* link clicks: remember the section the link sits in */
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (a && to404(a)) { save(secOf(a)); clicked = true; }
    }, true);
    /* any other way of leaving (search, form redirect, ...): remember where you were looking */
    window.addEventListener("pagehide", () => {
      if (!clicked) save(null);
    });
    return;
  }

  /* on 404.html: point the "back" button(s) to the saved page and section */
  const wire = () => {
    let back = ""; try { back = sessionStorage.getItem(KEY) || ""; } catch (e) {}
    if (!back || /^404\.html/i.test(back)) return;
    document.querySelectorAll("a[href]").forEach((a) => {
      if (a.closest("header, footer, nav")) return;
      const h = (a.getAttribute("href") || "").split("#")[0];
      if (/(^|\/)index\.html$/i.test(h) || h === "/" || h === "./") a.setAttribute("href", back);
    });
    document.querySelectorAll("[data-back], .back, #back").forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", back);
      else el.addEventListener("click", () => { location.href = back; });
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();

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

/* =========================================================
   ABOUT PAGE (about.html) — additive; runs only when <body class="about-page">
   ========================================================= */
(() => {
  "use strict";
  if (!document.body.classList.contains("about-page")) return;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Reveal on scroll + count-up ---------- */
  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = "1";
    const to = +el.dataset.to, suffix = el.dataset.suffix || "", plain = el.dataset.sep === "0";
    const from = plain ? to - 24 : 0, t0 = performance.now(), dur = 1700;
    const tick = (t) => {
      const q = clamp((t - t0) / dur, 0, 1), v = Math.round(from + (to - from) * (1 - Math.pow(1 - q, 3)));
      el.textContent = (plain ? v : v.toLocaleString("en-IN")) + (q < 1 ? "" : suffix);
      if (q < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const show = (el) => { el.classList.add("is-in"); $$(".as__num", el).forEach(countUp); };
  const targets = $$("[data-rv]");
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("rv-on");
    // elements that start clipped to nothing can't be seen by IntersectionObserver, so those are checked on scroll
    const clipped = targets.filter((t) => t.dataset.rv === "open" || t.dataset.rv === "grow");
    const plain = targets.filter((t) => !clipped.includes(t));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    }), { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    plain.forEach((t) => io.observe(t));
    let pend = clipped.slice(), tk = false;
    const check = () => {
      tk = false;
      pend = pend.filter((t) => { const r = t.getBoundingClientRect(); if (r.top < innerHeight * 0.88 && r.bottom > 0) { show(t); return false; } return true; });
    };
    const req = () => { if (!tk && pend.length) { tk = true; requestAnimationFrame(check); } };
    window.addEventListener("scroll", req, { passive: true }); window.addEventListener("resize", req); check();
    // safety net: anything already on screen is never left hidden
    window.addEventListener("load", () => setTimeout(() => targets.forEach((t) => {
      const r = t.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show(t);
    }), 3500));
  } else targets.forEach(show);

  /* ---------- Hero: pointer parallax ---------- */
  const hero = $("#a-hero"), vis = $("#ahVisual");
  if (hero && fine && !reduce) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2, y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      hero.style.setProperty("--px", x.toFixed(3)); hero.style.setProperty("--py", y.toFixed(3));
      vis && (vis.style.setProperty("--px", x.toFixed(3)), vis.style.setProperty("--py", y.toFixed(3)));
    });
    hero.addEventListener("pointerleave", () => {
      [hero, vis].forEach((n) => n && (n.style.setProperty("--px", 0), n.style.setProperty("--py", 0)));
    });
  }

  /* ---------- Philosophy: soft light that follows the pointer ---------- */
  const ap = $("#a-philosophy");
  if (ap && fine && !reduce) ap.addEventListener("pointermove", (e) => {
    const r = ap.getBoundingClientRect();
    ap.style.setProperty("--sx", e.clientX - r.left + "px"); ap.style.setProperty("--sy", e.clientY - r.top + "px");
  });

  /* ---------- Mission & Vision: 3D tilt with glare ---------- */
  if (fine && !reduce) $$("[data-tilt]").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg"); c.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
      c.style.setProperty("--gx", x * 100 + "%"); c.style.setProperty("--gy", y * 100 + "%");
    });
    c.addEventListener("pointerleave", () => { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
  });

  /* ---------- Approach: path draws as you scroll ---------- */
  const track = $("#aaTrack"), path = $("#aaPath"), steps = $$(".aa__step");
  if (track) {
    if (path) { path.setAttribute("pathLength", "1"); path.style.strokeDasharray = "1"; }
    const paint = (p) => {
      track.style.setProperty("--p", p.toFixed(3));
      if (path) path.style.strokeDashoffset = (1 - p).toFixed(3);
      steps.forEach((s) => s.classList.toggle("is-on", p >= parseFloat(s.dataset.at) - 0.02));
    };
    if (reduce) { paint(1); if (path) path.style.strokeDashoffset = 0; }
    else {
      let tick = false;
      const upd = () => {
        tick = false;
        const r = track.getBoundingClientRect(), vh = window.innerHeight;
        paint(clamp((vh * 0.85 - r.top) / (vh * 0.3 + r.height), 0, 1));
      };
      window.addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
      window.addEventListener("resize", upd); upd();
    }
  }

  /* ---------- Clinic: lightbox ---------- */
  const lb = $("#alb"), tiles = $$(".ac__tile");
  if (lb && tiles.length) {
    const img = $("img", lb), cap = $("figcaption", lb); let idx = 0, last = null;
    const set = (i) => {
      idx = (i + tiles.length) % tiles.length;
      const t = tiles[idx], im = $("img", t);
      img.src = im.currentSrc || im.src; img.alt = im.alt; cap.textContent = $("figcaption", t).textContent;
    };
    const open = (i) => { last = document.activeElement; set(i); lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); document.body.classList.add("is-locked"); $(".alb__x", lb).focus(); };
    const close = () => { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); document.body.classList.remove("is-locked"); last && last.focus(); };
    tiles.forEach((t, i) => {
      t.tabIndex = 0; t.setAttribute("role", "button"); t.setAttribute("aria-label", "Open image: " + $("figcaption", t).textContent);
      t.addEventListener("click", () => open(i));
      t.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
    });
    $(".alb__n--p", lb).addEventListener("click", () => set(idx - 1));
    $(".alb__n--n", lb).addEventListener("click", () => set(idx + 1));
    $("[data-alb-close]", lb).addEventListener("click", close);
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") set(idx - 1); else if (e.key === "ArrowRight") set(idx + 1);
    });
  }

  /* ---------- Under the surface: layer explorer ---------- */
  const fig = $("#alFig");
  if (fig) {
    const tabs = $$(".al__tabs button"), panes = $$(".al__pane"), lys = $$(".al__ly", fig), sy = [64, 152, 246];
    let cur = 0, timer = null, touched = false;
    const pick = (i, byUser) => {
      cur = i; if (byUser) { touched = true; clearInterval(timer); }
      fig.dataset.sel = i; $("svg", fig).style.setProperty("--sy", sy[i] + "px");
      lys.forEach((l) => l.classList.toggle("is-on", +l.dataset.i === i));
      tabs.forEach((t, k) => { t.classList.toggle("is-on", k === i); t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1; });
      panes.forEach((p, k) => p.hidden = k !== i);
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => pick(i, true));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length; pick(n, true); tabs[n].focus(); }
      });
    });
    lys.forEach((l) => { l.style.cursor = "pointer"; l.addEventListener("click", () => pick(+l.dataset.i, true)); });
    pick(0);
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver((es) => es.forEach((e) => {
        clearInterval(timer);
        if (e.isIntersecting && !touched) timer = setInterval(() => pick((cur + 1) % 3), 5200);
      }), { threshold: 0.35 }).observe(fig);
    }
  }

  /* ---------- Questions: accordion ---------- */
  $$(".aq__item").forEach((it) => {
    const b = $(".aq__q", it);
    b.addEventListener("click", () => {
      const open = !it.classList.contains("is-open");
      $$(".aq__item").forEach((o) => { o.classList.remove("is-open"); $(".aq__q", o).setAttribute("aria-expanded", "false"); });
      it.classList.toggle("is-open", open); b.setAttribute("aria-expanded", String(open));
    });
  });
})();
/* ---------- Under the surface: spotlight follows the selected layer on the new image (appended) ---------- */
(() => {
  "use strict";
  const fig = document.getElementById("alFig");
  const box = fig && fig.querySelector(".al__img");
  if (!box) return;
  const tag = box.querySelector(".al__tag");
  const bands = [[0, 27], [27, 37], [64, 36]];   /* top %, height % of each layer in the image */
  const names = ["Epidermis", "Dermis", "Hypodermis"];
  const apply = () => {
    const i = Math.min(2, Math.max(0, parseInt(fig.dataset.sel, 10) || 0));
    box.style.setProperty("--t", bands[i][0] + "%");
    box.style.setProperty("--h", bands[i][1] + "%");
    if (tag) tag.textContent = names[i];
  };
  new MutationObserver(apply).observe(fig, { attributes: true, attributeFilter: ["data-sel"] });
  apply();
  /* click a layer on the image to open its tab */
  box.addEventListener("click", (e) => {
    const r = box.getBoundingClientRect();
    const y = ((e.clientY - r.top) / r.height) * 100;
    const t = document.getElementById("alT" + (y < 27 ? 0 : y < 64 ? 1 : 2));
    if (t) t.click();
  });
})();

/* ===== SERVICE PAGE (svc-) : appended, existing code untouched ===== */
(function(){
  if(!document.body.classList.contains('svc-page'))return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{threshold:.18});
  document.querySelectorAll('[data-svc],#svcTl').forEach(function(el){io.observe(el)});
  var pills=document.querySelectorAll('.svc-pills a'),secs=[].map.call(pills,function(a){return document.querySelector(a.getAttribute('href'))});
  var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var i=secs.indexOf(e.target);pills.forEach(function(p,k){p.classList.toggle('is-on',k===i)})}})},{rootMargin:'-40% 0px -50% 0px'});
  secs.forEach(function(s){s&&so.observe(s)});
  var D=[['Medical peels + Light therapy','Clear pores and calm inflammation first, scars after.','#svc-acne'],['Brightening Peel + Dark Spot Correction','Even tone with sun-care guidance for lasting results.','#svc-pig'],['Collagen Induction + Skin Boosters','Gradual, natural-looking firmness and glow.','#svc-aging'],['Hydration Infusion + Barrier Restore Mask','Rebuild the barrier and bring back softness.','#svc-hydra']];
  var res=document.querySelector('.svc-res');
  document.querySelectorAll('.svc-chips button').forEach(function(b){b.addEventListener('click',function(){
    document.querySelectorAll('.svc-chips button').forEach(function(x){x.classList.remove('is-on')});b.classList.add('is-on');
    var d=D[+b.dataset.k];svcRt.textContent=d[0];svcRp.textContent=d[1];svcRa.setAttribute('href',d[2]);
    res.classList.remove('is-swap');void res.offsetWidth;res.classList.add('is-swap')})});
  var co=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;co.unobserve(e.target);var el=e.target,to=+el.dataset.to,t0=performance.now();
    (function f(t){var p=Math.min((t-t0)/1400,1);el.textContent=Math.round(to*(1-Math.pow(1-p,3)))+(p===1?el.dataset.s:'');if(p<1)requestAnimationFrame(f)})(t0)})},{threshold:.6});
  document.querySelectorAll('.svc-stats b').forEach(function(b){co.observe(b)});
})();

/* svc premium pass: cursor spotlight on cards + heading underline */
(function(){
  if(!document.body.classList.contains('svc-page'))return;
  document.querySelectorAll('.svc-arch,.svc-tile').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')})});
  document.querySelectorAll('.svc-sec .title').forEach(function(t){var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){t.classList.add('is-in');o.disconnect()}},{threshold:.5});o.observe(t)});
})();

/* svc CTA band: pointer spotlight */
(function(){var c=document.getElementById('svc-cta');if(!c)return;c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')})})();

/* svc Acne: soft 3D tilt on the photo */
(function(){
  var m=document.querySelector('.svc-acne__media');
  if(!m||!window.matchMedia('(hover:hover)').matches||window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var f=m.querySelector('.svc-acne__fig');
  m.addEventListener('pointermove',function(e){var r=m.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;f.style.setProperty('--ry',(x*4).toFixed(2)+'deg');f.style.setProperty('--rx',(-y*4).toFixed(2)+'deg')});
  m.addEventListener('pointerleave',function(){f.style.setProperty('--rx','0deg');f.style.setProperty('--ry','0deg')});
})();

/* svc Brightening & pigmentation: accordion + gentle autoplay */
(function(){
  var w=document.getElementById('svcPg');if(!w)return;
  var t=[].slice.call(w.children),i=0,hov=false,vis=false,rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function set(n){i=n;t.forEach(function(x,k){x.classList.toggle('is-act',k===n)})}
  t.forEach(function(x,k){['pointerenter','focusin','click'].forEach(function(ev){x.addEventListener(ev,function(){if(ev==='pointerenter')hov=true;set(k)})})});
  w.addEventListener('pointerleave',function(){hov=false});
  new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(w);
  if(!rm)setInterval(function(){if(vis&&!hov)set((i+1)%t.length)},5000);
  set(0);
})();

/* svc Anti-aging: tabs, focus gauge, gentle autoplay */
(function(){
  var w=document.getElementById('svcAg');if(!w)return;
  var T=[].slice.call(w.children),vis=document.getElementById('svcAgVis'),chip=document.getElementById('svcAgChip'),num=document.getElementById('svcAgNum'),ring=document.getElementById('svcAgRing');
  var i=0,hov=false,on=false,cur=0,raf,rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function tw(to){cancelAnimationFrame(raf);var f=cur,t0=performance.now();(function s(t){var p=Math.min((t-t0)/900,1);cur=Math.round(f+(to-f)*(1-Math.pow(1-p,3)));num.textContent=cur;if(p<1)raf=requestAnimationFrame(s)})(t0)}
  function set(n){i=n;T.forEach(function(x,k){x.classList.toggle('is-act',k===n);x.setAttribute('aria-selected',k===n)});var d=T[n].dataset;
    chip.innerHTML='<i class="fa-solid '+d.i+'"></i> '+d.k;ring.style.strokeDashoffset=(251.3*(1-d.g/100)).toFixed(1);tw(+d.g);
    vis.classList.remove('is-sw');void vis.offsetWidth;vis.classList.add('is-sw')}
  T.forEach(function(x,k){['pointerenter','focusin','click'].forEach(function(ev){x.addEventListener(ev,function(){if(ev==='pointerenter')hov=true;if(k!==i)set(k)})})});
  w.addEventListener('pointerleave',function(){hov=false});
  new IntersectionObserver(function(es){on=es[0].isIntersecting}).observe(vis);
  if(!rm)setInterval(function(){if(on&&!hov)set((i+1)%T.length)},5200);
  set(0);
})();

/* svc "Real results, real care": photo stack + steps (appended) */
(function(){
  var s=document.getElementById('svcRs'),st=document.getElementById('svcRsStage');if(!s||!st)return;
  var L=[].slice.call(s.children),C=[].slice.call(st.querySelectorAll('.svc-rs__card')),i=0,hov=false,on=false;
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function set(n){i=n;L.forEach(function(x,k){x.classList.toggle('is-act',k===n)});C.forEach(function(c,k){c.setAttribute('data-pos',(k-n+C.length)%C.length)})}
  L.forEach(function(x,k){['pointerenter','focusin','click'].forEach(function(ev){x.addEventListener(ev,function(){if(ev==='pointerenter')hov=true;if(k!==i)set(k)})})});
  C.forEach(function(c,k){c.addEventListener('click',function(){set(k)})});
  s.addEventListener('pointerleave',function(){hov=false});
  st.addEventListener('pointerenter',function(){hov=true});
  st.addEventListener('pointerleave',function(){hov=false;st.style.setProperty('--rx','0deg');st.style.setProperty('--ry','0deg')});
  if(!rm&&window.matchMedia('(hover:hover)').matches)st.addEventListener('pointermove',function(e){var r=st.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;st.style.setProperty('--ry',(x*8).toFixed(1)+'deg');st.style.setProperty('--rx',(-y*8).toFixed(1)+'deg')});
  new IntersectionObserver(function(es){on=es[0].isIntersecting}).observe(st);
  if(!rm)setInterval(function(){if(on&&!hov)set((i+1)%C.length)},5000);
  set(0);
})();


/* svc "How your treatment works": scroll-driven journey (appended) */
(function(){
  var w=document.getElementById('svcJr');if(!w)return;
  var path=document.getElementById('svcJrP'),orb=document.getElementById('svcJrO'),tr=w.querySelector('.svc-jr__track'),
      C=[].slice.call(w.querySelectorAll('.svc-jr__c')),L=path.getTotalLength(),TH=[.04,.36,.62,.88],tick=false,
      rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function upd(){
    tick=false;var r=w.getBoundingClientRect(),vh=window.innerHeight;
    var p=rm?1:Math.min(1,Math.max(0,(vh*.72-r.top)/(r.height*.8)));
    w.style.setProperty('--p',p.toFixed(3));
    var pt=path.getPointAtLength(p*L);orb.style.left=(pt.x/1200*tr.clientWidth)+'px';orb.style.top=(pt.y/120*tr.clientHeight)+'px';
    C.forEach(function(c,k){c.classList.toggle('is-on',p>=TH[k])});
  }
  window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
  window.addEventListener('resize',upd);upd();
})();

/* =========================================================
   CONTACT PAGE (ct-) + INDEX extras (ix-) — appended, existing code untouched
   Runs only when <body class="contact-page"> or the ix- sections exist.
   Works without GSAP/AOS (pure IntersectionObserver + CSS).
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- INDEX: skin finder (ix-) ---------- */
  const finder = $("#ixFinder");
  if (finder) {
    const data = {
      dry:       { tag: "Dry skin",       icon: "fa-droplet",      name: "Hydration Therapy", txt: "Deep, lasting moisture that calms tightness and restores a soft, plump feel.", m: [88, 22, 40] },
      oily:      { tag: "Oily skin",      icon: "fa-sun",          name: "Acne Care",         txt: "Clear pores and calmer breakouts with targeted, gentle therapy that does not strip your skin.", m: [46, 84, 38] },
      combo:     { tag: "Combination",    icon: "fa-circle-half-stroke", name: "Advanced Facial", txt: "Deep cleansing and light resurfacing that balances the oily zones and the dry ones.", m: [62, 58, 36] },
      sensitive: { tag: "Sensitive skin", icon: "fa-feather",      name: "Hydration Therapy", txt: "A slow, soothing plan that strengthens your barrier before anything stronger is introduced.", m: [78, 26, 86] },
      dull:      { tag: "Dull tone",      icon: "fa-star",         name: "Skin Brightening",  txt: "Gentle brightening peels that bring back an even, luminous tone.", m: [60, 44, 34] },
    };
    const panel = $("#ixPanel", finder);
    const chips = $$(".ix-chip", finder);
    const set = (k, animate = true) => {
      const d = data[k]; if (!d) return;
      chips.forEach((c) => { const on = c.dataset.k === k; c.classList.toggle("is-on", on); c.setAttribute("aria-checked", String(on)); });
      $("#ixTag", panel).innerHTML = '<i class="fa-solid ' + d.icon + '"></i> ' + d.tag;
      $("#ixName", panel).textContent = d.name;
      $("#ixTxt", panel).textContent = d.txt;
      $$(".ix-meter", panel).forEach((m, i) => { m.style.setProperty("--v", d.m[i] + "%"); $("b", m).textContent = d.m[i] + "%"; });
      if (animate && !reduce) {
        panel.classList.remove("is-swap"); void panel.offsetWidth; panel.classList.add("is-swap");
        $$(".ix-meter i", panel).forEach((i) => { i.style.animation = "none"; void i.offsetWidth; i.style.animation = ""; });
      }
    };
    chips.forEach((c) => c.addEventListener("click", () => set(c.dataset.k)));
    set("dry", false);
  }

  /* ---------- everything below is the contact page only ---------- */
  if (!document.body.classList.contains("contact-page")) return;

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$("[data-ct]");
  const settle = (el) => setTimeout(() => el.removeAttribute("data-ct"), 2400 + (parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0) * 1000);
  if ("IntersectionObserver" in window && !reduce) {
    document.documentElement.classList.add("ct-js");
    /* elements clipped to nothing (curtain / iris) cannot be seen by IntersectionObserver, so their parent is watched instead */
    const proxy = new Map();
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      (proxy.get(e.target) || []).forEach((el) => { el.classList.add("ct-in"); settle(el); });
      io.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((el) => {
      const clipped = el.dataset.ct === "curtain" || el.dataset.ct === "iris";
      const tgt = clipped ? el.parentElement : el;
      if (!proxy.has(tgt)) { proxy.set(tgt, []); io.observe(tgt); }
      proxy.get(tgt).push(el);
    });
    /* safety net: never leave anything hidden */
    window.addEventListener("load", () => setTimeout(() => revealEls.forEach((el) => {
      if (el.isConnected && !el.classList.contains("ct-in")) { const r = (el.parentElement || el).getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add("ct-in"); }
    }), 3000));
  } else revealEls.forEach((el) => el.classList.add("ct-in"));

  /* ---------- hero: pointer parallax on the floating bottles ---------- */
  const hero = $("#ct-hero");
  if (hero && fine && !reduce) {
    const floats = $$(".ct-float", hero);
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      floats.forEach((f) => { f.style.setProperty("--k", f.dataset.depth || 20); f.style.setProperty("--px", nx.toFixed(3)); f.style.setProperty("--py", ny.toFixed(3)); });
    });
    hero.addEventListener("pointerleave", () => floats.forEach((f) => { f.style.setProperty("--px", 0); f.style.setProperty("--py", 0); }));
  }

  /* ---------- scroll parallax for the hand-shadow ---------- */
  const par = $$("[data-par]");
  if (par.length && !reduce) {
    let tick = false;
    const upd = () => {
      tick = false;
      par.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        el.style.translate = "0 " + ((r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.par)).toFixed(1) + "px";
      });
    };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }

  /* ---------- 3D tilt + spotlight on the contact cards ---------- */
  if (fine && !reduce) $$("[data-tilt]").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--ry", ((x - 0.5) * 12).toFixed(2) + "deg"); c.style.setProperty("--rx", ((0.5 - y) * 12).toFixed(2) + "deg");
      c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
    });
    c.addEventListener("pointerleave", () => { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
  });

  /* ---------- four steps: a glow that travels along ---------- */
  const steps = $$("#ctSteps .ct-step");
  if (steps.length) {
    let si = 0, st = null;
    const go = (n) => { si = n % steps.length; steps.forEach((s, i) => s.classList.toggle("is-on", i === si)); };
    const start = () => { if (!st && !reduce) st = setInterval(() => go(si + 1), 2400); };
    const stop = () => { clearInterval(st); st = null; };
    steps.forEach((s, i) => { s.addEventListener("mouseenter", () => { stop(); go(i); }); s.addEventListener("mouseleave", start); s.addEventListener("click", () => { stop(); go(i); }); });
    if ("IntersectionObserver" in window) new IntersectionObserver((en) => en.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.4 }).observe($("#ctSteps"));
  }

  /* ---------- FAQ accordion (one open at a time) ---------- */
  const items = $$(".ct-acc__item");
  items.forEach((it) => {
    const btn = $(".ct-acc__btn", it);
    btn.addEventListener("click", () => {
      const was = it.classList.contains("is-open");
      items.forEach((o) => { o.classList.remove("is-open"); $(".ct-acc__btn", o).setAttribute("aria-expanded", "false"); });
      if (!was) { it.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); }
    });
  });
  if (items[0]) { items[0].classList.add("is-open"); $(".ct-acc__btn", items[0]).setAttribute("aria-expanded", "true"); }

  /* ---------- marquee: duplicate once for a seamless loop ---------- */
  $$(".ct-mq__track").forEach((t) => { t.innerHTML += t.innerHTML; });

  /* ---------- live hours + clock ring ---------- */
  const ring = $("#ctRing");
  if (ring) {
    const now = new Date(), day = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
    const open = 10, close = 19, isOpen = day !== 0 && h >= open && h < close;
    const li = $('#ctDays li[data-d="' + day + '"]'); if (li) li.classList.add("is-today");
    const clock = $(".ct-clock");
    $("#ctNow").textContent = isOpen ? "Open now" : "Closed now";
    $("#ctUntil").textContent = isOpen ? "until 7pm today" : (day === 0 || (day === 6 && h >= close) ? "opens Monday 10am" : h < open ? "opens today 10am" : "opens tomorrow 10am");
    clock.classList.toggle("is-closed", !isOpen);
    const frac = isOpen ? (h - open) / (close - open) : 0;
    const run = () => { ring.style.strokeDashoffset = String(327 * (1 - frac)); };
    if ("IntersectionObserver" in window && !reduce) new IntersectionObserver((en, o) => en.forEach((e) => { if (e.isIntersecting) { run(); o.disconnect(); } }), { threshold: 0.4 }).observe(clock);
    else run();
  }

  /* ---------- reserve form ---------- */
  const form = $("#ctForm");
  if (form) {
    const msg = $("#ctMsg"), count = $("#ctCount"), status = $("#ctStatus");
    const rules = {
      first: (v) => v.trim().length > 1 || "Please enter your first name.",
      last: (v) => v.trim().length > 0 || "Please enter your last name.",
      phone: (v) => /^[+()\d][\d\s()+-]{6,}$/.test(v.trim()) || "Please enter a valid phone number.",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Please enter a valid email address.",
      message: (v) => v.trim().length > 4 || "Tell us a little about your skin.",
    };
    const check = (el) => {
      const f = el.closest(".ct-f"), res = rules[el.name](el.value);
      f.classList.toggle("is-error", res !== true); $(".ct-err", f).textContent = res === true ? "" : res;
      return res === true;
    };
    $$("input, textarea", form).forEach((el) => {
      el.addEventListener("blur", () => { if (el.value) check(el); });
      el.addEventListener("input", () => { if (el.closest(".ct-f").classList.contains("is-error")) check(el); });
    });
    msg.addEventListener("input", () => { count.textContent = msg.value.length + " / 500"; });

    const petals = (btn) => {
      if (reduce) return;
      const r = btn.getBoundingClientRect();
      for (let i = 0; i < 16; i++) {
        const p = document.createElement("i"); p.className = "ct-petal fa-solid fa-leaf";
        p.style.left = r.left + r.width / 2 + "px"; p.style.top = r.top + r.height / 2 + "px"; document.body.appendChild(p);
        const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 150;
        p.animate([{ transform: "translate(0,0) rotate(0) scale(.6)", opacity: 1 }, { transform: "translate(" + Math.cos(a) * d + "px," + (Math.sin(a) * d + 70) + "px) rotate(" + (Math.random() * 540 - 270) + "deg) scale(1.1)", opacity: 0 }],
          { duration: 1200 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => p.remove();
      }
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      status.className = "ct-status";
      const ok = $$("input, textarea", form).map(check).every(Boolean);
      if (!ok) { status.textContent = "Please complete the highlighted fields."; status.classList.add("is-err"); const bad = $(".is-error input, .is-error textarea", form); if (bad) bad.focus(); return; }
      const btn = $(".ct-submit", form), label = $(".ct-submit__t", btn), icon = $("i", btn);
      btn.disabled = true; btn.classList.add("is-busy"); label.textContent = "Sending"; icon.className = "fa-solid fa-circle-notch";
      /* TODO: send the form data to your backend / email service here, then run the success state below */
      setTimeout(() => {
        btn.classList.remove("is-busy"); btn.classList.add("is-done"); label.textContent = "Message sent"; icon.className = "fa-solid fa-check";
        status.textContent = "Thank you! We've received your message and will reply shortly.";
        status.classList.add("is-ok"); petals(btn); form.reset(); count.textContent = "0 / 500";
        setTimeout(() => { btn.disabled = false; btn.classList.remove("is-done"); label.textContent = "Submit message"; icon.className = "fa-solid fa-angle-right"; }, 4200);
      }, 1100);
    });
  }
})();

/* ---------- Contact form: validate, go to 404.html on success, always empty when you come back (appended) ---------- */
(() => {
  "use strict";
  const form = document.getElementById("ctForm");
  if (!form) return;
  const field = (n) => form.elements[n];
  const status = document.getElementById("ctStatus");
  const count = document.getElementById("ctCount");
  const btn = form.querySelector(".ct-submit");
  const label = btn && btn.querySelector(".ct-submit__t");
  const icon = btn && btn.querySelector("i");
  const rules = {
    first: (v) => v.trim().length > 1,
    last: (v) => v.trim().length > 0,
    phone: (v) => /^[+()\d][\d\s()+-]{6,}$/.test(v.trim()),
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    message: (v) => v.trim().length > 4,
  };
  const allValid = () => Object.keys(rules).every((n) => field(n) && rules[n](field(n).value));

  /* put the form back to a clean, empty state */
  const resetAll = () => {
    form.reset();
    Array.from(form.querySelectorAll("input, textarea")).forEach((el) => { el.value = ""; });
    Array.from(form.querySelectorAll(".ct-f")).forEach((f) => f.classList.remove("is-error"));
    Array.from(form.querySelectorAll(".ct-err")).forEach((e) => { e.textContent = ""; });
    if (status) { status.textContent = ""; status.className = "ct-status"; }
    if (count) count.textContent = "0 / 500";
    if (btn) {
      btn.disabled = false; btn.classList.remove("is-busy", "is-done");
      if (label) label.textContent = "Submit message";
      if (icon) icon.className = "fa-solid fa-angle-right";
    }
  };

  /* runs before the existing submit handler */
  form.addEventListener("submit", (e) => {
    if (!allValid()) {
      /* the existing handler shows the messages under each field; add a small shake */
      form.classList.remove("is-shake"); void form.offsetWidth; form.classList.add("is-shake");
      return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    btn.disabled = true; btn.classList.add("is-busy");
    if (label) label.textContent = "Sending";
    if (icon) icon.className = "fa-solid fa-circle-notch";
    /* TODO: send the form data to your backend here before leaving the page */
    setTimeout(() => { resetAll(); window.location.href = "404.html"; }, 700);
  }, true);
  form.addEventListener("animationend", (e) => { if (e.target === form) form.classList.remove("is-shake"); });

  /* empty when the page loads or when the browser brings it back (Back button, cached page) */
  form.setAttribute("autocomplete", "off");
  window.addEventListener("pageshow", () => { resetAll(); setTimeout(resetAll, 120); });
  window.addEventListener("pagehide", resetAll);
  window.addEventListener("load", () => setTimeout(resetAll, 150));
  resetAll();
})();

/* ---------- Contact: opening hours, click a day to preview it (appended) ---------- */
(() => {
  "use strict";
  const list = document.getElementById("ctDays");
  const clock = document.querySelector(".ct-clock");
  const ring = document.getElementById("ctRing");
  const nowEl = document.getElementById("ctNow");
  const untilEl = document.getElementById("ctUntil");
  if (!list || !clock || !ring || !nowEl || !untilEl) return;
  const txt = clock.querySelector(".ct-clock__txt");
  const rows = Array.from(list.querySelectorAll("li[data-d]"));
  const today = new Date().getDay();
  const live = { now: nowEl.textContent, until: untilEl.textContent, closed: clock.classList.contains("is-closed") };
  const liveFrac = () => {
    const n = new Date(), h = n.getHours() + n.getMinutes() / 60;
    return today !== 0 && h >= 10 && h < 19 ? (h - 10) / 9 : 0;
  };

  /* hint + reserve button under the list */
  const hint = document.createElement("p");
  hint.className = "ct-days__hint"; hint.textContent = "Tap a day to preview its hours.";
  const cta = document.createElement("a");
  cta.className = "btn btn--dark ct-days__cta"; cta.href = "404.html"; cta.hidden = true;
  list.after(hint); hint.after(cta);

  const pop = () => { txt.classList.remove("is-swap"); void txt.offsetWidth; txt.classList.add("is-swap"); };
  const clear = () => { list.classList.remove("has-sel"); rows.forEach((r) => { r.classList.remove("is-sel"); r.setAttribute("aria-pressed", "false"); }); };

  const showLive = () => {
    clear(); cta.hidden = true;
    nowEl.textContent = live.now; untilEl.textContent = live.until;
    clock.classList.toggle("is-closed", live.closed);
    ring.style.strokeDashoffset = String(327 * (1 - liveFrac()));
    pop();
  };
  const select = (row) => {
    const d = +row.dataset.d;
    if (row.classList.contains("is-sel")) { showLive(); return; }
    clear(); list.classList.add("has-sel"); row.classList.add("is-sel"); row.setAttribute("aria-pressed", "true");
    const name = row.querySelector("span").textContent.trim();
    const hours = row.querySelector("b").textContent.trim();
    const closed = /closed/i.test(hours);
    if (d === today) {
      nowEl.textContent = live.now; untilEl.textContent = live.until;
      clock.classList.toggle("is-closed", live.closed);
      ring.style.strokeDashoffset = String(327 * (1 - liveFrac()));
    } else {
      nowEl.textContent = closed ? "Closed" : "Open";
      untilEl.textContent = closed ? name + " · we reopen Monday" : name + " · " + hours;
      clock.classList.toggle("is-closed", closed);
      ring.style.strokeDashoffset = closed ? "327" : "0";
    }
    if (closed) cta.hidden = true;
    else { cta.hidden = false; cta.textContent = d === today ? "Reserve a visit today" : "Reserve a visit on " + name; }
    pop();
  };

  rows.forEach((r) => {
    r.setAttribute("role", "button"); r.setAttribute("tabindex", "0"); r.setAttribute("aria-pressed", "false");
    r.addEventListener("click", () => select(r));
    r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(r); } });
  });
  /* click the circle to go back to the live status */
  clock.style.cursor = "pointer";
  clock.setAttribute("title", "Show the live status");
  clock.addEventListener("click", () => { if (list.querySelector(".is-sel")) showLive(); });
})();

/* =========================================================
   MISSION & VISION  --  premium add-on (appended, nothing above was changed)
   Adds decoration, splits text for the entrance, and pointer parallax.
   ========================================================= */
(() => {
  const sec = document.getElementById("a-mv");
  if (!sec) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  document.documentElement.classList.add("am-js");

  const cards = Array.from(sec.querySelectorAll(".am__card"));
  const data = {
    m: { no: "01", icon: "fa-flask", ring: "Safe \u2022 Effective \u2022 Personal \u2022 " },
    v: { no: "02", icon: "fa-eye", ring: "Confident \u2022 Within reach \u2022 Lasting \u2022 " }
  };
  const sparks = [
    ["64%", "22%", "13px", "0s"], ["82%", "48%", "10px", "-1.4s"], ["72%", "76%", "15px", "-2.6s"], ["52%", "12%", "9px", "-3.3s"]
  ];

  cards.forEach((card, ci) => {
    const k = card.classList.contains("am__card--v") ? "v" : "m", d = data[k];

    /* decoration layer */
    const fx = document.createElement("div");
    fx.className = "am__fx"; fx.setAttribute("aria-hidden", "true");
    fx.innerHTML =
      '<i class="am__orb am__orb--1"></i><i class="am__orb am__orb--2"></i>' +
      sparks.map((s) => '<i class="am__sp" style="--x:' + s[0] + ';--y:' + s[1] + ';--s:' + s[2] + ';--dl:' + s[3] + '">\u2726</i>').join("") +
      '<span class="am__no">' + d.no + '</span>' +
      '<span class="am__sheen"></span><span class="am__ring"></span>';
    card.insertBefore(fx, card.querySelector(".am__txt"));

    /* rotating text badge */
    const id = "amArc" + ci;
    const badge = document.createElement("div");
    badge.className = "am__badge"; badge.setAttribute("aria-hidden", "true");
    badge.innerHTML =
      '<svg viewBox="0 0 100 100"><defs><path id="' + id + '" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0"/></defs>' +
      '<text><textPath href="#' + id + '" startOffset="0" textLength="238">' + d.ring + '</textPath></text></svg>' +
      '<i class="fa-solid ' + d.icon + '"></i>';
    card.appendChild(badge);

    /* split heading into letters, paragraph into words (for the staggered entrance) */
    const h = card.querySelector(".am__txt h3"), p = card.querySelector(".am__txt p");
    if (h && !h.querySelector(".l")) {
      const t = h.textContent; h.setAttribute("aria-label", t); h.textContent = "";
      Array.from(t).forEach((ch, i) => {
        const s = document.createElement("span");
        s.className = "l"; s.setAttribute("aria-hidden", "true"); s.style.setProperty("--i", i);
        s.innerHTML = ch === " " ? "&nbsp;" : ch; h.appendChild(s);
      });
    }
    if (p && !p.querySelector(".w")) {
      const words = p.textContent.trim().split(/\s+/); p.textContent = "";
      words.forEach((w, i) => {
        const s = document.createElement("span");
        s.className = "w"; s.style.setProperty("--i", i); s.textContent = w;
        p.appendChild(s); if (i < words.length - 1) p.appendChild(document.createTextNode(" "));
      });
    }

    /* pointer parallax for artwork + outlined number */
    if (fine && !reduce) {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--px", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
        card.style.setProperty("--py", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
      });
      card.addEventListener("pointerleave", () => { card.style.setProperty("--px", 0); card.style.setProperty("--py", 0); });
    }
  });

  /* heading line draws when the section is reached */
  const arrive = () => sec.classList.add("am--in");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { arrive(); io.disconnect(); } }), { threshold: 0.15 });
    io.observe(sec);
  } else arrive();
})();

/* =========================================================
   ABOUT · Inside the clinic — creative animation add-on (appended; nothing above changed)
   Adds: floating sparkles, scroll-driven ghost title, rotating badge, filter chips,
   3D tilt + spotlight tiles, photo parallax, "View" cursor bubble.
   ========================================================= */
(() => {
  "use strict";
  const sec = document.getElementById("a-clinic"), grid = document.getElementById("acGrid");
  if (!sec || !grid) return;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const tiles = $$(".ac__tile", grid), container = $(".container", sec), h2 = $(".title", sec);

  /* sparkles + bubbles */
  const fx = document.createElement("div"); fx.className = "ac__fx"; fx.setAttribute("aria-hidden", "true");
  const sp = [[6, 12, 18], [92, 8, 14], [48, 4, 12], [84, 46, 20], [4, 58, 14], [60, 90, 16], [26, 78, 12], [95, 84, 14]];
  sp.forEach((p, i) => { const e = document.createElement("i"); e.textContent = i % 2 ? "✧" : "✦"; e.style.cssText = `--x:${p[0]}%;--y:${p[1]}%;--s:${p[2]}px;--dl:${-i * 0.9}s`; fx.appendChild(e); });
  [[14, 30, 18, 11], [70, 20, 26, 14], [38, 64, 14, 10], [88, 66, 22, 13], [20, 92, 20, 12]].forEach((p, i) => { const e = document.createElement("i"); e.className = "b"; e.style.cssText = `--x:${p[0]}%;--y:${p[1]}%;--s:${p[2]}px;--d:${p[3]}s;--dl:${-i * 2.2}s`; fx.appendChild(e); });
  sec.insertBefore(fx, sec.firstChild);

  /* heading block: title + lead + badge + chips */
  if (h2 && container) {
    const top = document.createElement("div"); top.className = "ac__top";
    const left = document.createElement("div");
    h2.parentNode.insertBefore(top, h2); left.appendChild(h2); top.appendChild(left);
    const line = document.createElement("span"); line.className = "ac__title-line"; left.appendChild(line);
    const lead = document.createElement("p"); lead.className = "ac__lead";
    lead.textContent = "Calm rooms, soft light and spaces designed so every visit feels unhurried. Tap any photo to look closer."; left.appendChild(lead);
    const badge = document.createElement("div"); badge.className = "ac__badge"; badge.setAttribute("aria-hidden", "true");
    badge.innerHTML = '<svg viewBox="0 0 120 120"><defs><path id="acBadgePath" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0"/></defs><text><textPath href="#acBadgePath">Step inside · Step inside · Step inside ·</textPath></text></svg><i class="fa-solid fa-camera"></i>';
    top.appendChild(badge);
    const ghost = document.createElement("div"); ghost.className = "ac__ghost"; ghost.setAttribute("aria-hidden", "true"); ghost.textContent = "Inside · Inside · Inside"; container.insertBefore(ghost, container.firstChild);

    /* filter chips (dims the other photos, keeps layout + lightbox intact) */
    const cats = [["all", "All"], ["Clinic interiors", "Interiors"], ["Consultation spaces", "Consultation"], ["Treatment rooms", "Treatment"], ["Skincare products", "Products"]];
    const chips = document.createElement("div"); chips.className = "ac__chips"; chips.setAttribute("role", "group"); chips.setAttribute("aria-label", "Filter clinic photos");
    cats.forEach(([key, label], i) => {
      const n = key === "all" ? tiles.length : tiles.filter((t) => ($("figcaption", t) || {}).textContent === key).length;
      const b = document.createElement("button"); b.type = "button"; b.className = "ac__chip" + (i === 0 ? " is-on" : ""); b.dataset.k = key; b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.innerHTML = label + "<small>" + n + "</small>"; chips.appendChild(b);
    });
    left.appendChild(chips);
    chips.addEventListener("click", (e) => {
      const b = e.target.closest(".ac__chip"); if (!b) return;
      $$(".ac__chip", chips).forEach((c) => { const on = c === b; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      let k = 0;
      tiles.forEach((t) => {
        const match = b.dataset.k === "all" || ($("figcaption", t) || {}).textContent === b.dataset.k;
        t.classList.remove("is-pop"); t.classList.toggle("is-dim", !match);
        if (match) { t.style.setProperty("--k", k++); void t.offsetWidth; t.classList.add("is-pop"); }
      });
    });
  }

  /* tile decoration */
  tiles.forEach((t, i) => {
    const r = document.createElement("span"); r.className = "ac__ring"; r.setAttribute("aria-hidden", "true");
    const n = document.createElement("b"); n.className = "ac__no"; n.setAttribute("aria-hidden", "true"); n.textContent = String(i + 1).padStart(2, "0");
    const z = document.createElement("i"); z.className = "ac__zoom fa-solid fa-expand"; z.setAttribute("aria-hidden", "true");
    t.append(r, n, z);
  });
  if (reduce) return;

  /* pointer: tilt + spotlight + cursor bubble */
  if (fine) {
    const cur = document.createElement("div"); cur.className = "ac__cur"; cur.setAttribute("aria-hidden", "true"); cur.textContent = "View"; document.body.appendChild(cur);
    let cx = 0, cy = 0, raf = 0;
    const move = () => { raf = 0; cur.style.setProperty("--cx", cx + "px"); cur.style.setProperty("--cy", cy + "px"); };
    tiles.forEach((t) => {
      t.addEventListener("pointermove", (e) => {
        const b = t.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
        t.style.setProperty("--ry", ((px - 0.5) * 9).toFixed(2) + "deg"); t.style.setProperty("--rx", ((0.5 - py) * 9).toFixed(2) + "deg");
        t.style.setProperty("--mx", (px * 100).toFixed(1) + "%"); t.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        cx = e.clientX; cy = e.clientY; if (!raf) raf = requestAnimationFrame(move);
      });
      t.addEventListener("pointerenter", (e) => { cx = e.clientX; cy = e.clientY; move(); cur.classList.add("is-on"); });
      t.addEventListener("pointerleave", () => { t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); cur.classList.remove("is-on"); });
    });
  }

  /* scroll: ghost title slides, photos drift inside their frames */
  const ghost = $(".ac__ghost", sec), imgs = tiles.map((t) => $("img", t));
  let tick = false;
  const upd = () => {
    tick = false;
    const r = sec.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -100 || r.top > vh + 100) return;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    if (ghost) ghost.style.setProperty("--gx", (-p * 22 + 4).toFixed(1) + "vw");
    tiles.forEach((t, i) => {
      const b = t.getBoundingClientRect(); if (b.bottom < 0 || b.top > vh) return;
      const q = (b.top + b.height / 2) / vh - 0.5;
      imgs[i].style.setProperty("--py", (q * -14).toFixed(1) + "px");
    });
  };
  window.addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  window.addEventListener("resize", upd); upd();
})();


/* =========================================================
   ABOUT · Inside the clinic — clicking a photo ("View") opens 404.html (appended; nothing above changed)
   Runs in the capture phase, so it takes over before the lightbox click handler.
   To bring the lightbox back, delete this block (or set VIEW_URL to "").
   ========================================================= */
(() => {
  "use strict";
  const VIEW_URL = "404.html";
  const grid = document.getElementById("acGrid");
  if (!grid || !VIEW_URL) return;
  const go = (e) => { e.preventDefault(); e.stopPropagation(); window.location.href = VIEW_URL; };
  grid.addEventListener("click", (e) => { if (e.target.closest(".ac__tile")) go(e); }, true);
  grid.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.closest(".ac__tile")) go(e);
  }, true);
})();


/* =========================================================
   ABOUT · Hero centre space add-on (appended; nothing above changed)
   Small floating details: a rotating seal, one chip and three droplets.
   ========================================================= */
(() => {
  "use strict";
  const copy = document.querySelector("#a-hero .ah__copy");
  if (!copy || copy.querySelector(".ah__mid")) return;
  const mid = document.createElement("div");
  mid.className = "ah__mid"; mid.setAttribute("aria-hidden", "true");
  mid.innerHTML =
    '<span class="ah__dp" style="--x:38%;--y:6%;--s:12px;--d:6s"></span>' +
    '<span class="ah__dp" style="--x:58%;--y:58%;--s:9px;--d:7s;--dl:-2s"></span>' +
    '<span class="ah__dp" style="--x:30%;--y:78%;--s:14px;--d:8s;--dl:-4s"></span>' +
    '<span class="ah__chip"><i class="fa-solid fa-user-doctor"></i> Dermatologist-led</span>' +
    '<span class="ah__seal"><svg viewBox="0 0 120 120"><defs><path id="ahSealPath" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0"/></defs><text><textPath href="#ahSealPath">Gentle · Clinical · Personal ·</textPath></text></svg><i class="fa-solid fa-droplet"></i></span>';
  copy.appendChild(mid);
})();

/* =========================================================
   BOOKING FORM add-on (appended; nothing above changed)
   - Clicking "Request Appointment" with anything missing shows the message inside the field
     (placeholder style) or under it, highlights it and focuses the first problem.
   - When everything is valid the form is cleared and the page goes to 404.html.
   - Coming back to this page always shows an empty form.
   Runs in the capture phase, so it replaces the older submit handlers for this form.
   ========================================================= */
(() => {
  "use strict";
  const form = document.getElementById("bookForm");
  if (!form) return;
  const $ = (s, c = form) => c.querySelector(s);
  const $$ = (s, c = form) => Array.from(c.querySelectorAll(s));

  const treat = $("#fTreat"), nameEl = $("#fName"), emailEl = $("#fEmail"), status = $("#formStatus"), btn = $(".form__submit");
  const treatBox = $(".bk__treat"), slotSet = $(".bk__slots");
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const REDIRECT = "404.html";

  /* stop the browser from refilling the form when you press Back */
  form.setAttribute("autocomplete", "off");
  $$("input, textarea").forEach((el) => el.setAttribute("autocomplete", "off"));

  /* ---------- message helpers ---------- */
  function setMsg(host, text) {
    let m = host.querySelector(":scope > .bk__err");
    if (!text) { if (m) m.remove(); return; }
    if (!m) { m = document.createElement("p"); m.className = "bk__err"; m.setAttribute("role", "alert"); host.appendChild(m); }
    m.textContent = text;
  }
  function labelMsg(input, text) {            /* the floating label doubles as the placeholder */
    const lb = input.closest(".field").querySelector("label");
    if (!lb) return;
    if (!lb.dataset.orig) lb.dataset.orig = lb.textContent;
    lb.textContent = text === null ? lb.dataset.orig : text;
  }
  function clearField(input) {
    const f = input.closest(".field"); f.classList.remove("is-error");
    labelMsg(input, null); setMsg(f, "");
  }
  function clearTreat() { treatBox.classList.remove("is-error"); setMsg(treatBox, ""); }
  function clearSlot() { slotSet.classList.remove("is-error"); setMsg(slotSet, ""); }
  function clearAll() {
    clearField(nameEl); clearField(emailEl); clearTreat(); clearSlot();
    status.textContent = ""; status.className = "form__status";
  }

  /* ---------- full reset (fields, chips, time slots, messages) ---------- */
  function resetAll() {
    form.reset();
    clearAll();
    $$(".bk__chip").forEach((c) => c.setAttribute("aria-checked", "false"));
    if (treat) treat.selectedIndex = 0;
    if (btn && btn.dataset.label) { btn.innerHTML = btn.dataset.label; btn.disabled = false; }
  }

  /* ---------- validation ---------- */
  function validate() {
    clearAll();
    const bad = [];
    if (!treat.value) {
      treatBox.classList.add("is-error"); setMsg(treatBox, "Please choose the treatment you would like to book.");
      bad.push(() => ($(".bk__chip") || treat).focus());
    }
    if (!$('input[name="slot"]:checked')) {
      slotSet.classList.add("is-error"); setMsg(slotSet, "Please pick a time that suits you.");
      bad.push(() => $('input[name="slot"]').focus());
    }
    const n = nameEl.value.trim();
    if (n.length < 2) {
      nameEl.closest(".field").classList.add("is-error");
      if (!n) labelMsg(nameEl, "Please enter your full name"); else setMsg(nameEl.closest(".field"), "Please enter your full name (at least 2 letters).");
      bad.push(() => nameEl.focus());
    }
    const em = emailEl.value.trim();
    if (!emailOk(em)) {
      emailEl.closest(".field").classList.add("is-error");
      if (!em) labelMsg(emailEl, "Please enter your email address"); else setMsg(emailEl.closest(".field"), "Please enter a valid email, for example name@example.com");
      bad.push(() => emailEl.focus());
    }
    return bad;
  }

  /* capture phase on the document = runs before every other submit handler on this form */
  document.addEventListener("submit", (e) => {
    if (e.target !== form) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const bad = validate();
    if (bad.length) {
      status.textContent = "Please fill in the highlighted fields.";
      status.className = "form__status is-err";
      form.classList.remove("is-shake"); void form.offsetWidth; form.classList.add("is-shake");
      bad[0]();
      return;
    }
    if (btn) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...'; }
    setTimeout(() => { resetAll(); window.location.href = REDIRECT; }, 450);
  }, true);

  /* remove a message as soon as that field is corrected */
  form.addEventListener("input", (e) => {
    if (e.target === nameEl) clearField(nameEl);
    else if (e.target === emailEl) clearField(emailEl);
    else if (e.target === treat) clearTreat();
  });
  form.addEventListener("change", (e) => { if (e.target.name === "slot") clearSlot(); });
  form.addEventListener("animationend", (e) => { if (e.target === form) form.classList.remove("is-shake"); });

  /* ---------- always empty when you come back ---------- */
  window.addEventListener("pagehide", resetAll);
  window.addEventListener("pageshow", () => { resetAll(); setTimeout(resetAll, 120); });
  window.addEventListener("load", () => setTimeout(resetAll, 150));
  resetAll();
})();