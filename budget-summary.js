(() => {
  "use strict";

  const Core = globalThis.BudgetBoardCore || (typeof require === "function" ? require("./budget-core.js") : null);
  const Tickets = globalThis.BudgetBoardTickets || (typeof require === "function" ? require("./budget-tickets.js") : null);
  const Planning = globalThis.BudgetBoardPlanning || (typeof require === "function" ? require("./budget-planning.js") : null);
  if (!Core || !Tickets || !Planning) throw new Error("Budget summary dependencies must be loaded before budget-summary.js.");
  const {
    getCombinedActualAmountForCurrency,
    getPlannedPrices,
    isFiniteNumber,
    isPlanMatched,
    normalizeCurrency
  } = Core;
  const { groupCurrency, normalizeLabel } = Tickets;
  const { getMatchedExpenses } = Planning;

  function getAmountForCurrency(expenses, currency) {
    const normalized = normalizeCurrency(currency) || "\u2014";
    return expenses.reduce((sum, expense) => {
      const expenseCurrency = normalizeCurrency(expense.currency) || "\u2014";
      return expenseCurrency === normalized && isFiniteNumber(expense.amount) ? sum + expense.amount : sum;
    }, 0);
  }

  function getCurrencyTotal(groupedTotals, currency) {
    const normalized = normalizeCurrency(currency) || "\u2014";
    return groupedTotals.find(item => item.currency === normalized)?.amount || 0;
  }

  function buildOriginalCategoryStats(expenses, colors) {
    const byCurrency = new Map();
    for (const expense of expenses) {
      if (!isFiniteNumber(expense.amount)) continue;
      const currency = normalizeCurrency(expense.currency) || "\u2014";
      const category = text(expense.originalCategory) || "Uncategorised";
      const categoryMap = byCurrency.get(currency) || new Map();
      categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
      byCurrency.set(currency, categoryMap);
    }

    return [...byCurrency.entries()]
      .map(([currency, categoryMap]) => {
        const allItems = [...categoryMap.entries()]
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount);
        const total = allItems.reduce((sum, item) => sum + item.amount, 0);
        const visible = allItems.slice(0, 7);
        if (allItems.length > 7) {
          visible.push({
            category: "Other",
            amount: allItems.slice(7).reduce((sum, item) => sum + item.amount, 0)
          });
        }
        return {
          currency,
          total,
          items: visible.map((item, index) => ({
            ...item,
            percentage: total ? item.amount / total * 100 : 0,
            color: colors[index % colors.length]
          }))
        };
      })
      .filter(group => group.total > 0)
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }

  function buildPlannedCurrencyStats(plans, expenses) {
    const grouped = new Map();
    for (const plan of plans) {
      const actuals = getMatchedExpenses(plan, expenses);
      for (const price of getPlannedPrices(plan)) {
        const current = grouped.get(price.currency) || {
          currency: price.currency,
          totalExpected: 0,
          matchedExpected: 0,
          matchedActual: 0,
          comparableExpected: 0,
          comparableCount: 0
        };
        current.totalExpected += price.amount;
        if (actuals.length) {
          current.matchedExpected += price.amount;
          const actualAmount = getCombinedActualAmountForCurrency(actuals, price.currency);
          if (isFiniteNumber(actualAmount)) {
            current.matchedActual += actualAmount;
            current.comparableExpected += price.amount;
            current.comparableCount += 1;
          }
        }
        grouped.set(price.currency, current);
      }
    }
    return [...grouped.values()].map(item => ({
      ...item,
      difference: item.matchedActual - item.comparableExpected
    })).sort((a, b) => a.currency.localeCompare(b.currency));
  }

  function buildCategoryBreakdown(columns, expenses, boardTotals, options = {}) {
    const boardMap = new Map(boardTotals.map(item => [item.currency, item.amount]));
    const boardCurrencies = boardTotals.map(item => item.currency);
    const rows = [];
    const getColumnGoal = typeof options.getColumnGoal === "function" ? options.getColumnGoal : column => column.goal || {};
    const hasActiveGoal = typeof options.hasActiveGoal === "function"
      ? options.hasActiveGoal
      : goal => isFiniteNumber(goal?.sharePercent) || isFiniteNumber(goal?.amountLimit);

    columns.forEach(column => {
      const columnExpenses = expenses.filter(expense => expense.columnId === column.id);
      const sums = groupCurrency(columnExpenses, "amount", "currency");
      const currencies = new Set(sums.map(item => item.currency));
      const goal = getColumnGoal(column);
      if (hasActiveGoal(goal)) currencies.add(goal.currency);
      if (!currencies.size && boardCurrencies.length === 1) currencies.add(boardCurrencies[0]);

      currencies.forEach(currency => {
        const amount = getAmountForCurrency(columnExpenses, currency);
        const boardTotal = boardMap.get(currency) || 0;
        rows.push({
          column,
          currency,
          amount,
          share: boardTotal ? amount / boardTotal * 100 : 0,
          count: columnExpenses.filter(expense => (normalizeCurrency(expense.currency) || "\u2014") === currency).length
        });
      });
    });

    return rows.sort((a, b) => {
      const currencyCompare = a.currency.localeCompare(b.currency);
      if (currencyCompare !== 0) return currencyCompare;
      return b.amount - a.amount;
    });
  }

  function buildBoardLabelStats(expenses, boardTotals, labels) {
    const totals = new Map(boardTotals.map(item => [item.currency, item.amount]));
    const grouped = new Map();
    expenses.forEach(expense => {
      const label = normalizeLabel(expense.label, labels);
      const currency = normalizeCurrency(expense.currency) || "\u2014";
      const key = `${label}|${currency}`;
      const current = grouped.get(key) || { label, currency, amount: 0, count: 0 };
      current.amount += expense.amount || 0;
      current.count += 1;
      grouped.set(key, current);
    });

    const order = new Map(labels.map((label, index) => [label, index]));
    return [...grouped.values()].map(item => ({
      ...item,
      percentage: totals.get(item.currency) ? item.amount / totals.get(item.currency) * 100 : 0
    })).sort((a, b) => {
      const byCurrency = a.currency.localeCompare(b.currency);
      return byCurrency || order.get(a.label) - order.get(b.label);
    });
  }

  function buildSummaryCounts(expenses, plans) {
    const matchedActualIds = new Set(plans.flatMap(plan => Core.getMatchedExpenseIds(plan)));
    const matchedActualCount = matchedActualIds.size;
    const plannedCount = plans.length;
    const matchedPlannedCount = plans.filter(isPlanMatched).length;
    return {
      plannedCount,
      matchedPlannedCount,
      unmatchedPlannedCount: plannedCount - matchedPlannedCount,
      openPlannedCount: plans.filter(plan => plan.closed !== true).length,
      closedPlannedCount: plans.filter(plan => plan.closed === true).length,
      matchedActualCount,
      unmatchedActualCount: Math.max(expenses.length - matchedActualCount, 0),
      matchedActualRate: expenses.length ? matchedActualCount / expenses.length * 100 : 0
    };
  }

  function text(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  const api = Object.freeze({
    buildBoardLabelStats,
    buildCategoryBreakdown,
    buildOriginalCategoryStats,
    buildPlannedCurrencyStats,
    buildSummaryCounts,
    getAmountForCurrency,
    getCurrencyTotal
  });

  if (typeof window !== "undefined") window.BudgetBoardSummary = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
