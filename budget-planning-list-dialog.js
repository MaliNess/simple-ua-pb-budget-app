(() => {
  "use strict";

  function createPlanningListDialog(deps) {
    const {
      els,
      core,
      renderer,
      getState,
      isPlanMatched,
      getMatchedExpenseIds,
      formatPercent,
      openDialog,
      showToast,
      persistState,
      renderBoard,
      navigateToExpense,
      pluralize,
      openPlannedEditDialog,
      openPlannedMatchDialog,
      windowConfirm
    } = deps;
    const state = core.state || new Proxy({}, {
      get(_target, property) { return getState()[property]; },
      set(_target, property, value) { getState()[property] = value; return true; }
    });

    function openPlannedDialog(columnId) {
      const column = state.columns.find(item => item.id === columnId);
      if (!column) return;
      els.plannedColumnId.value = column.id;
      els.plannedDialogTitle.textContent = `Planned expenses · ${column.title}`;
      renderPlannedDialogContent();
      openDialog(els.plannedDialog);
    }

    function renderPlannedDialogContent() {
      const columnId = els.plannedColumnId.value;
      const column = state.columns.find(item => item.id === columnId);
      if (!column) return;
      const plans = core.getColumnPlans(columnId);
      const matched = plans.filter(isPlanMatched).length;
      const unmatched = plans.length - matched;
      const closed = plans.filter(plan => plan.closed === true).length;
      const open = plans.length - closed;
      const linkedActuals = plans.reduce((total, plan) => total + getMatchedExpenseIds(plan).length, 0);
      const matchRate = plans.length ? matched / plans.length * 100 : 0;

      els.plannedOverview.innerHTML = `
        <span><strong>${plans.length}</strong> total</span>
        <span class="planned-overview-unmatched"><strong>${unmatched}</strong> unmatched</span>
        <span><strong>${matched}</strong> matched</span>
        <span><strong>${open}</strong> open</span>
        <span><strong>${closed}</strong> closed</span>
        <span><strong>${linkedActuals}</strong> linked tickets</span>
        <span><strong>${formatPercent(matchRate)}%</strong> match rate</span>
      `;

      els.plannedList.innerHTML = plans.length
        ? plans.map(renderer.renderPlannedCard).join("")
        : `<div class="summary-empty planned-empty"><strong>No planned expenses in this column.</strong><br>Add an expected future cost without affecting any budget calculations.</div>`;
    }

    function openAllPlannedDialog() {
      renderAllPlannedContent();
      openDialog(els.allPlannedDialog);
    }

    function renderAllPlannedContent() {
      const plans = [...state.plannedExpenses].sort((a, b) => {
        const openCompare = Number(a.closed === true) - Number(b.closed === true);
        if (openCompare) return openCompare;
        const columnCompare = state.columns.findIndex(column => column.id === a.columnId) - state.columns.findIndex(column => column.id === b.columnId);
        if (columnCompare) return columnCompare;
        return String(a.description).localeCompare(String(b.description));
      });
      els.allPlannedContent.innerHTML = renderer.renderAllPlannedContent(plans, core.buildAllPlannedCurrencyTotals(plans));
    }

    function handleAllPlannedClick(event) {
      const button = event.target.closest("[data-all-planned-action]");
      if (!button) return;
      const planId = button.dataset.plannedId;
      const action = button.dataset.allPlannedAction;
      const plan = state.plannedExpenses.find(item => item.id === planId);
      if (!plan) return;

      if (action === "edit") {
        openPlannedEditDialog(plan.id, plan.columnId, { returnToAllList: true });
      }
      if (action === "match") {
        openPlannedMatchDialog(plan.id, { returnToAllList: true });
      }
      if (action === "delete") {
        deletePlannedExpense(plan.id);
      }
    }

    function handleAllPlannedChange(event) {
      const input = event.target.closest('input[data-all-planned-action="toggle-closed"]');
      if (!input) return;
      setPlannedClosed(input.dataset.plannedId, input.checked);
    }

    function handlePlannedListClick(event) {
      const button = event.target.closest("[data-planned-action]");
      if (!button) return;
      const planId = button.dataset.plannedId;
      const action = button.dataset.plannedAction;
      if (action === "open-actual") {
        const expenseId = button.dataset.expenseId;
        if (!state.expenses.some(expense => expense.id === expenseId)) return;
        navigateToExpense(expenseId, { closeDialog: els.plannedDialog, openEditor: true });
        return;
      }
      if (action === "edit") openPlannedEditDialog(planId);
      if (action === "match") openPlannedMatchDialog(planId);
      if (action === "delete") deletePlannedExpense(planId);
    }

    function handlePlannedListChange(event) {
      const input = event.target.closest('input[data-planned-action="toggle-closed"]');
      if (!input) return;
      setPlannedClosed(input.dataset.plannedId, input.checked);
    }

    function setPlannedClosed(planId, requestedClosed) {
      const plan = state.plannedExpenses.find(item => item.id === planId);
      if (!plan) return;

      plan.closed = Boolean(requestedClosed);
      const automaticallyClosed = core.syncPlanClosedState(plan);
      plan.updatedAt = new Date().toISOString();
      persistState();
      renderBoard();
      if (els.plannedDialog.open) renderPlannedDialogContent();
      if (els.allPlannedDialog.open) renderAllPlannedContent();

      if (automaticallyClosed && !requestedClosed) {
        showToast("This plan remains closed because matched actual expenses have reached price 1.", "success");
      } else {
        showToast(plan.closed ? "Planned expense closed." : "Planned expense reopened.", "success");
      }
    }

    function deletePlannedExpense(planId) {
      const plan = state.plannedExpenses.find(item => item.id === planId);
      if (!plan) return;
      if (!windowConfirm(`Delete planned expense "${plan.description}"?`)) return;
      state.plannedExpenses = state.plannedExpenses.filter(item => item.id !== planId);
      persistState();
      renderBoard();
      if (els.plannedDialog.open) renderPlannedDialogContent();
      if (els.allPlannedDialog.open) renderAllPlannedContent();
      showToast("Planned expense deleted.", "success");
    }

    return Object.freeze({
      deletePlannedExpense,
      handleAllPlannedChange,
      handleAllPlannedClick,
      handlePlannedListChange,
      handlePlannedListClick,
      openAllPlannedDialog,
      openPlannedDialog,
      renderAllPlannedContent,
      renderPlannedDialogContent,
      setPlannedClosed
    });
  }

  const api = Object.freeze({ createPlanningListDialog });

  if (typeof window !== "undefined") window.BudgetBoardPlanningListDialog = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
