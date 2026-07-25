(() => {
  "use strict";

  function wildcardToRegExp(pattern) {
    const specialCharacters = "\\^$.*+?()[]{}|";
    const source = [...String(pattern)].map(character => {
      if (character === "*") return ".*";
      if (character === "?") return ".";
      return specialCharacters.includes(character) ? `\\${character}` : character;
    }).join("");
    return new RegExp(`^${source}$`, "iu");
  }

  function findUnassignedByMask(expenses, pattern) {
    const regex = wildcardToRegExp(pattern);
    return expenses.filter(expense => expense.columnId === "unassigned" && regex.test(expense.description || ""));
  }

  function createMaskMoveController(deps) {
    const {
      els,
      getState,
      escapeHtml,
      clearInvalidFields,
      openDialog,
      showToast,
      pluralize,
      getMatchedPlanForExpense,
      clearPlanMatchForExpense,
      nextOrder,
      normalizeOrders,
      commit,
      windowConfirm
    } = deps;

    function openMaskDialog(defaultTargetColumnId) {
      const state = getState();
      const targetColumns = state.columns.filter(column => !column.locked);
      if (!targetColumns.length) {
        showToast("Create a category column before moving tickets by mask.", "error");
        return;
      }

      els.maskTargetColumn.innerHTML = targetColumns.map(column => `<option value="${escapeHtml(column.id)}">${escapeHtml(column.title)}</option>`).join("");
      els.maskTargetColumn.value = targetColumns.some(column => column.id === defaultTargetColumnId)
        ? defaultTargetColumnId
        : targetColumns[0].id;
      els.maskPattern.value = "";
      clearInvalidFields(els.maskForm);
      updateMaskPreview();
      openDialog(els.maskDialog);
      setTimeout(() => els.maskPattern.focus(), 0);
    }

    function updateMaskPreview() {
      const state = getState();
      const pattern = els.maskPattern.value.trim();
      if (!pattern) {
        els.maskPreview.textContent = "Enter a mask to preview matching Unassigned tickets.";
        els.maskPreview.classList.remove("has-matches");
        return;
      }

      const matches = findUnassignedByMask(state.expenses, pattern);
      const target = state.columns.find(column => column.id === els.maskTargetColumn.value);
      els.maskPreview.textContent = `${matches.length} ${pluralize(matches.length, "ticket matches", "tickets match")}${target ? ` and will move to "${target.title}".` : "."}`;
      els.maskPreview.classList.toggle("has-matches", matches.length > 0);
    }

    function moveByMaskFromForm(event) {
      event.preventDefault();
      if (event.submitter?.value === "cancel") {
        event.currentTarget.closest("dialog")?.close("cancel");
        return;
      }
      const state = getState();
      clearInvalidFields(els.maskForm);
      const pattern = els.maskPattern.value.trim();
      const targetColumnId = els.maskTargetColumn.value;
      const target = state.columns.find(column => column.id === targetColumnId && !column.locked);

      if (!pattern) {
        els.maskPattern.classList.add("invalid");
        showToast("Enter a ticket title mask.", "error");
        return;
      }
      if (!target) {
        showToast("Choose a valid destination column.", "error");
        return;
      }

      const matches = findUnassignedByMask(state.expenses, pattern);
      if (!matches.length) {
        showToast("No Unassigned tickets match this mask.", "error");
        updateMaskPreview();
        return;
      }

      const matchedMatches = matches.filter(expense => getMatchedPlanForExpense(expense.id));
      if (matchedMatches.length) {
        const confirmed = windowConfirm(
          `${matchedMatches.length} matched ${pluralize(matchedMatches.length, "expense", "expenses")} will be unmatched and their planned expenses recalculated before moving. Continue?`
        );
        if (!confirmed) return;
        matchedMatches.forEach(expense => clearPlanMatchForExpense(expense.id));
      }

      let order = nextOrder(targetColumnId);
      matches.forEach(expense => {
        expense.columnId = targetColumnId;
        expense.order = order++;
      });
      normalizeOrders("unassigned");
      commit();
      els.maskDialog.close();
      showToast(`Moved ${matches.length} ${pluralize(matches.length, "ticket", "tickets")} to "${target.title}".`, "success");
    }

    return Object.freeze({
      openMaskDialog,
      updateMaskPreview,
      moveByMaskFromForm
    });
  }

  const api = Object.freeze({
    createMaskMoveController,
    findUnassignedByMask,
    wildcardToRegExp
  });

  if (typeof window !== "undefined") window.BudgetBoardMaskActions = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
