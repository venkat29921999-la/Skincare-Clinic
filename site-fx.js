/* =========================================================
   Stackly site effects (every page, no library needed)
   Soft cursor ring that trails the mouse and grows over links / buttons.
   (The page-transition curtain has been removed.)
   ========================================================= */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* clean up the flag the old page transition used to leave behind */
  try { sessionStorage.removeItem("stackly:pt"); } catch (e) {}
  if (!fine || reduce) return;

  const css = document.createElement("style");
  css.textContent = `
.sfx-ring{position:fixed;left:0;top:0;z-index:99998;width:38px;height:38px;margin:-19px 0 0 -19px;border:1.5px solid #fff;border-radius:50%;pointer-events:none;mix-blend-mode:difference;opacity:0;transition:width .35s cubic-bezier(.22,1,.36,1),height .35s cubic-bezier(.22,1,.36,1),margin .35s cubic-bezier(.22,1,.36,1),background-color .3s,opacity .3s}
.sfx-ring.on{opacity:.9}
.sfx-ring.big{width:74px;height:74px;margin:-37px 0 0 -37px;background:rgba(255,255,255,.22)}
.sfx-ring.down{width:26px;height:26px;margin:-13px 0 0 -13px}
.sfx-ring.hide{opacity:0}`;
  document.head.appendChild(css);

  const ring = document.createElement("div");
  ring.className = "sfx-ring";
  ring.setAttribute("aria-hidden", "true");
  document.body.appendChild(ring);

  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false, run = false;
  const loop = () => {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px)";
    if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) requestAnimationFrame(loop); else run = false;
  };
  window.addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; rx = x; ry = y; ring.classList.add("on"); }
    if (!run) { run = true; requestAnimationFrame(loop); }
    const t = e.target.closest ? e.target : null;
    ring.classList.toggle("big", !!(t && t.closest("a, button, [role=button], .btn, summary, label, select")));
    ring.classList.toggle("hide", !!(t && t.closest("input:not([type=checkbox]):not([type=radio]), textarea")));
  }, { passive: true });
  document.addEventListener("mouseleave", () => ring.classList.remove("on"));
  document.addEventListener("mouseenter", () => shown && ring.classList.add("on"));
  window.addEventListener("mousedown", () => ring.classList.add("down"));
  window.addEventListener("mouseup", () => ring.classList.remove("down"));
})();