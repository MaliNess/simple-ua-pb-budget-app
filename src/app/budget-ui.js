(() => {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssEscape(value) {
    if (globalThis.CSS?.escape) return CSS.escape(String(value));
    return String(value).replace(/(["\\])/g, "\\$1");
  }

  function pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
  }

  function capitalize(value) {
    return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
  }

  function clearInvalidFields(form) {
    form.querySelectorAll(".invalid").forEach(element => element.classList.remove("invalid"));
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function downloadBlob(blob, filename, documentRef = document, urlRef = URL) {
    const url = urlRef.createObjectURL(blob);
    const anchor = documentRef.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    documentRef.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    urlRef.revokeObjectURL(url);
  }

  function showToast(region, message, type = "") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`.trim();
    toast.textContent = message;
    region.appendChild(toast);
    setTimeout(() => toast.remove(), 3600);
  }

  const api = Object.freeze({
    capitalize,
    clearInvalidFields,
    cssEscape,
    downloadBlob,
    escapeHtml,
    openDialog,
    pluralize,
    showToast
  });

  if (typeof window !== "undefined") window.BudgetBoardUi = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
