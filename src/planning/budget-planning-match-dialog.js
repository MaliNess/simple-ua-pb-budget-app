(() => {
  "use strict";

  function createPlanningMatchDialog(deps) {
    const {
      els,
      core,
      renderer,
      getState,
      getMatchedExpenseIds,
      setMatchedExpenseIds,
      planHasExpense,
      parseDateForSort,
      openDialog,
      showToast,
      persistState,
      renderBoard,
      pluralize,
      prepareChildDialogReturn
    } = deps;
    const state = core.state || new Proxy({}, {
      get(_target, property) { return getState()[property]; },
      set(_target, property, value) { getState()[property] = value; return true; }
    });

    function openPlannedMatchDialog(planId, options = {}) {
      const plan = state.plannedExpenses.find(item => item.id === planId);
      if (!plan) return;
      const column = state.columns.find(item => item.id === plan.columnId);
      if (!column) return;

      const currentIds = new Set(getMatchedExpenseIds(plan));
      const usedByOthers = new Set(state.plannedExpenses
        .filter(item => item.id !== plan.id)
        .flatMap(item => getMatchedExpenseIds(item)));
      const candidates = state.expenses
        .filter(expense => expense.columnId === plan.columnId && (!usedByOthers.has(expense.id) || currentIds.has(expense.id)))
        .sort((a, b) => parseDateForSort(b.date) - parseDateForSort(a.date));

      els.plannedMatchId.value = plan.id;
      els.plannedMatchTitle.textContent = `Match actual expenses · ${plan.description}`;
      els.plannedMatchExpense.innerHTML = candidates.length
        ? candidates.map(expense => `<option value="${renderer.escapeHtml ? renderer.escapeHtml(expense.id) : escapeOption(expense.id)}" ${currentIds.has(expense.id) ? "selected" : ""}>${escapeOption(renderer.formatExpenseOption(expense))}</option>`).join("")
        : `<option value="">No available actual expenses in this column</option>`;
      els.plannedMatchExpense.disabled = !candidates.length;
      if (els.plannedMatchExpenseCards) {
        els.plannedMatchExpenseCards.innerHTML = candidates.length
          ? candidates.map(expense => renderMatchCandidateCard(expense, currentIds.has(expense.id))).join("")
          : `<div class="summary-empty">No available actual expenses in this column.</div>`;
      }
      els.unmatchPlannedBtn.disabled = !currentIds.size;
      updatePlannedMatchPreview();

      prepareChildDialogReturn(plan.columnId, { ...options, returnToList: options.returnToAllList ? false : options.returnToList });
      openDialog(els.plannedMatchDialog);
    }

    function getSelectedPlannedMatchIds() {
      if (els.plannedMatchExpenseCards) {
        const checkedIds = [...els.plannedMatchExpenseCards.querySelectorAll("[data-planned-match-expense-id]:checked")]
          .map(input => input.value)
          .filter(Boolean);
        if (checkedIds.length || !els.plannedMatchExpenseCards.querySelector("[data-planned-match-expense-id]")) return checkedIds;
      }
      return [...els.plannedMatchExpense.selectedOptions]
        .map(option => option.value)
        .filter(Boolean);
    }

    function handlePlannedMatchCardChange(event) {
      const input = event.target.closest("[data-planned-match-expense-id]");
      if (!input) return;
      syncPlannedMatchSelectFromCards();
      updatePlannedMatchPreview();
    }

    function syncPlannedMatchSelectFromCards() {
      if (!els.plannedMatchExpenseCards) return;
      const selectedIds = new Set([...els.plannedMatchExpenseCards.querySelectorAll("[data-planned-match-expense-id]:checked")]
        .map(input => input.value));
      [...els.plannedMatchExpense.options].forEach(option => {
        option.selected = selectedIds.has(option.value);
      });
    }

    function updatePlannedMatchPreview() {
      const plan = state.plannedExpenses.find(item => item.id === els.plannedMatchId.value);
      const selectedIds = new Set(getSelectedPlannedMatchIds());
      const actuals = state.expenses.filter(item => selectedIds.has(item.id));
      els.plannedMatchPreview.innerHTML = renderer.renderPlannedMatchPreview(plan, actuals);
    }

    function savePlannedMatchFromForm(event) {
      event.preventDefault();
      if (event.submitter?.value === "cancel") {
        event.currentTarget.closest("dialog")?.close("cancel");
        return;
      }
      const plan = state.plannedExpenses.find(item => item.id === els.plannedMatchId.value);
      const selectedIds = getSelectedPlannedMatchIds();
      const actuals = state.expenses.filter(item => selectedIds.includes(item.id));
      if (!plan || !selectedIds.length || actuals.length !== selectedIds.length || actuals.some(actual => actual.columnId !== plan.columnId)) {
        showToast("Choose at least one valid actual expense from this column.", "error");
        return;
      }
      const used = state.plannedExpenses.find(item => item.id !== plan.id && selectedIds.some(id => planHasExpense(item, id)));
      if (used) {
        showToast("One of the selected expenses is already matched to another planned expense.", "error");
        return;
      }
      setMatchedExpenseIds(plan, selectedIds);
      plan.updatedAt = new Date().toISOString();
      persistState();
      renderBoard();
      showToast(`Planned expense matched to ${selectedIds.length} actual ${pluralize(selectedIds.length, "transaction", "transactions")}.`, "success");
      els.plannedMatchDialog.close();
    }

    function unmatchCurrentPlanned() {
      const plan = state.plannedExpenses.find(item => item.id === els.plannedMatchId.value);
      if (!plan || !getMatchedExpenseIds(plan).length) return;
      setMatchedExpenseIds(plan, []);
      plan.updatedAt = new Date().toISOString();
      persistState();
      renderBoard();
      showToast("All matches removed. The planned expense is unmatched again.", "success");
      els.plannedMatchDialog.close();
    }

    function escapeOption(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function renderMatchCandidateCard(expense, checked) {
      const description = expense.description || "Untitled expense";
      const meta = renderer.formatExpenseOption
        ? renderer.formatExpenseOption(expense)
        : [
          expense.date || "No date",
          `${String(expense.amount || 0)} ${expense.currency || ""}`.trim(),
          expense.card ? `Card ${expense.card}` : "",
          expense.originalCategory || ""
        ].filter(Boolean).join(" - ");
      return `
        <label class="planned-match-ticket-card ${checked ? "is-checked" : ""}">
          <input type="checkbox" data-planned-match-expense-id value="${escapeOption(expense.id)}" ${checked ? "checked" : ""}>
          <span class="planned-match-ticket-copy">
            <strong>${escapeOption(description)}</strong>
            <small>${escapeOption(meta)}</small>
          </span>
        </label>
      `;
    }

    return Object.freeze({
      getSelectedPlannedMatchIds,
      handlePlannedMatchCardChange,
      openPlannedMatchDialog,
      savePlannedMatchFromForm,
      unmatchCurrentPlanned,
      updatePlannedMatchPreview
    });
  }

  const api = Object.freeze({ createPlanningMatchDialog });

  if (typeof window !== "undefined") window.BudgetBoardPlanningMatchDialog = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
