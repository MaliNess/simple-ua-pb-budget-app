(() => {
  "use strict";

  function createPlanningDialogCore(deps) {
    const {
      getState,
      Planning,
      isPlanMatched,
      getMatchedExpenseIds,
      setMatchedExpenseIds,
      planHasExpense,
      windowConfirm,
      syncPlanClosedStateCore,
      getPlanRemainingPricesCore
    } = deps;

    const state = new Proxy({}, {
      get(_target, property) { return getState()[property]; },
      set(_target, property, value) { getState()[property] = value; return true; }
    });

    function getColumnPlans(columnId) {
      return state.plannedExpenses
        .filter(plan => plan.columnId === columnId)
        .sort((a, b) => {
          const byMatch = Number(isPlanMatched(a)) - Number(isPlanMatched(b));
          if (byMatch !== 0) return byMatch;
          return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
        });
    }

    function buildAllPlannedCurrencyTotals(plans) {
      return Planning.buildAllPlannedCurrencyTotals(plans, state.expenses);
    }

    function getPlanRemainingPrices(plan, actuals = getMatchedExpenses(plan)) {
      return getPlanRemainingPricesCore(plan, actuals);
    }

    function getColumnRemainingPlannedSums(columnId) {
      return Planning.getColumnRemainingPlannedSums(state.plannedExpenses, state.expenses, columnId);
    }

    function getMatchedExpenses(plan) {
      return Planning.getMatchedExpenses(plan, state.expenses);
    }

    function syncPlanClosedState(plan, actuals = getMatchedExpenses(plan)) {
      return syncPlanClosedStateCore(plan, actuals);
    }

    function syncAllPlanClosedStates() {
      if (!state || !Array.isArray(state.plannedExpenses)) return;
      Planning.syncAllPlanClosedStates(state.plannedExpenses, state.expenses);
    }

    function clearPlanMatchForExpense(expenseId) {
      state.plannedExpenses.forEach(plan => {
        if (!planHasExpense(plan, expenseId)) return;
        setMatchedExpenseIds(plan, getMatchedExpenseIds(plan).filter(id => id !== expenseId));
        reconcilePlanClosedAfterDeletion(plan);
        plan.updatedAt = new Date().toISOString();
      });
    }

    function reconcilePlanClosedAfterDeletion(plan) {
      Planning.reconcilePlanClosedAfterDeletion(plan, state.expenses);
    }

    function getMatchedPlanForExpense(expenseId) {
      return Planning.getMatchedPlanForExpense(state.plannedExpenses, expenseId);
    }

    function confirmAndUnmatchExpenseForColumnMove(expense, targetColumnId) {
      if (!expense || expense.columnId === targetColumnId) return true;
      const plan = getMatchedPlanForExpense(expense.id);
      if (!plan) return true;

      const targetColumn = state.columns.find(column => column.id === targetColumnId);
      const confirmed = windowConfirm(
        `"${expense.description}" is matched to planned expense "${plan.description}". ` +
        `Moving it to "${targetColumn?.title || "another column"}" will unmatch it and recalculate the planned expense. Continue?`
      );
      if (!confirmed) return false;

      clearPlanMatchForExpense(expense.id);
      return true;
    }

    return Object.freeze({
      buildAllPlannedCurrencyTotals,
      clearPlanMatchForExpense,
      confirmAndUnmatchExpenseForColumnMove,
      getColumnPlans,
      getColumnRemainingPlannedSums,
      getMatchedExpenses,
      getMatchedPlanForExpense,
      getPlanRemainingPrices,
      reconcilePlanClosedAfterDeletion,
      state,
      syncAllPlanClosedStates,
      syncPlanClosedState
    });
  }

  const api = Object.freeze({ createPlanningDialogCore });

  if (typeof window !== "undefined") window.BudgetBoardPlanningDialogCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
