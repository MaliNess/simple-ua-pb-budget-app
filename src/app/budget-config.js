(() => {
  "use strict";

  const api = Object.freeze({
    ADD_CURRENCY_VALUE: "__add_currency__",
    CATEGORY_CHART_COLORS: ["#4f46e5", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"],
    DEFAULT_CURRENCIES: ["UAH", "EUR", "USD"],
    DEFAULT_SORT_MODE: "green-first",
    LABELS: ["none", "blue", "green", "yellow", "red"],
    LABEL_TITLES: { none: "Unlabelled", blue: "Service", green: "Green", yellow: "Yellow", red: "Red" },
    PALETTE: ["#64748b", "#ff6b1a", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444"],
    SORT_MODES: {
      "unlabelled-first": { label: "Unlabelled first", order: ["none", "blue", "green", "yellow", "red"] },
      "green-first": { label: "Green first", order: ["green", "yellow", "red", "blue", "none"] },
      "red-first": { label: "Red first", order: ["red", "yellow", "green", "blue", "none"] }
    },
    STATE_VERSION: 11,
    STORAGE_KEY: "budgetBoardState.v1"
  });

  if (typeof window !== "undefined") window.BudgetBoardConfig = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
