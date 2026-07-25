(() => {
  "use strict";

  function createBulkLabelController(deps) {
    const {
      els,
      getState,
      labels,
      TicketActions,
      normalizeLabel,
      openDialog,
      showToast,
      pluralize,
      commit
    } = deps;
    const state = new Proxy({}, {
      get(_target, property) { return getState()[property]; },
      set(_target, property, value) { getState()[property] = value; return true; }
    });

    function openBulkLabelDialog(columnId) {
      const column = state.columns.find(item => item.id === columnId);
      if (!column) return;

      const count = state.expenses.filter(expense => expense.columnId === columnId && normalizeLabel(expense.label) === "none").length;
      if (!count) {
        showToast(`"${column.title}" has no unlabelled expenses.`, "success");
        return;
      }

      els.bulkLabelColumnId.value = columnId;
      els.bulkLabelDescription.textContent = `Choose a label for all ${count} currently unlabelled ${pluralize(count, "expense", "expenses")} in "${column.title}". Existing labelled expenses will not be changed.`;
      const green = els.bulkLabelForm.querySelector('input[name="bulkTicketLabel"][value="green"]');
      if (green) green.checked = true;
      openDialog(els.bulkLabelDialog);
    }

    function applyBulkLabelFromForm(event) {
      event.preventDefault();
      if (event.submitter?.value === "cancel") {
        event.currentTarget.closest("dialog")?.close("cancel");
        return;
      }

      const columnId = els.bulkLabelColumnId.value;
      const label = els.bulkLabelForm.querySelector('input[name="bulkTicketLabel"]:checked')?.value;
      if (!state.columns.some(column => column.id === columnId) || !labels.includes(label) || label === "none") {
        showToast("Could not apply the label.", "error");
        return;
      }

      const changed = TicketActions.applyBulkLabel(
        state.expenses.filter(expense => expense.columnId === columnId),
        label,
        labels
      );

      if (!changed) {
        els.bulkLabelDialog.close();
        showToast("There are no unlabelled expenses left in this column.", "success");
        return;
      }

      commit();
      els.bulkLabelDialog.close();
      showToast(`Applied the ${label} label to ${changed} ${pluralize(changed, "expense", "expenses")}.`, "success");
    }

    return Object.freeze({
      applyBulkLabelFromForm,
      openBulkLabelDialog
    });
  }

  const api = Object.freeze({ createBulkLabelController });

  if (typeof window !== "undefined") window.BudgetBoardBulkLabelDialogs = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
