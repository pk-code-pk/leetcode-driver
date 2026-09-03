/**
 * Runs in the page's own JS world (the isolated content script can't reach
 * window.monaco). Its only job is to hand the editor's current source back.
 */
(() => {
  function grab() {
    try {
      const models = window.monaco?.editor?.getModels?.() ?? [];
      const m = models.find((x) => (x.getValue?.() ?? "").trim().length > 0);
      if (m) return { code: m.getValue(), lang: m.getLanguageId?.() ?? null };
    } catch {}
    // Fallback: CodeMirror, or whatever text the editor rendered.
    const cm = document.querySelector(".cm-content");
    if (cm?.innerText?.trim()) return { code: cm.innerText, lang: null };
    return null;
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || e.data?.__ld !== "grab-code") return;
    window.postMessage({ __ld: "code", payload: grab() }, "*");
  });
})();
