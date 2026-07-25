(() => {
  "use strict";

  function moveColumnByOffset(columns, columnId, offset) {
    const index = columns.findIndex(column => column.id === columnId);
    if (index < 1) return { moved: false };
    const targetIndex = Math.max(1, Math.min(columns.length - 1, index + offset));
    if (targetIndex === index) return { moved: false };

    const [column] = columns.splice(index, 1);
    columns.splice(targetIndex, 0, column);
    return { moved: true, column, direction: offset < 0 ? "left" : "right" };
  }

  function reorderColumn(columns, sourceColumnId, targetColumnId, position = "before") {
    const sourceIndex = columns.findIndex(column => column.id === sourceColumnId);
    if (sourceIndex < 1 || sourceColumnId === targetColumnId) return { moved: false };

    const [column] = columns.splice(sourceIndex, 1);
    let targetIndex = columns.findIndex(item => item.id === targetColumnId);
    if (targetIndex < 0) {
      columns.splice(sourceIndex, 0, column);
      return { moved: false };
    }

    let insertIndex;
    if (targetColumnId === "unassigned") {
      insertIndex = 1;
    } else {
      insertIndex = targetIndex + (position === "after" ? 1 : 0);
      insertIndex = Math.max(1, Math.min(columns.length, insertIndex));
    }

    columns.splice(insertIndex, 0, column);
    return { moved: true, column };
  }

  function getDeleteColumnImpact(state, columnId) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column || column.locked) return null;
    return {
      column,
      expenseCount: state.expenses.filter(item => item.columnId === columnId).length,
      plannedCount: state.plannedExpenses.filter(item => item.columnId === columnId).length
    };
  }

  function moveDeletedColumnItemsToUnassigned(state, columnId) {
    const impact = getDeleteColumnImpact(state, columnId);
    if (!impact) return { moved: false };

    let nextUnassignedOrder = state.expenses
      .filter(item => item.columnId === "unassigned")
      .reduce((max, item) => Math.max(max, Number(item.order) || 0), -1) + 1;

    state.expenses.forEach(expense => {
      if (expense.columnId === columnId) {
        expense.columnId = "unassigned";
        expense.order = nextUnassignedOrder++;
      }
    });
    state.plannedExpenses.forEach(plan => {
      if (plan.columnId === columnId) plan.columnId = "unassigned";
    });
    state.columns = state.columns.filter(item => item.id !== columnId);
    return { moved: true, ...impact };
  }

  function toggleColumnFold(column) {
    if (!column) return false;
    column.folded = column.folded !== true;
    return true;
  }

  function toggleCollapsedLabel(column, label, labels) {
    if (!column || !labels.includes(label)) return false;
    const collapsed = new Set(getCollapsedLabels(column, labels));
    if (collapsed.has(label)) collapsed.delete(label);
    else collapsed.add(label);
    column.collapsedLabels = [...collapsed];
    return true;
  }

  function createColumnController(deps) {
    const {
      getColumns,
      commit,
      showToast,
      boardElement,
      cssEscape,
      requestAnimationFrameFn = typeof requestAnimationFrame === "function" ? requestAnimationFrame : callback => callback()
    } = deps;

    function moveByOffset(columnId, offset) {
      const result = moveColumnByOffset(getColumns(), columnId, offset);
      if (!result.moved) return false;
      commit();
      showToast(`Moved "${result.column.title}" ${result.direction}.`, "success");
      requestAnimationFrameFn(() => {
        boardElement?.querySelector(`.column-drag-handle[data-column-id="${cssEscape(columnId)}"]`)?.focus();
      });
      return true;
    }

    function reorder(sourceColumnId, targetColumnId, position = "before") {
      const result = reorderColumn(getColumns(), sourceColumnId, targetColumnId, position);
      if (!result.moved) return false;
      commit();
      showToast(`Moved "${result.column.title}".`, "success");
      return true;
    }

    function toggleFold(columnId) {
      const column = getColumns().find(item => item.id === columnId);
      if (!toggleColumnFold(column)) return false;
      commit();
      return true;
    }

    function toggleLabelGroup(columnId, label, labels) {
      const column = getColumns().find(item => item.id === columnId);
      if (!toggleCollapsedLabel(column, label, labels)) return false;
      commit();
      return true;
    }

    return Object.freeze({
      moveByOffset,
      reorder,
      toggleFold,
      toggleLabelGroup
    });
  }

  function getCollapsedLabels(column, labels) {
    return Array.isArray(column?.collapsedLabels) ? column.collapsedLabels.filter(label => labels.includes(label)) : [];
  }

  const api = Object.freeze({
    createColumnController,
    getCollapsedLabels,
    getDeleteColumnImpact,
    moveColumnByOffset,
    moveDeletedColumnItemsToUnassigned,
    reorderColumn,
    toggleCollapsedLabel,
    toggleColumnFold
  });

  if (typeof window !== "undefined") window.BudgetBoardColumns = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
