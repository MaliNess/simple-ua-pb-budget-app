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

  const ACTION_ICONS = {
    add: {
      viewBox: "0 0 20 20",
      body: '<path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>'
    },
    chevronDown: {
      viewBox: "0 0 20 20",
      body: '<path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    close: {
      viewBox: "0 0 20 20",
      body: '<path d="m6 6 8 8M14 6l-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>'
    },
    clock: {
      viewBox: "0 0 20 20",
      body: '<path d="M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3.25V10l2.45 1.45" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    deleteLeft: {
      viewBox: "0 0 24 24",
      body: '<path d="M20 5H9.8a2 2 0 0 0-1.5.68L3 12l5.3 6.32A2 2 0 0 0 9.8 19H20a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path><path d="m17 9.25-5.5 5.5m0-5.5 5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>'
    },
    deleteLeftFilled: {
      viewBox: "0 0 576 512",
      body: '<path fill="currentColor" d="M576 128c0-35.3-28.7-64-64-64L205.3 64c-17 0-33.3 6.7-45.3 18.7L9.4 233.4c-6 6-9.4 14.1-9.4 22.6s3.4 16.6 9.4 22.6L160 429.3c12 12 28.3 18.7 45.3 18.7L512 448c35.3 0 64-28.7 64-64l0-256zM271 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"></path>'
    },
    download: {
      viewBox: "0 0 20 20",
      body: '<path d="M10 3.5v8m0 0 3.25-3.25M10 11.5 6.75 8.25M4 15.5h12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    edit: {
      viewBox: "0 0 20 20",
      body: '<path d="m4 13.75-.6 2.85 2.85-.6 8.55-8.55a1.55 1.55 0 0 0 0-2.2l-.05-.05a1.55 1.55 0 0 0-2.2 0L4 13.75Zm7.5-7.5 2.25 2.25" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    foldLeft: {
      viewBox: "0 0 20 20",
      body: '<path d="M5 4.5v11M14.5 5.5 9.5 10l5 4.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    goal: {
      viewBox: "0 0 20 20",
      body: '<path d="M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0 2.4a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" fill="none" stroke="currentColor" stroke-width="1.35"></path>'
    },
    grip: {
      viewBox: "0 0 20 20",
      body: '<path d="M7 5.5h.01M13 5.5h.01M7 10h.01M13 10h.01M7 14.5h.01M13 14.5h.01" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"></path>'
    },
    merge: {
      viewBox: "0 0 20 20",
      body: '<path d="M7.5 5 4 8.5 7.5 12M4 8.5h8a4 4 0 0 1 0 8h-1.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    moveRight: {
      viewBox: "0 0 20 20",
      body: '<path d="M4 5.5h5.5M4 14.5h5.5M9 10h7m0 0-3-3m3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    planned: {
      viewBox: "0 0 20 20",
      body: '<path d="M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3.25V10l2.45 1.45" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    restore: {
      viewBox: "0 0 512 512",
      body: '<path fill="currentColor" d="M125.7 160l50.3 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L48 224c-17.7 0-32-14.3-32-32L16 64c0-17.7 14.3-32 32-32s32 14.3 32 32l0 51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0L125.7 160z"></path>'
    },
    sort: {
      viewBox: "0 0 20 20",
      body: '<path d="M7 4v12m0 0-2.5-2.5M7 16l2.5-2.5M13 16V4m0 0-2.5 2.5M13 4l2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    split: {
      viewBox: "0 0 24 24",
      body: '<circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle><path d="M8.12 8.12 12 12M20 4 8.12 15.88" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle><path d="M14.8 14.8 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    summary: {
      viewBox: "0 0 20 20",
      body: '<path d="M10 3.5a6.5 6.5 0 1 0 6.5 6.5H10V3.5Z" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12.5 3.95A6.54 6.54 0 0 1 16.05 7.5H12.5V3.95Z" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    trash: {
      viewBox: "0 0 20 20",
      body: '<path d="M7 4h6m-8 3h10m-8 0 .5 9h5l.5-9M8.5 4l.5-1h2l.5 1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>'
    },
    upload: {
      viewBox: "0 0 20 20",
      body: '<path d="M10 16.5v-8m0 0-3.25 3.25M10 8.5l3.25 3.25M4 4.5h12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>'
    }
  };

  function renderActionIcon(name, className = "") {
    const icon = ACTION_ICONS[name] || ACTION_ICONS.summary;
    const classes = ["action-icon", className].filter(Boolean).join(" ");
    return `<svg class="${escapeHtml(classes)}" viewBox="${icon.viewBox}" aria-hidden="true" focusable="false">${icon.body}</svg>`;
  }

  function renderDeleteIcon() {
    return renderActionIcon("trash", "action-icon-trash");
  }

  function renderTicketMetaIcon(type) {
    const icons = {
      date: '<path d="M5 3.5v2m6-2v2M3.5 7h10M4 4.5h9a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm2.25 5h.01m2.49 0h.01m2.49 0h.01m-5.01 2.5h.01m2.49 0h.01m2.49 0h.01" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"></path>',
      card: '<path d="M3 5.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Zm-.5 3h12M4.5 11h3" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"></path>',
      category: '<path d="M7.25 3.5h-3.5v3.5l6.75 6.75a1.25 1.25 0 0 0 1.77 0l1.73-1.73a1.25 1.25 0 0 0 0-1.77L7.25 3.5Zm-1.5 2h.01" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"></path>'
    };
    return `
      <svg class="meta-icon" viewBox="0 0 17 17" aria-hidden="true" focusable="false">
        ${icons[type] || icons.category}
      </svg>
    `;
  }

  const api = Object.freeze({
    capitalize,
    clearInvalidFields,
    cssEscape,
    downloadBlob,
    escapeHtml,
    openDialog,
    pluralize,
    renderActionIcon,
    renderDeleteIcon,
    renderTicketMetaIcon,
    showToast
  });

  if (typeof window !== "undefined") window.BudgetBoardUi = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
