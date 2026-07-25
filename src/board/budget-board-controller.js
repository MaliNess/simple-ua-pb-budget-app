(() => {
  "use strict";

  function createBoardController(deps) {
    const {
      els,
      getState,
      labels,
      columnController,
      columnDialogController,
      expenseController,
      maskController,
      planningController,
      splitController,
      openBulkLabelDialog,
      confirmAndUnmatchExpenseForColumnMove,
      nextOrder,
      normalizeOrders,
      commit,
      showToast,
      labelTitle,
      documentRef,
      windowRef
    } = deps;

    let draggedExpenseId = null;
    let draggedColumnId = null;
    let columnDropPosition = "before";

    function bindBoardEvents() {
      els.board.addEventListener("click", handleBoardClick);
      els.board.addEventListener("keydown", handleBoardKeydown);
      els.board.addEventListener("dragstart", handleDragStart);
      els.board.addEventListener("dragend", handleDragEnd);
      els.board.addEventListener("dragover", handleDragOver);
      els.board.addEventListener("dragleave", handleDragLeave);
      els.board.addEventListener("drop", handleDrop);
    }

    function handleBoardClick(event) {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const action = button.dataset.action;
      if (action === "add-expense") expenseController.openExpenseDialog(null, button.dataset.columnId);
      if (action === "edit-column") columnDialogController.openColumnDialog(button.dataset.columnId);
      if (action === "delete-column") columnDialogController.deleteColumn(button.dataset.columnId);
      if (action === "open-goal") columnDialogController.openGoalDialog(button.dataset.columnId);
      if (action === "open-sort") columnDialogController.openSortDialog(button.dataset.columnId);
      if (action === "open-mask-move") maskController.openMaskDialog(button.dataset.columnId);
      if (action === "open-bulk-label") openBulkLabelDialog(button.dataset.columnId);
      if (action === "open-planned-list") planningController.openPlannedDialog(button.dataset.columnId);
      if (action === "toggle-column-fold") columnController.toggleFold(button.dataset.columnId);
      if (action === "toggle-label-group") columnController.toggleLabelGroup(button.dataset.columnId, button.dataset.label, labels);
      if (action === "create-matched-plan-from-expense") planningController.openMatchedPlannedFromExpense(button.dataset.expenseId);
      if (action === "split-expense") splitController.openSplitExpenseDialog(button.dataset.expenseId);
      if (action === "merge-extracted") splitController.openMergeExpenseDialog(button.dataset.expenseId);
      if (action === "navigate-expense") navigateToExpense(button.dataset.expenseId, { openEditor: true });
      if (action === "edit-expense") expenseController.openExpenseDialog(button.dataset.expenseId);
      if (action === "delete-expense") expenseController.deleteExpense(button.dataset.expenseId);
      if (action === "set-label") expenseController.setExpenseLabel(button.dataset.expenseId, button.dataset.label);
    }

    function navigateToExpense(expenseId, options = {}) {
      const state = getState();
      const expense = state.expenses.find(item => item.id === expenseId);
      if (!expense) {
        showToast("The selected expense no longer exists.", "error");
        return;
      }

      if (options.closeDialog?.open) options.closeDialog.close();

      const revealAndHighlight = () => {
        const ticket = [...els.board.querySelectorAll(".ticket")]
          .find(item => item.dataset.expenseId === expenseId);
        if (!ticket) return;

        const collapsedGroup = ticket.closest(".ticket-group.collapsed");
        if (collapsedGroup) {
          collapsedGroup.classList.remove("collapsed");
          const groupButton = collapsedGroup.querySelector('[data-action="toggle-label-group"]');
          if (groupButton) {
            groupButton.setAttribute("aria-expanded", "true");
            groupButton.title = `Collapse ${labelTitle(collapsedGroup.dataset.label)} tickets`;
          }
        }

        documentRef.querySelectorAll(".ticket.ticket-navigation-highlight").forEach(item => {
          item.classList.remove("ticket-navigation-highlight");
        });

        ticket.classList.remove("ticket-navigation-highlight");
        void ticket.offsetWidth;
        ticket.classList.add("ticket-navigation-highlight");
        ticket.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

        windowRef.setTimeout(() => {
          ticket.classList.remove("ticket-navigation-highlight");
        }, 4200);

        if (options.openEditor) {
          windowRef.setTimeout(() => expenseController.openExpenseDialog(expenseId), 850);
        }
      };

      windowRef.setTimeout(revealAndHighlight, options.closeDialog ? 80 : 0);
    }

    function handleBoardKeydown(event) {
      const handle = event.target.closest(".column-drag-handle");
      if (!handle) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        columnController.moveByOffset(handle.dataset.columnId, -1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        columnController.moveByOffset(handle.dataset.columnId, 1);
      }
    }

    function handleDragStart(event) {
      const columnHandle = event.target.closest(".column-drag-handle");
      if (columnHandle) {
        draggedColumnId = columnHandle.dataset.columnId;
        draggedExpenseId = null;
        columnDropPosition = "before";
        columnHandle.closest(".column")?.classList.add("column-reordering");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", `column:${draggedColumnId}`);
        return;
      }

      const ticket = event.target.closest(".ticket");
      if (!ticket) return;
      draggedExpenseId = ticket.dataset.expenseId;
      draggedColumnId = null;
      ticket.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedExpenseId);
    }

    function handleDragEnd(event) {
      event.target.closest(".ticket")?.classList.remove("dragging");
      event.target.closest(".column")?.classList.remove("column-reordering");
      clearColumnDragIndicators();
      draggedExpenseId = null;
      draggedColumnId = null;
      columnDropPosition = "before";
    }

    function handleDragOver(event) {
      const column = event.target.closest(".column");
      if (!column) return;

      if (draggedColumnId) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        clearColumnDragIndicators();
        const targetColumnId = column.dataset.columnId;
        if (targetColumnId === draggedColumnId) return;

        if (targetColumnId === "unassigned") {
          columnDropPosition = "after";
        } else {
          const bounds = column.getBoundingClientRect();
          columnDropPosition = event.clientX < bounds.left + bounds.width / 2 ? "before" : "after";
        }
        column.classList.add(columnDropPosition === "before" ? "column-reorder-before" : "column-reorder-after");
        return;
      }

      if (!draggedExpenseId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      documentRef.querySelectorAll(".column.drag-over").forEach(item => {
        if (item !== column) item.classList.remove("drag-over");
      });
      column.classList.add("drag-over");
    }

    function handleDragLeave(event) {
      const column = event.target.closest(".column");
      if (!column) return;
      if (!column.contains(event.relatedTarget)) {
        column.classList.remove("drag-over", "column-reorder-before", "column-reorder-after");
      }
    }

    function handleDrop(event) {
      const state = getState();
      const column = event.target.closest(".column");
      if (!column) return;
      event.preventDefault();

      if (draggedColumnId) {
        const sourceColumnId = draggedColumnId;
        const targetColumnId = column.dataset.columnId;
        const position = column.classList.contains("column-reorder-after") ? "after" : columnDropPosition;
        draggedColumnId = null;
        clearColumnDragIndicators();
        columnController.reorder(sourceColumnId, targetColumnId, position);
        return;
      }

      column.classList.remove("drag-over");
      const expenseId = draggedExpenseId || event.dataTransfer.getData("text/plain");
      const expense = state.expenses.find(item => item.id === expenseId);
      const targetColumnId = column.dataset.columnId;
      if (!expense || !state.columns.some(item => item.id === targetColumnId)) return;

      const oldColumnId = expense.columnId;
      if (oldColumnId !== targetColumnId) {
        if (!confirmAndUnmatchExpenseForColumnMove(expense, targetColumnId)) return;
        expense.columnId = targetColumnId;
        expense.order = nextOrder(targetColumnId);
        normalizeOrders(oldColumnId);
        commit();
      }
    }

    function clearColumnDragIndicators() {
      documentRef.querySelectorAll(".column.drag-over, .column.column-reorder-before, .column.column-reorder-after, .column.column-reordering").forEach(column => {
        column.classList.remove("drag-over", "column-reorder-before", "column-reorder-after", "column-reordering");
      });
    }

    return Object.freeze({
      bindBoardEvents,
      clearColumnDragIndicators,
      handleBoardClick,
      handleBoardKeydown,
      handleDragEnd,
      handleDragLeave,
      handleDragOver,
      handleDragStart,
      handleDrop,
      navigateToExpense
    });
  }

  const api = Object.freeze({ createBoardController });

  if (typeof window !== "undefined") window.BudgetBoardController = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
