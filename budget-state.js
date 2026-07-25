(() => {
  "use strict";

  const Core = globalThis.BudgetBoardCore || (typeof require === "function" ? require("./budget-core.js") : null);
  if (!Core) throw new Error("BudgetBoardCore must be loaded before budget-state.js.");
  const {
    cellText,
    isFiniteNumber,
    isHexColor,
    normalizeCurrency,
    nullableNumber
  } = Core;

  function loadState(storage, key, fallbackState, options) {
    try {
      const raw = storage.getItem(key);
      if (!raw) return clone(fallbackState);
      return sanitizeState(JSON.parse(raw), options) || clone(fallbackState);
    } catch (_) {
      return clone(fallbackState);
    }
  }

  function persistState(storage, key, state) {
    storage.setItem(key, JSON.stringify(state));
  }

  function sanitizeState(candidate, options) {
    if (!candidate || !Array.isArray(candidate.columns) || !Array.isArray(candidate.expenses)) return null;

    const ids = new Set();
    const columns = [];
    let hasUnassigned = false;

    for (const raw of candidate.columns) {
      if (!raw || typeof raw.title !== "string") continue;
      let id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : uid();
      if (ids.has(id)) id = uid();
      ids.add(id);
      const locked = id === "unassigned" || raw.locked === true;
      if (id === "unassigned") hasUnassigned = true;
      columns.push({
        id,
        title: raw.title.trim() || "Untitled",
        color: isHexColor(raw.color) ? raw.color.toLowerCase() : "#64748b",
        icon: options.normalizeColumnIcon(raw.icon || options.defaultColumnIcon(id, raw.title)),
        folded: raw.folded === true,
        sortMode: options.sortModes[raw.sortMode] ? raw.sortMode : options.defaultSortMode,
        collapsedLabels: Array.isArray(raw.collapsedLabels) ? [...new Set(raw.collapsedLabels.filter(label => options.labels.includes(label)))] : [],
        goal: sanitizeGoal(raw.goal),
        ...(locked ? { locked: true } : {})
      });
    }

    if (!hasUnassigned) {
      columns.unshift(createUnassignedColumn(options.defaultSortMode));
      ids.add("unassigned");
    } else {
      const index = columns.findIndex(column => column.id === "unassigned");
      columns[index].locked = true;
      if (index > 0) columns.unshift(columns.splice(index, 1)[0]);
    }

    const expenses = candidate.expenses.map((raw, index) => {
      const amount = Number(raw?.amount);
      if (!raw || !Number.isFinite(amount) || typeof raw.description !== "string") return null;
      return {
        id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
        columnId: ids.has(raw.columnId) ? raw.columnId : "unassigned",
        order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : index,
        date: cellText(raw.date),
        card: cellText(raw.card),
        description: raw.description.trim() || "Untitled expense",
        note: cellText(raw.note).slice(0, 2000),
        originalCategory: cellText(raw.originalCategory),
        amount: Math.abs(amount),
        currency: normalizeCurrency(raw.currency),
        initialAmount: nullableNumber(raw.initialAmount),
        initialCurrency: normalizeCurrency(raw.initialCurrency),
        remainingAmount: nullableNumber(raw.remainingAmount),
        remainingCurrency: normalizeCurrency(raw.remainingCurrency),
        label: options.labels.includes(raw.label) ? raw.label : "none",
        splitFromExpenseId: typeof raw.splitFromExpenseId === "string" ? raw.splitFromExpenseId : ""
      };
    }).filter(Boolean);

    const expenseIds = new Set(expenses.map(expense => expense.id));
    expenses.forEach(expense => {
      if (!expense.splitFromExpenseId || expense.splitFromExpenseId === expense.id || !expenseIds.has(expense.splitFromExpenseId)) {
        expense.splitFromExpenseId = "";
      }
    });

    const expenseById = new Map(expenses.map(expense => [expense.id, expense]));
    const usedMatches = new Set();
    const planIds = new Set();
    const rawPlans = Array.isArray(candidate.plannedExpenses) ? candidate.plannedExpenses : [];
    const plannedExpenses = rawPlans.map(raw => {
      const amount1 = Number(raw?.amount1);
      if (!raw || !Number.isFinite(amount1) || typeof raw.description !== "string") return null;
      let id = typeof raw.id === "string" && raw.id ? raw.id : uid();
      if (planIds.has(id)) id = uid();
      planIds.add(id);

      const rawMatchIds = Array.isArray(raw.matchedExpenseIds)
        ? raw.matchedExpenseIds
        : (typeof raw.matchedExpenseId === "string" && raw.matchedExpenseId ? [raw.matchedExpenseId] : []);
      const validUniqueMatchIds = [...new Set(rawMatchIds)]
        .filter(matchId => typeof matchId === "string" && expenseIds.has(matchId) && !usedMatches.has(matchId));
      const rawColumnId = ids.has(raw.columnId) ? raw.columnId : "unassigned";
      const matchedColumnId = validUniqueMatchIds.length ? expenseById.get(validUniqueMatchIds[0])?.columnId : null;
      const columnId = matchedColumnId || rawColumnId;
      const matchedExpenseIds = validUniqueMatchIds.filter(matchId => expenseById.get(matchId)?.columnId === columnId);
      matchedExpenseIds.forEach(matchId => usedMatches.add(matchId));
      const amount2 = nullableNumber(raw.amount2);

      return {
        id,
        columnId,
        description: raw.description.trim() || "Untitled planned expense",
        amount1: Math.abs(amount1),
        currency1: normalizeCurrency(raw.currency1) || "UAH",
        amount2: isFiniteNumber(amount2) ? Math.abs(amount2) : null,
        currency2: isFiniteNumber(amount2) ? (normalizeCurrency(raw.currency2) || "EUR") : "",
        matchedExpenseIds,
        closed: raw.closed === true,
        createdAt: cellText(raw.createdAt) || new Date().toISOString(),
        updatedAt: cellText(raw.updatedAt) || cellText(raw.createdAt) || new Date().toISOString()
      };
    }).filter(Boolean);

    const currencySet = new Set(options.defaultCurrencies);
    const addCurrency = value => {
      const code = normalizeCurrency(value);
      if (code) currencySet.add(code);
    };
    (Array.isArray(candidate.currencies) ? candidate.currencies : []).forEach(addCurrency);
    columns.forEach(column => addCurrency(column.goal?.currency));
    expenses.forEach(expense => {
      addCurrency(expense.currency);
      addCurrency(expense.initialCurrency);
      addCurrency(expense.remainingCurrency);
    });
    plannedExpenses.forEach(plan => {
      addCurrency(plan.currency1);
      addCurrency(plan.currency2);
    });
    const currencies = [
      ...options.defaultCurrencies,
      ...[...currencySet].filter(code => !options.defaultCurrencies.includes(code)).sort((a, b) => a.localeCompare(b))
    ];

    for (const column of columns) normalizeOrdersFor(expenses, column.id);
    return { version: options.stateVersion, currencies, columns, expenses, plannedExpenses };
  }

  function emptyGoal(currency = "UAH") {
    return {
      currency: normalizeCurrency(currency) || "UAH",
      sharePercent: null,
      amountLimit: null
    };
  }

  function sanitizeGoal(raw) {
    const goal = emptyGoal(raw?.currency);
    const sharePercent = nullableNumber(raw?.sharePercent);
    const amountLimit = nullableNumber(raw?.amountLimit);
    goal.sharePercent = isFiniteNumber(sharePercent) && sharePercent >= 0 && sharePercent <= 100 ? sharePercent : null;
    goal.amountLimit = isFiniteNumber(amountLimit) && amountLimit >= 0 ? amountLimit : null;
    return goal;
  }

  function hasActiveGoal(goal) {
    return isFiniteNumber(goal?.sharePercent) || isFiniteNumber(goal?.amountLimit);
  }

  function nextOrder(expenses, columnId) {
    const orders = expenses.filter(item => item.columnId === columnId).map(item => Number(item.order) || 0);
    return orders.length ? Math.max(...orders) + 1 : 0;
  }

  function normalizeOrdersFor(expenses, columnId) {
    expenses
      .filter(item => item.columnId === columnId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((item, index) => { item.order = index; });
  }

  function createUnassignedColumn(defaultSortMode) {
    return {
      id: "unassigned",
      title: "Unassigned",
      color: "#64748b",
      icon: "inbox",
      folded: false,
      locked: true,
      sortMode: defaultSortMode,
      collapsedLabels: [],
      goal: emptyGoal("UAH")
    };
  }

  function uid() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  const api = Object.freeze({
    clone,
    emptyGoal,
    hasActiveGoal,
    loadState,
    nextOrder,
    normalizeOrdersFor,
    persistState,
    sanitizeGoal,
    sanitizeState,
    uid
  });

  if (typeof window !== "undefined") window.BudgetBoardState = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
