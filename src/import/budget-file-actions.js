 (() => {
  "use strict";

  function createFileActionsController(deps) {
    const {
      getState,
      setState,
      stateVersion,
      ImportExport,
      parseXlsx,
      nextOrder,
      uid,
      commit,
      showToast,
      pluralize,
      sanitizeState,
      windowConfirm,
      downloadBlob,
      isoDate
    } = deps;

    async function importXlsx(event) {
      const state = getState();
      const file = event.target.files?.[0];
      if (!file) return;
      if (!parseXlsx) {
        showToast("The built-in XLSX parser is unavailable.", "error");
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        const rows = ImportExport.statementRowsFromParsedWorkbook(await parseXlsx(buffer, { maxColumns: 10 }));
        const result = ImportExport.importRowsToExpenses(rows, { startOrder: nextOrder("unassigned"), createId: uid });
        const { imported, skipped } = result;
        state.expenses.push(...result.expenses);

        if (!imported) {
          showToast("No valid expense rows were found from row 3 onward.", "error");
          return;
        }

        commit();
        showToast(`Imported ${imported} ${pluralize(imported, "expense", "expenses")}${skipped ? `; skipped ${skipped} invalid row(s)` : ""}.`, "success");
      } catch (error) {
        console.error(error);
        showToast(`Could not import the XLSX file: ${error.message || "unknown error"}`, "error");
      }
    }

    function exportBoard() {
      const payload = ImportExport.createBackupPayload(getState(), stateVersion);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, `budget-board-${isoDate(new Date())}.json`);
      showToast("Board backup exported.", "success");
    }

    async function restoreBoard(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const parsed = JSON.parse(await file.text());
        const candidate = ImportExport.getRestoreCandidate(parsed);
        const restored = sanitizeState(candidate);
        if (!restored) throw new Error("The file does not contain a valid board state.");
        if (!windowConfirm(`Restore ${restored.expenses.length} actual expense ticket(s), ${restored.plannedExpenses.length} planned expense(s), and ${restored.columns.length - 1} category column(s)? This replaces the current board.`)) return;
        setState(restored);
        commit();
        showToast("Board restored from backup.", "success");
      } catch (error) {
        console.error(error);
        showToast(`Could not restore the backup: ${error.message || "invalid JSON"}`, "error");
      }
    }

    return Object.freeze({
      exportBoard,
      importXlsx,
      restoreBoard
    });
  }

  const api = Object.freeze({ createFileActionsController });

  if (typeof window !== "undefined") window.BudgetBoardFileActions = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
