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
    // Fallbacks, in order: CodeMirror, Monaco's rendered lines, a raw textarea.
    const cm = document.querySelector(".cm-content");
    if (cm?.innerText?.trim()) return { code: cm.innerText, lang: null };

    const lines = document.querySelectorAll(".view-lines .view-line");
    if (lines.length) {
      const code = Array.from(lines).map((l) => l.innerText).join("\n");
      if (code.trim()) return { code, lang: null };
    }

    const ta = document.querySelector("textarea[autocomplete='off']");
    if (ta?.value?.trim()) return { code: ta.value, lang: null };
    return null;
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || e.data?.__ld !== "grab-code") return;
    window.postMessage({ __ld: "code", payload: grab() }, "*");
  });
})();
