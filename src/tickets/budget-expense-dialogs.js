(() => {
  "use strict";

  function createExpenseController(deps) {
    const {
      els,
      getState,
      setStateExpenses,
      labels,
      TicketActions,
      clearInvalidFields,
      formatDate,
      toEditableNumber,
      isFiniteNumber,
      openDialog,
      parseMoney,
      parseOptionalMoney,
      normalizeCurrency,
      showToast,
      uid,
      nextOrder,
      normalizeLabel,
      getColumnPlans,
      planHasExpense,
      getPlannedPrices,
      formatMoney,
      getMatchedExpenseIds,
      setMatchedExpenseIds,
      reconcilePlanClosedAfterDeletion,
      syncPlanClosedState,
      confirmAndUnmatchExpenseForColumnMove,
      getMatchedPlanForExpense,
      clearPlanMatchForExpense,
      normalizeOrders,
      commit,
      escapeHtml,
      pluralize,
      windowConfirm
    } = deps;
    const state = new Proxy({}, {
      get(_target, property) { return getState()[property]; },
      set(_target, property, value) {
        if (property === "expenses") {
          setStateExpenses(value);
          return true;
        }
        getState()[property] = value;
        return true;
      }
    });
  function openExpenseDialog(expenseId = null, defaultColumnId = "unassigned") {
    const expense = expenseId ? state.expenses.find(item => item.id === expenseId) : null;
    fillColumnSelect(expense?.columnId || defaultColumnId);
    clearInvalidFields(els.expenseForm);

    els.expenseDialogTitle.textContent = expense ? "Edit Expense" : "Add Expense";
    els.expenseId.value = expense?.id || "";
    els.expenseDate.value = expense?.date || formatDate(new Date());
    els.expenseCard.value = expense?.card || "";
    els.expenseDescription.value = expense?.description || "";
    els.expenseNote.value = expense?.note || "";
    els.expenseOriginalCategory.value = expense?.originalCategory || "";
    els.expenseAmount.value = expense ? toEditableNumber(expense.amount) : "";
    els.expenseCurrency.value = expense?.currency || "UAH";
    els.expenseInitialAmount.value = isFiniteNumber(expense?.initialAmount) ? toEditableNumber(expense.initialAmount) : "";
    els.expenseInitialCurrency.value = expense?.initialCurrency || expense?.currency || "UAH";
    els.expenseRemainingAmount.value = isFiniteNumber(expense?.remainingAmount) ? toEditableNumber(expense.remainingAmount) : "";
    els.expenseRemainingCurrency.value = expense?.remainingCurrency || expense?.currency || "UAH";
    fillExpensePlannedSelect(expense?.columnId || defaultColumnId, expense?.id || "");

    const labelValue = expense?.label || "none";
    const labelInput = els.expenseForm.querySelector(`input[name="ticketLabel"][value="${labelValue}"]`);
    if (labelInput) labelInput.checked = true;

    openDialog(els.expenseDialog);
    setTimeout(() => els.expenseDescription.focus(), 0);
  }

  function saveExpenseFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    clearInvalidFields(els.expenseForm);

    const description = els.expenseDescription.value.trim();
    const amount = parseMoney(els.expenseAmount.value);
    let valid = true;

    if (!description) {
      els.expenseDescription.classList.add("invalid");
      valid = false;
    }
    if (!isFiniteNumber(amount)) {
      els.expenseAmount.classList.add("invalid");
      valid = false;
    }
    if (!valid) {
      showToast("Please fill in the description and a valid transaction amount.", "error");
      return;
    }

    const id = els.expenseId.value;
    const columnId = state.columns.some(column => column.id === els.expenseColumn.value) ? els.expenseColumn.value : "unassigned";
    const label = els.expenseForm.querySelector('input[name="ticketLabel"]:checked')?.value || "none";
    const existing = id ? state.expenses.find(item => item.id === id) : null;
    const previousColumnId = existing?.columnId || null;
    const matchedPlanBeforeMove = existing ? getMatchedPlanForExpense(existing.id) : null;
    const isMovingColumns = Boolean(existing && previousColumnId !== columnId);

    if (isMovingColumns && matchedPlanBeforeMove && !confirmAndUnmatchExpenseForColumnMove(existing, columnId)) {
      return;
    }

    const expense = {
      id: existing?.id || uid(),
      columnId,
      order: existing && existing.columnId === columnId ? existing.order : nextOrder(columnId),
      date: els.expenseDate.value.trim(),
      card: els.expenseCard.value.trim(),
      description,
      note: els.expenseNote.value.trim(),
      originalCategory: els.expenseOriginalCategory.value.trim(),
      amount: Math.abs(amount),
      currency: normalizeCurrency(els.expenseCurrency.value),
      initialAmount: parseOptionalMoney(els.expenseInitialAmount.value),
      initialCurrency: normalizeCurrency(els.expenseInitialCurrency.value),
      remainingAmount: parseOptionalMoney(els.expenseRemainingAmount.value),
      remainingCurrency: normalizeCurrency(els.expenseRemainingCurrency.value),
      label: labels.includes(label) ? label : "none"
    };

    if (existing) {
      Object.assign(existing, expense);
      showToast("Expense updated.", "success");
    } else {
      state.expenses.push(expense);
      showToast("Expense added.", "success");
    }

    const requestedPlanId = isMovingColumns && matchedPlanBeforeMove ? "" : els.expensePlannedMatch.value;
    assignExpenseToPlannedExpense(expense.id, requestedPlanId, columnId);
    commit();
    els.expenseDialog.close();
  }

  function fillColumnSelect(selectedId) {
    els.expenseColumn.innerHTML = state.columns.map(column => `<option value="${escapeHtml(column.id)}" ${column.id === selectedId ? "selected" : ""}>${escapeHtml(column.title)}</option>`).join("");
  }

  function fillExpensePlannedSelect(columnId, expenseId = "", preferredPlanId = null) {
    const currentPlan = expenseId ? state.plannedExpenses.find(plan => planHasExpense(plan, expenseId)) : null;
    const selectedPlanId = preferredPlanId === null ? (currentPlan?.id || "") : preferredPlanId;
    const plans = getColumnPlans(columnId);

    if (!plans.length) {
      els.expensePlannedMatch.innerHTML = `<option value="">No planned expenses in this column</option>`;
      els.expensePlannedMatch.value = "";
      els.expensePlannedMatch.disabled = true;
      return;
    }

    els.expensePlannedMatch.disabled = false;
    els.expensePlannedMatch.innerHTML = [
      `<option value="">Not matched</option>`,
      ...plans.map(plan => {
        const prices = getPlannedPrices(plan).map(price => `${formatMoney(price.amount)} ${price.currency}`).join(" · ");
        const linkedCount = getMatchedExpenseIds(plan).length;
        const suffix = [prices, `${linkedCount} linked`].filter(Boolean).join(" · ");
        return `<option value="${escapeHtml(plan.id)}">${escapeHtml(plan.description)}${suffix ? ` — ${escapeHtml(suffix)}` : ""}</option>`;
      })
    ].join("");
    els.expensePlannedMatch.value = plans.some(plan => plan.id === selectedPlanId) ? selectedPlanId : "";
  }

  function assignExpenseToPlannedExpense(expenseId, targetPlanId, columnId) {
    const now = new Date().toISOString();
    state.plannedExpenses.forEach(plan => {
      const ids = getMatchedExpenseIds(plan);
      if (!ids.includes(expenseId) || plan.id === targetPlanId) return;
      setMatchedExpenseIds(plan, ids.filter(id => id !== expenseId));
      reconcilePlanClosedAfterDeletion(plan);
      plan.updatedAt = now;
    });

    if (!targetPlanId) return;
    const targetPlan = state.plannedExpenses.find(plan => plan.id === targetPlanId && plan.columnId === columnId);
    if (!targetPlan) return;
    const ids = getMatchedExpenseIds(targetPlan);
    if (!ids.includes(expenseId)) {
      setMatchedExpenseIds(targetPlan, [...ids, expenseId]);
      syncPlanClosedState(targetPlan);
      targetPlan.updatedAt = now;
    }
  }


  function deleteExpense(expenseId) {
    const expense = state.expenses.find(item => item.id === expenseId);
    if (!expense) return;

    const parent = expense.splitFromExpenseId
      ? state.expenses.find(item => item.id === expense.splitFromExpenseId) || null
      : null;
    const extractedChildren = state.expenses.filter(item => item.splitFromExpenseId === expenseId);

    let message = `Delete “${expense.description}”?`;
    if (parent) {
      message += ` This is an extracted expense linked to “${parent.description}”. It will not be merged back, and the parent amounts and balance will not be recalculated.`;
    } else if (extractedChildren.length) {
      message += ` This is the parent of ${extractedChildren.length} extracted ${pluralize(extractedChildren.length, "expense", "expenses")}. The children will remain as independent tickets and their links to this parent will be removed. No amounts or balances will be recalculated.`;
    }

    if (!windowConfirm(message)) return;
    state.expenses = state.expenses.filter(item => item.id !== expenseId);
    state.expenses.forEach(item => {
      if (item.splitFromExpenseId === expenseId) item.splitFromExpenseId = "";
    });
    clearPlanMatchForExpense(expenseId);
    normalizeOrders(expense.columnId);
    commit();
    showToast("Expense deleted.", "success");
  }

  function deleteAllExpenses() {
    if (!state.expenses.length) return;
    if (!windowConfirm(`Delete all ${state.expenses.length} expense tickets from the board? Columns will be kept.`)) return;
    state.expenses = [];
    state.plannedExpenses.forEach(plan => {
      plan.matchedExpenseIds = [];
      delete plan.matchedExpenseId;
      reconcilePlanClosedAfterDeletion(plan);
      plan.updatedAt = new Date().toISOString();
    });
    commit();
    showToast("All actual expense tickets were deleted. Planned expenses were kept, reopened where needed, and are now unmatched.", "success");
  }

  function setExpenseLabel(expenseId, label) {
    const expense = state.expenses.find(item => item.id === expenseId);
    if (!TicketActions.toggleExpenseLabel(expense, label, labels)) return;
    commit();
  }


    return Object.freeze({
      openExpenseDialog,
      saveExpenseFromForm,
      fillExpensePlannedSelect,
      assignExpenseToPlannedExpense,
      deleteExpense,
      deleteAllExpenses,
      setExpenseLabel
    });
  }

  const api = Object.freeze({ createExpenseController });

  if (typeof window !== "undefined") window.BudgetBoardExpenseDialogs = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();