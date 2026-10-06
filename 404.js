(() => {
  const $ = s => document.querySelector(s);

  /* ---- buttons ---- */
  $("#back").addEventListener("click", () => {
    if (history.length > 1 && document.referrer) history.back();
    else location.href = "index.html";
  });

  /* ---- show the missing address ---- */
  const pathEl = $("#path");
  try {
    const p = decodeURIComponent(location.pathname + location.search);
    if (p && p !== "/" && !/404\.html$/.test(p)) { pathEl.textContent = "Not found: " + p; pathEl.hidden = false; }
  } catch (e) {}

  /* ---- a different friendly line each visit ---- */
  const lines = [
    "We couldn't find the page you were looking for. It may have moved, or the link may have a typo.",
    "This page is off for a facial and won't be back soon. Let's get you somewhere that's open.",
    "Even the best skin has a blemish now and then. This link is ours. Let's get you back on track."
  ];
  $("#lead").textContent = lines[Math.floor(Math.random() * lines.length)];
})();