(() => {
  "use strict";

  function createPlanningEditDialog(deps) {
    const {
      els,
      core,
      getState,
      planHasExpense,
      getMatchedExpenseIds,
      normalizeCurrency,
      isFiniteNumber,
      toEditableNumber,
      inferGoalCurrency,
      formatMoney,
      escapeHtml,
      clearInvalidFields,
      openDialog,
      parseMoney,
      parseOptionalMoney,
      uid,
      persistState,
      renderBoard,
      showToast,
      prepareChildDialogReturn
    } = deps;
    const state = core.state || new Proxy({}, {
      get(_target, property) { return getState()[property]; },
      set(_target, property, value) { getState()[property] = value; return true; }
    });

    function openMatchedPlannedFromExpense(expenseId) {
      const expense = state.expenses.find(item => item.id === expenseId);
      if (!expense) return;

      const existingPlan = state.plannedExpenses.find(plan => planHasExpense(plan, expense.id));
      if (existingPlan) {
        openPlannedEditDialog(existingPlan.id, expense.columnId, { returnToList: false });
        return;
      }

      openPlannedEditDialog(null, expense.columnId, {
        sourceExpenseId: expense.id,
        returnToList: false
      });
    }

    function openPlannedEditDialog(planId = null, defaultColumnId = "unassigned", options = {}) {
      const plan = planId ? state.plannedExpenses.find(item => item.id === planId) : null;
      const sourceExpense = options.sourceExpenseId
        ? state.expenses.find(item => item.id === options.sourceExpenseId)
        : null;
      const columnId = plan?.columnId || sourceExpense?.columnId || defaultColumnId;
      if (!state.columns.some(column => column.id === columnId)) return;

      const sourcePrimaryCurrency = normalizeCurrency(sourceExpense?.currency) || "UAH";
      const sourceInitialCurrency = normalizeCurrency(sourceExpense?.initialCurrency);
      const hasDistinctInitialPrice = Boolean(
        sourceExpense &&
        isFiniteNumber(sourceExpense.initialAmount) &&
        sourceInitialCurrency &&
        sourceInitialCurrency !== sourcePrimaryCurrency
      );

      els.plannedEditTitle.textContent = plan
        ? "Edit planned expense"
        : sourceExpense
          ? "Create matched planned expense"
          : "Add planned expense";
      els.plannedId.value = plan?.id || "";
      els.plannedEditColumnId.value = columnId;
      els.plannedSourceExpenseId.value = sourceExpense?.id || "";
      els.plannedDescription.value = plan?.description || "";
      els.plannedDescription.placeholder = sourceExpense
        ? "Enter a reusable title for this planned expense"
        : "For example, annual insurance renewal";
      els.plannedTitleHelp.textContent = sourceExpense
        ? "The title is intentionally left blank. Enter the name you want to use for this planned expense."
        : "Enter a title that will help you recognise this expected expense later.";
      els.plannedAmount1.value = sourceExpense
        ? toEditableNumber(sourceExpense.amount)
        : isFiniteNumber(plan?.amount1) ? toEditableNumber(plan.amount1) : "";
      els.plannedCurrency1.value = sourceExpense
        ? sourcePrimaryCurrency
        : plan?.currency1 || inferGoalCurrency(columnId) || "UAH";
      els.plannedAmount2.value = sourceExpense
        ? hasDistinctInitialPrice ? toEditableNumber(sourceExpense.initialAmount) : ""
        : isFiniteNumber(plan?.amount2) ? toEditableNumber(plan.amount2) : "";
      els.plannedCurrency2.value = sourceExpense
        ? hasDistinctInitialPrice ? sourceInitialCurrency : (sourcePrimaryCurrency === "EUR" ? "UAH" : "EUR")
        : plan?.currency2 || (els.plannedCurrency1.value === "EUR" ? "UAH" : "EUR");
      els.plannedClosed.checked = plan?.closed === true;

      if (sourceExpense) {
        const initialText = isFiniteNumber(sourceExpense.initialAmount) && sourceInitialCurrency
          ? `${formatMoney(sourceExpense.initialAmount)} ${escapeHtml(sourceInitialCurrency)}`
          : "not available";
        const sameCurrencyNote = isFiniteNumber(sourceExpense.initialAmount) && sourceInitialCurrency === sourcePrimaryCurrency
          ? `<small>The initial transaction uses the same currency, so it is not duplicated as a second planned price.</small>`
          : "";
        els.plannedSourceInfo.innerHTML = `
          <strong>Matched automatically to this actual expense</strong>
          <span>${escapeHtml(sourceExpense.description)}</span>
          <span>Transaction: ${formatMoney(sourceExpense.amount)} ${escapeHtml(sourcePrimaryCurrency)} · Initial: ${initialText}</span>
          ${sameCurrencyNote}
        `;
        els.plannedSourceInfo.hidden = false;
      } else {
        els.plannedSourceInfo.innerHTML = "";
        els.plannedSourceInfo.hidden = true;
      }

      clearInvalidFields(els.plannedForm);
      prepareChildDialogReturn(columnId, options);
      openDialog(els.plannedEditDialog);
      setTimeout(() => els.plannedDescription.focus(), 0);
    }

    function savePlannedFromForm(event) {
      event.preventDefault();
      if (event.submitter?.value === "cancel") {
        event.currentTarget.closest("dialog")?.close("cancel");
        return;
      }
      clearInvalidFields(els.plannedForm);

      const description = els.plannedDescription.value.trim();
      const amount1 = parseMoney(els.plannedAmount1.value);
      const amount2 = parseOptionalMoney(els.plannedAmount2.value);
      let valid = true;

      if (!description) {
        els.plannedDescription.classList.add("invalid");
        valid = false;
      }
      if (!isFiniteNumber(amount1) || amount1 < 0) {
        els.plannedAmount1.classList.add("invalid");
        valid = false;
      }
      if (amount2 !== null && (!isFiniteNumber(amount2) || amount2 < 0)) {
        els.plannedAmount2.classList.add("invalid");
        valid = false;
      }
      if (!valid) {
        showToast("Enter a title and at least one valid approximate price.", "error");
        return;
      }

      const id = els.plannedId.value;
      const existing = id ? state.plannedExpenses.find(item => item.id === id) : null;
      const sourceExpenseId = els.plannedSourceExpenseId.value;
      const sourceExpense = sourceExpenseId ? state.expenses.find(item => item.id === sourceExpenseId) : null;

      if (sourceExpenseId && !sourceExpense) {
        showToast("The source expense no longer exists. Close the dialog and try again.", "error");
        return;
      }

      if (!existing && sourceExpense) {
        const alreadyMatchedPlan = state.plannedExpenses.find(item => planHasExpense(item, sourceExpense.id));
        if (alreadyMatchedPlan) {
          showToast("This actual expense already has a matched planned expense.", "error");
          return;
        }
      }

      const now = new Date().toISOString();
      const selectedColumnId = state.columns.some(column => column.id === els.plannedEditColumnId.value)
        ? els.plannedEditColumnId.value
        : "unassigned";
      const plan = {
        id: existing?.id || uid(),
        columnId: sourceExpense?.columnId || selectedColumnId,
        description,
        amount1: Math.abs(amount1),
        currency1: normalizeCurrency(els.plannedCurrency1.value) || "UAH",
        amount2: isFiniteNumber(amount2) ? Math.abs(amount2) : null,
        currency2: isFiniteNumber(amount2) ? (normalizeCurrency(els.plannedCurrency2.value) || "EUR") : "",
        matchedExpenseIds: existing ? getMatchedExpenseIds(existing) : (sourceExpense ? [sourceExpense.id] : []),
        closed: els.plannedClosed.checked,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };

      if (existing) {
        Object.assign(existing, plan);
        delete existing.matchedExpenseId;
      } else {
        state.plannedExpenses.push(plan);
      }

      core.syncPlanClosedState(existing || plan);
      persistState();
      renderBoard();
      const message = existing
        ? "Planned expense updated."
        : sourceExpense
          ? "Matched planned expense created from the actual ticket."
          : "Planned expense added.";
      showToast(message, "success");
      els.plannedEditDialog.close();
    }

    return Object.freeze({
      openMatchedPlannedFromExpense,
      openPlannedEditDialog,
      savePlannedFromForm
    });
  }

  const api = Object.freeze({ createPlanningEditDialog });

  if (typeof window !== "undefined") window.BudgetBoardPlanningEditDialog = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
