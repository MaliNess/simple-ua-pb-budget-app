(() => {
  "use strict";

  const Core = globalThis.BudgetBoardCore || (typeof require === "function" ? require("./budget-core.js") : null);
  if (!Core) throw new Error("BudgetBoardCore must be loaded before budget-tickets.js.");
  const { isFiniteNumber, normalizeCurrency, parseDateForSort } = Core;

  function normalizeLabel(label, labels) {
    return labels.includes(label) ? label : "none";
  }

  function getColumnSortMode(column, sortModes, defaultSortMode) {
    return sortModes[column?.sortMode] ? column.sortMode : defaultSortMode;
  }

  function getCollapsedLabels(column, labels) {
    return Array.isArray(column?.collapsedLabels) ? column.collapsedLabels.filter(label => labels.includes(label)) : [];
  }

  function getSortedColumnExpenses(column, expenses, options) {
    const sortMode = getColumnSortMode(column, options.sortModes, options.defaultSortMode);
    const labelOrder = options.sortModes[sortMode].order;
    const orderIndex = new Map(labelOrder.map((label, index) => [label, index]));
    return [...expenses].sort((a, b) => {
      const byLabel = orderIndex.get(normalizeLabel(a.label, options.labels)) - orderIndex.get(normalizeLabel(b.label, options.labels));
      if (byLabel !== 0) return byLabel;
      const dateDiff = parseDateForSort(b.date) - parseDateForSort(a.date);
      if (dateDiff !== 0) return dateDiff;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }

  function applyColumnSort(column, expenses, mode, options) {
    if (!column || !options.sortModes[mode]) return false;
    column.sortMode = mode;
    const items = getSortedColumnExpenses(column, expenses, options);
    items.forEach((expense, index) => { expense.order = index; });
    return true;
  }

  function toggleExpenseLabel(expense, label, labels) {
    if (!expense || !labels.includes(label) || label === "none") return false;
    expense.label = expense.label === label ? "none" : label;
    return true;
  }

  function applyBulkLabel(expenses, label, labels) {
    if (!labels.includes(label) || label === "none") return 0;
    let changed = 0;
    expenses.forEach(expense => {
      if (normalizeLabel(expense.label, labels) !== "none") return;
      expense.label = label;
      changed += 1;
    });
    return changed;
  }

  function groupCurrency(expenses, amountKey, currencyKey) {
    const map = new Map();
    for (const expense of expenses) {
      const amount = expense[amountKey];
      if (!isFiniteNumber(amount)) continue;
      const currency = normalizeCurrency(expense[currencyKey]) || "\u2014";
      map.set(currency, (map.get(currency) || 0) + amount);
    }
    return [...map.entries()].map(([currency, amount]) => ({ currency, amount }));
  }

  function buildLabelStats(expenses, transactionSums, labels) {
    const totals = new Map(transactionSums.map(item => [item.currency, item.amount]));
    const grouped = new Map();

    for (const expense of expenses) {
      if (!labels.includes(expense.label) || expense.label === "none" || !isFiniteNumber(expense.amount)) continue;
      const currency = normalizeCurrency(expense.currency) || "\u2014";
      const key = `${expense.label}|${currency}`;
      grouped.set(key, (grouped.get(key) || 0) + expense.amount);
    }

    const result = [];
    for (const label of labels.filter(item => item !== "none")) {
      for (const [key, amount] of grouped.entries()) {
        const [keyLabel, currency] = key.split("|");
        if (keyLabel !== label) continue;
        const total = totals.get(currency) || 0;
        result.push({ label, currency, amount, percentage: total ? amount / total * 100 : 0 });
      }
    }
    return result;
  }

  const api = Object.freeze({
    applyBulkLabel,
    applyColumnSort,
    buildLabelStats,
    getCollapsedLabels,
    getColumnSortMode,
    getSortedColumnExpenses,
    groupCurrency,
    normalizeLabel,
    toggleExpenseLabel
  });

  if (typeof window !== "undefined") window.BudgetBoardTickets = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
