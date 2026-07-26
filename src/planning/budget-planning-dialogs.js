(() => {
  "use strict";

  const DialogCore = globalThis.BudgetBoardPlanningDialogCore || (typeof require === "function" ? require("./budget-planning-dialog-core.js") : null);
  const ListDialog = globalThis.BudgetBoardPlanningListDialog || (typeof require === "function" ? require("./budget-planning-list-dialog.js") : null);
  const EditDialog = globalThis.BudgetBoardPlanningEditDialog || (typeof require === "function" ? require("./budget-planning-edit-dialog.js") : null);
  const MatchDialog = globalThis.BudgetBoardPlanningMatchDialog || (typeof require === "function" ? require("./budget-planning-match-dialog.js") : null);

  function createPlanningDialogController(deps) {
    const {
      els,
      getState,
      Planning,
      PlanningRender,
      isPlanMatched,
      getMatchedExpenseIds,
      setMatchedExpenseIds,
      formatPercent,
      openDialog,
      escapeHtml,
      formatMoney,
      isFiniteNumber,
      normalizeCurrency,
      getCombinedActualAmountForCurrency,
      pluralize,
      renderDeleteIcon,
      getPlannedPrices,
      planHasExpense,
      toEditableNumber,
      inferGoalCurrency,
      clearInvalidFields,
      parseMoney,
      parseOptionalMoney,
      uid,
      persistState,
      commit,
      renderBoard,
      showToast,
      parseDateForSort,
      windowConfirm,
      syncPlanClosedStateCore,
      getPlanRemainingPricesCore,
      navigateToExpense
    } = deps;

    if (!DialogCore || !ListDialog || !EditDialog || !MatchDialog) {
      throw new Error("Planning dialog modules must be loaded before budget-planning-dialogs.js.");
    }

    const core = DialogCore.createPlanningDialogCore({
      getState,
      Planning,
      isPlanMatched,
      getMatchedExpenseIds,
      setMatchedExpenseIds,
      planHasExpense,
      windowConfirm,
      syncPlanClosedStateCore,
      getPlanRemainingPricesCore
    });
    const renderer = PlanningRender.createPlanningRenderer({
      getState: () => core.state,
      escapeHtml,
      formatMoney,
      formatPercent,
      pluralize,
      isFiniteNumber,
      normalizeCurrency,
      getCombinedActualAmountForCurrency,
      getMatchedExpenseIds,
      getMatchedExpenses: core.getMatchedExpenses,
      renderDeleteIcon,
      getPlannedPrices
    });

    let returnToPlannedColumnId = null;
    let returnToAllPlanned = false;
    let listDialog;
    let editDialog;
    let matchDialog;

    function prepareChildDialogReturn(columnId, options = {}) {
      const shouldReturnToAll = options.returnToAllList === true || els.allPlannedDialog.open;
      if (els.plannedDialog.open) els.plannedDialog.close();
      if (els.allPlannedDialog.open) els.allPlannedDialog.close();
      returnToAllPlanned = shouldReturnToAll;
      returnToPlannedColumnId = shouldReturnToAll || options.returnToList === false ? null : columnId;
    }

    function handlePlannedChildDialogClose() {
      if (returnToAllPlanned) {
        returnToAllPlanned = false;
        listDialog.openAllPlannedDialog();
        return;
      }
      if (!returnToPlannedColumnId) return;
      const columnId = returnToPlannedColumnId;
      returnToPlannedColumnId = null;
      if (core.state.columns.some(column => column.id === columnId)) listDialog.openPlannedDialog(columnId);
    }

    editDialog = EditDialog.createPlanningEditDialog({
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
    });
    matchDialog = MatchDialog.createPlanningMatchDialog({
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
    });
    listDialog = ListDialog.createPlanningListDialog({
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
      openPlannedEditDialog: (...args) => editDialog.openPlannedEditDialog(...args),
      openPlannedMatchDialog: (...args) => matchDialog.openPlannedMatchDialog(...args),
      windowConfirm
    });

    return Object.freeze({
      getColumnPlans: core.getColumnPlans,
      openPlannedDialog: listDialog.openPlannedDialog,
      renderPlannedDialogContent: listDialog.renderPlannedDialogContent,
      openAllPlannedDialog: listDialog.openAllPlannedDialog,
      renderAllPlannedContent: listDialog.renderAllPlannedContent,
      handleAllPlannedClick: listDialog.handleAllPlannedClick,
      handleAllPlannedChange: listDialog.handleAllPlannedChange,
      handlePlannedListClick: listDialog.handlePlannedListClick,
      handlePlannedListChange: listDialog.handlePlannedListChange,
      setPlannedClosed: listDialog.setPlannedClosed,
      openMatchedPlannedFromExpense: editDialog.openMatchedPlannedFromExpense,
      openPlannedEditDialog: editDialog.openPlannedEditDialog,
      savePlannedFromForm: editDialog.savePlannedFromForm,
      deletePlannedExpense: listDialog.deletePlannedExpense,
      openPlannedMatchDialog: matchDialog.openPlannedMatchDialog,
      updatePlannedMatchPreview: matchDialog.updatePlannedMatchPreview,
      savePlannedMatchFromForm: matchDialog.savePlannedMatchFromForm,
      unmatchCurrentPlanned: matchDialog.unmatchCurrentPlanned,
      handlePlannedChildDialogClose,
      getPlanRemainingPrices: core.getPlanRemainingPrices,
      getColumnRemainingPlannedSums: core.getColumnRemainingPlannedSums,
      getMatchedExpenses: core.getMatchedExpenses,
      syncPlanClosedState: core.syncPlanClosedState,
      syncAllPlanClosedStates: core.syncAllPlanClosedStates,
      renderPlanComparisons: renderer.renderPlanComparisons,
      clearPlanMatchForExpense: core.clearPlanMatchForExpense,
      reconcilePlanClosedAfterDeletion: core.reconcilePlanClosedAfterDeletion,
      getMatchedPlanForExpense: core.getMatchedPlanForExpense,
      confirmAndUnmatchExpenseForColumnMove: core.confirmAndUnmatchExpenseForColumnMove
    });
  }

  const api = Object.freeze({ createPlanningDialogController });

  if (typeof window !== "undefined") window.BudgetBoardPlanningDialogs = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
