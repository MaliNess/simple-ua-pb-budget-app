(() => {
  "use strict";

  function createColumnDialogController(deps) {
    const {
      els,
      getState,
      setColumns,
      palette,
      defaultSortMode,
      sortModes,
      ColumnActions,
      TicketActions,
      clearInvalidFields,
      openDialog,
      isHexColor,
      normalizeColumnIcon,
      uid,
      emptyGoal,
      showToast,
      commit,
      normalizeOrders,
      getColumnSortMode,
      getColumnGoal,
      inferGoalCurrency,
      isFiniteNumber,
      toEditableNumber,
      parseOptionalMoney,
      sanitizeGoal,
      hasActiveGoal,
      getAmountForCurrency,
      groupCurrency,
      getCurrencyTotal,
      formatMoney,
      escapeHtml,
      formatPercent,
      goalStatusClass,
      windowConfirm
    } = deps;
    const state = new Proxy({}, {
      get(_target, property) { return getState()[property]; },
      set(_target, property, value) {
        if (property === "columns") {
          setColumns(value);
          return true;
        }
        getState()[property] = value;
        return true;
      }
    });
  function openColumnDialog(columnId = null) {
    const column = columnId ? state.columns.find(item => item.id === columnId) : null;
    els.columnDialogTitle.textContent = column ? "Edit Column" : "Add Column";
    els.columnId.value = column?.id || "";
    els.columnTitle.value = column?.title || "";
    els.columnColor.value = column?.color || palette[1];
    els.columnColorText.value = column?.color || palette[1];
    els.columnIcon.value = normalizeColumnIcon(column?.icon);
    updateColumnIconPreview();
    clearInvalidFields(els.columnForm);
    openDialog(els.columnDialog);
    setTimeout(() => els.columnTitle.focus(), 0);
  }

  function saveColumnFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    clearInvalidFields(els.columnForm);

    const title = els.columnTitle.value.trim();
    const color = isHexColor(els.columnColorText.value) ? els.columnColorText.value.toLowerCase() : els.columnColor.value;
    const icon = normalizeColumnIcon(els.columnIcon.value);
    if (!title) {
      els.columnTitle.classList.add("invalid");
      showToast("Please enter a column title.", "error");
      return;
    }

    const id = els.columnId.value;
    if (id) {
      const column = state.columns.find(item => item.id === id && !item.locked);
      if (column) {
        column.title = title;
        column.color = color;
        column.icon = icon;
        showToast("Column updated.", "success");
      }
    } else {
      state.columns.push({ id: uid(), title, color, icon, folded: false, sortMode: defaultSortMode, collapsedLabels: [], goal: emptyGoal() });
      showToast("Column added.", "success");
    }

    commit();
    els.columnDialog.close();
  }

  function deleteColumn(columnId) {
    const impact = ColumnActions.getDeleteColumnImpact(state, columnId);
    if (!impact) return;
    const { column, expenseCount, plannedCount } = impact;
    const movedItems = [
      expenseCount ? `${expenseCount} actual ticket(s)` : "",
      plannedCount ? `${plannedCount} planned expense(s)` : ""
    ].filter(Boolean).join(" and ");
    const message = movedItems
      ? `Delete “${column.title}”? Its ${movedItems} will be moved to Unassigned.`
      : `Delete “${column.title}”?`;
    if (!windowConfirm(message)) return;

    ColumnActions.moveDeletedColumnItemsToUnassigned(state, columnId);
    normalizeOrders("unassigned");
    commit();
    showToast("Column deleted.", "success");
  }

  function openSortDialog(columnId) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column) return;
    els.sortColumnId.value = columnId;
    const mode = getColumnSortMode(column);
    const input = els.sortForm.querySelector(`input[name="sortMode"][value="${mode}"]`);
    if (input) input.checked = true;
    openDialog(els.sortDialog);
  }

  function saveSortFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    const columnId = els.sortColumnId.value;
    const mode = els.sortForm.querySelector('input[name="sortMode"]:checked')?.value || defaultSortMode;
    sortColumn(columnId, mode);
    els.sortDialog.close();
  }

  function sortColumn(columnId, mode) {
    const column = state.columns.find(item => item.id === columnId);
    const expenses = state.expenses.filter(expense => expense.columnId === columnId);
    if (!TicketActions.applyColumnSort(column, expenses, mode, TICKET_ACTION_OPTIONS)) return;
    commit();
    showToast(`Tickets sorted: ${sortModes[mode].label.toLowerCase()}.`, "success");
  }

  function openGoalDialog(columnId) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column) return;

    const goal = getColumnGoal(column);
    els.goalColumnId.value = column.id;
    els.goalDialogTitle.textContent = `Goals · ${column.title}`;
    els.goalCurrency.value = goal.currency || inferGoalCurrency(column.id);
    els.goalSharePercent.value = isFiniteNumber(goal.sharePercent) ? toEditableNumber(goal.sharePercent) : "";
    els.goalAmountLimit.value = isFiniteNumber(goal.amountLimit) ? toEditableNumber(goal.amountLimit) : "";
    els.clearGoalBtn.disabled = !hasActiveGoal(goal);
    clearInvalidFields(els.goalForm);
    updateGoalPreview();
    openDialog(els.goalDialog);
    setTimeout(() => els.goalSharePercent.focus(), 0);
  }

  function saveGoalFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }

    clearInvalidFields(els.goalForm);
    const column = state.columns.find(item => item.id === els.goalColumnId.value);
    if (!column) return;

    const currency = normalizeCurrency(els.goalCurrency.value) || "UAH";
    const sharePercent = parseOptionalMoney(els.goalSharePercent.value);
    const amountLimit = parseOptionalMoney(els.goalAmountLimit.value);
    let valid = true;

    if (sharePercent !== null && (!isFiniteNumber(sharePercent) || sharePercent < 0 || sharePercent > 100)) {
      els.goalSharePercent.classList.add("invalid");
      valid = false;
    }
    if (amountLimit !== null && (!isFiniteNumber(amountLimit) || amountLimit < 0)) {
      els.goalAmountLimit.classList.add("invalid");
      valid = false;
    }
    if (!valid) {
      showToast("Use a share from 0 to 100 and a non-negative transaction limit.", "error");
      return;
    }

    column.goal = {
      currency,
      sharePercent,
      amountLimit
    };
    commit();
    els.goalDialog.close();
    showToast(hasActiveGoal(column.goal) ? `Goals saved for “${column.title}”.` : `Goals cleared for “${column.title}”.`, "success");
  }

  function clearCurrentColumnGoals() {
    const column = state.columns.find(item => item.id === els.goalColumnId.value);
    if (!column) return;
    column.goal = emptyGoal(els.goalCurrency.value || inferGoalCurrency(column.id));
    commit();
    els.goalDialog.close();
    showToast(`Goals cleared for “${column.title}”.`, "success");
  }

  function updateGoalPreview() {
    const column = state.columns.find(item => item.id === els.goalColumnId.value);
    if (!column) {
      els.goalPreview.innerHTML = "";
      return;
    }

    const currency = normalizeCurrency(els.goalCurrency.value) || "UAH";
    const shareGoal = parseOptionalMoney(els.goalSharePercent.value);
    const amountGoal = parseOptionalMoney(els.goalAmountLimit.value);
    const expenses = state.expenses.filter(expense => expense.columnId === column.id);
    const currentAmount = getAmountForCurrency(expenses, currency);
    const boardTotal = getAmountForCurrency(state.expenses, currency);
    const currentShare = boardTotal ? currentAmount / boardTotal * 100 : 0;

    const lines = [
      `<div><span>Current transaction sum</span><strong>${formatMoney(currentAmount)} ${escapeHtml(currency)}</strong></div>`,
      `<div><span>Current overall share</span><strong>${formatPercent(currentShare)}%</strong></div>`
    ];
    if (isFiniteNumber(amountGoal) && amountGoal >= 0) {
      lines.push(`<div><span>Amount goal status</span><strong class="${goalStatusClass(currentAmount, amountGoal)}">${currentAmount <= amountGoal ? "Within goal" : "Over goal"}</strong></div>`);
    }
    if (isFiniteNumber(shareGoal) && shareGoal >= 0 && shareGoal <= 100) {
      lines.push(`<div><span>Share goal status</span><strong class="${goalStatusClass(currentShare, shareGoal)}">${currentShare <= shareGoal ? "Within goal" : "Over goal"}</strong></div>`);
    }
    els.goalPreview.innerHTML = lines.join("");
  }


    return Object.freeze({
      openColumnDialog,
      saveColumnFromForm,
      deleteColumn,
      openSortDialog,
      saveSortFromForm,
      sortColumn,
      openGoalDialog,
      saveGoalFromForm,
      clearCurrentColumnGoals,
      updateGoalPreview
    });
  }

  const api = Object.freeze({ createColumnDialogController });

  if (typeof window !== "undefined") window.BudgetBoardColumnDialogs = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
