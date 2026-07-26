(() => {
  "use strict";

  function createAppBootstrap(deps) {
    const {
      els,
      documentRef,
      windowRef,
      renderPalette,
      renderColumnIconOptions,
      currencyController,
      syncAllPlanClosedStates,
      renderBoard,
      persistState,
      openDialog,
      columnDialogController,
      summaryController,
      planningController,
      expenseController,
      fileController,
      splitController,
      isHexColor,
      updateColumnIconPreview,
      maskController,
      applyBulkLabelFromForm,
      boardController,
      renderActionIcon
    } = deps;

    function init() {
      renderStaticIcons();
      renderPalette();
      renderColumnIconOptions();
      currencyController.refreshCurrencySelects();
      bindEvents();
      syncAllPlanClosedStates();
      renderBoard();
    }

    function bindEvents() {
      bindToolbarEvents();
      bindImportExportEvents();
      bindExpenseEvents();
      bindSplitMergeEvents();
      bindColumnEvents();
      bindGoalEvents();
      bindSummaryEvents();
      bindPlanningEvents();
      bindMaskEvents();
      bindDialogCloseEvents();
      bindCurrencyEvents();
      boardController.bindBoardEvents();
      windowRef.addEventListener("beforeunload", persistState);
    }

    function renderStaticIcons() {
      if (typeof renderActionIcon !== "function") return;
      documentRef.querySelectorAll("[data-action-icon]").forEach(container => {
        const iconName = container.dataset.actionIcon;
        container.innerHTML = renderActionIcon(iconName);
      });
    }

    function bindToolbarEvents() {
      els.addColumnBtn.addEventListener("click", () => columnDialogController.openColumnDialog());
      els.summaryBtn.addEventListener("click", summaryController.openSummaryDialog);
      els.allPlannedBtn.addEventListener("click", planningController.openAllPlannedDialog);
      els.deleteAllBtn.addEventListener("click", expenseController.deleteAllExpenses);
    }

    function bindImportExportEvents() {
      els.importXlsxBtn.addEventListener("click", () => openDialog(els.importDialog));
      els.chooseXlsxBtn.addEventListener("click", () => {
        els.importDialog.close();
        els.xlsxInput.value = "";
        els.xlsxInput.click();
      });
      els.restoreBtn.addEventListener("click", () => {
        els.backupInput.value = "";
        els.backupInput.click();
      });
      els.exportBtn.addEventListener("click", fileController.exportBoard);
      els.xlsxInput.addEventListener("change", fileController.importXlsx);
      els.backupInput.addEventListener("change", fileController.restoreBoard);
    }

    function bindExpenseEvents() {
      els.expenseForm.addEventListener("submit", expenseController.saveExpenseFromForm);
      els.expenseColumn.addEventListener("change", () => {
        expenseController.fillExpensePlannedSelect(els.expenseColumn.value, els.expenseId.value, els.expensePlannedMatch.value);
      });
    }

    function bindSplitMergeEvents() {
      els.splitExpenseForm.addEventListener("submit", splitController.saveSplitExpenseFromForm);
      els.splitExpenseForm.addEventListener("change", event => {
        if (event.target.matches('input[name="splitBasis"]')) splitController.updateSplitBasis();
      });
      els.splitPlainAmount.addEventListener("input", splitController.updateSplitPreview);
      els.splitInitialAmount.addEventListener("input", splitController.updateSplitPreview);
      els.mergeExpenseForm.addEventListener("submit", splitController.saveMergeExpenseFromForm);
      els.mergeChildList.addEventListener("change", splitController.updateMergePreview);
      els.mergePlannedMatch.addEventListener("change", () => {
        els.mergePlannedMatch.dataset.userSelected = "true";
        splitController.updateMergePreview();
      });
      els.mergeSelectAllBtn.addEventListener("click", () => setMergeChildSelection(true));
      els.mergeClearSelectionBtn.addEventListener("click", () => setMergeChildSelection(false));
    }

    function setMergeChildSelection(checked) {
      els.mergeChildList.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = checked; });
      splitController.updateMergePreview();
    }

    function bindColumnEvents() {
      els.columnForm.addEventListener("submit", columnDialogController.saveColumnFromForm);
      els.sortForm.addEventListener("submit", columnDialogController.saveSortFromForm);
      els.columnColor.addEventListener("input", () => {
        els.columnColorText.value = els.columnColor.value.toLowerCase();
      });
      els.columnIcon.addEventListener("change", updateColumnIconPreview);
      els.columnColorText.addEventListener("input", () => {
        if (isHexColor(els.columnColorText.value)) els.columnColor.value = els.columnColorText.value;
      });
    }

    function bindGoalEvents() {
      els.goalForm.addEventListener("submit", columnDialogController.saveGoalFromForm);
      els.clearGoalBtn.addEventListener("click", columnDialogController.clearCurrentColumnGoals);
      [els.goalCurrency, els.goalSharePercent, els.goalAmountLimit].forEach(input => input.addEventListener("input", columnDialogController.updateGoalPreview));
    }

    function bindSummaryEvents() {
      els.summaryContent.addEventListener("click", summaryController.handleSummaryClick);
      els.summaryContent.addEventListener("change", summaryController.handleSummaryChange);
    }

    function bindPlanningEvents() {
      els.allPlannedContent.addEventListener("click", planningController.handleAllPlannedClick);
      els.allPlannedContent.addEventListener("change", planningController.handleAllPlannedChange);
      els.addPlannedBtn.addEventListener("click", () => planningController.openPlannedEditDialog(null, els.plannedColumnId.value));
      els.plannedList.addEventListener("click", planningController.handlePlannedListClick);
      els.plannedList.addEventListener("change", planningController.handlePlannedListChange);
      els.plannedForm.addEventListener("submit", planningController.savePlannedFromForm);
      els.plannedMatchForm.addEventListener("submit", planningController.savePlannedMatchFromForm);
      els.plannedMatchExpense.addEventListener("change", planningController.updatePlannedMatchPreview);
      els.unmatchPlannedBtn.addEventListener("click", planningController.unmatchCurrentPlanned);
      [els.plannedEditDialog, els.plannedMatchDialog].forEach(dialog => dialog.addEventListener("close", planningController.handlePlannedChildDialogClose));
    }

    function bindMaskEvents() {
      els.maskForm.addEventListener("submit", maskController.moveByMaskFromForm);
      els.bulkLabelForm.addEventListener("submit", applyBulkLabelFromForm);
      els.maskPattern.addEventListener("input", maskController.updateMaskPreview);
      els.maskTargetColumn.addEventListener("change", maskController.updateMaskPreview);
    }

    function bindDialogCloseEvents() {
      documentRef.querySelectorAll("[data-dialog-close]").forEach(button => {
        button.addEventListener("click", () => {
          const dialog = button.closest("dialog");
          if (dialog?.open) dialog.close("cancel");
        });
      });
    }

    function bindCurrencyEvents() {
      documentRef.querySelectorAll(".currency-select").forEach(select => {
        select.addEventListener("focus", () => { select.dataset.previousCurrency = select.value; });
        select.addEventListener("pointerdown", () => { select.dataset.previousCurrency = select.value; });
        select.addEventListener("change", currencyController.handleCurrencySelectChange);
      });
    }

    return Object.freeze({ init, bindEvents });
  }

  const api = Object.freeze({ createAppBootstrap });

  if (typeof window !== "undefined") window.BudgetBoardBootstrap = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
