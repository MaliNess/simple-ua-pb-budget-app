(() => {
  "use strict";

  const Core = globalThis.BudgetBoardCore || (typeof require === "function" ? require("../core/budget-core.js") : null);
  if (!Core) throw new Error("BudgetBoardCore must be loaded before budget-planning.js.");
  const {
    getCombinedActualAmountForCurrency,
    getMatchedExpenseIds,
    getPlanRemainingPrices,
    getPlannedPrices,
    isFiniteNumber,
    isPlanPrimaryCovered,
    planHasExpense,
    syncPlanClosedState
  } = Core;

  function getMatchedExpenses(plan, expenses) {
    const ids = new Set(getMatchedExpenseIds(plan));
    return expenses.filter(expense => ids.has(expense.id));
  }

  function getMatchedPlanForExpense(plans, expenseId) {
    return plans.find(plan => planHasExpense(plan, expenseId)) || null;
  }

  function getColumnRemainingPlannedSums(plans, expenses, columnId) {
    const totals = new Map();
    plans
      .filter(plan => plan.columnId === columnId && plan.closed !== true)
      .forEach(plan => {
        getPlanRemainingPrices(plan, getMatchedExpenses(plan, expenses)).forEach(price => {
          totals.set(price.currency, (totals.get(price.currency) || 0) + price.amount);
        });
      });
    return [...totals.entries()]
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }

  function buildAllPlannedCurrencyTotals(plans, expenses) {
    const totals = new Map();
    plans.forEach(plan => {
      const actuals = getMatchedExpenses(plan, expenses);
      getPlannedPrices(plan).forEach(price => {
        const current = totals.get(price.currency) || { currency: price.currency, expected: 0, actual: 0, remaining: 0, planIds: new Set() };
        const actualAmount = getCombinedActualAmountForCurrency(actuals, price.currency);
        current.expected += price.amount;
        current.actual += isFiniteNumber(actualAmount) ? actualAmount : 0;
        if (plan.closed !== true) current.remaining += Math.max(price.amount - (isFiniteNumber(actualAmount) ? actualAmount : 0), 0);
        current.planIds.add(plan.id);
        totals.set(price.currency, current);
      });
    });
    return [...totals.values()].map(item => ({
      currency: item.currency,
      expected: item.expected,
      actual: item.actual,
      remaining: item.remaining,
      planCount: item.planIds.size
    })).sort((a, b) => a.currency.localeCompare(b.currency));
  }

  function reconcilePlanClosedAfterDeletion(plan, expenses) {
    if (!plan) return;
    plan.closed = isPlanPrimaryCovered(plan, getMatchedExpenses(plan, expenses));
  }

  function syncAllPlanClosedStates(plans, expenses) {
    plans.forEach(plan => syncPlanClosedState(plan, getMatchedExpenses(plan, expenses)));
  }

  const api = Object.freeze({
    buildAllPlannedCurrencyTotals,
    getColumnRemainingPlannedSums,
    getMatchedExpenses,
    getMatchedPlanForExpense,
    reconcilePlanClosedAfterDeletion,
    syncAllPlanClosedStates
  });

  if (typeof window !== "undefined") window.BudgetBoardPlanning = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
