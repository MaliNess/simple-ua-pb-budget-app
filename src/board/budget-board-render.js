(() => {
  "use strict";

  function createBoardRenderer(options) {
    const {
      labels,
      sortModes,
      escapeHtml,
      pluralize,
      formatMoney,
      formatPercent,
      cellText,
      isFiniteNumber,
      planHasExpense,
      renderActionIcon,
      renderDeleteIcon,
      renderTicketMetaIcon,
      renderColumnIcon,
      getSortedColumnExpenses,
      getColumnSortMode,
      getCollapsedLabels,
      normalizeLabel,
      labelTitle,
      getColumnGoal,
      hasActiveGoal,
      getColumnRemainingPlannedSums,
      groupCurrency,
      buildLabelStats,
      getCurrencyTotal,
      getAmountForCurrency,
      goalStatusClass,
      parseDateForSort = value => {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
    } = options;

    function renderBoard(state) {
      const categoryCount = state.columns.filter(column => !column.locked).length;
      const boardTransactionSums = groupCurrency(state.expenses, "amount", "currency");
      const latestTicketDateText = getLatestTicketDateText(state.expenses);
      const metaText = `${state.expenses.length} ${pluralize(state.expenses.length, "expense", "expenses")} · ${state.plannedExpenses.length} planned · ${categoryCount} ${pluralize(categoryCount, "column", "columns")}`;

      const html = state.columns.map(column => {
        const expenses = getSortedColumnExpenses(column, state.expenses.filter(expense => expense.columnId === column.id));
        const sortMode = getColumnSortMode(column);
        const goal = getColumnGoal(column);
        const goalTitle = hasActiveGoal(goal) ? "Edit column goals" : "Add column goals";
        const columnPlans = state.plannedExpenses.filter(plan => plan.columnId === column.id);
        const openPlanCount = columnPlans.filter(plan => plan.closed !== true).length;

        if (column.folded === true) {
          return `
            <article class="column column-folded" data-column-id="${escapeHtml(column.id)}" style="--column-color:${escapeHtml(column.color)}" aria-label="Folded column ${escapeHtml(column.title)}">
              <header class="folded-column-header">
                <button class="folded-column-icon" type="button" data-action="toggle-column-fold" data-column-id="${escapeHtml(column.id)}" title="${escapeHtml(column.title)} · Click to expand" aria-label="Expand ${escapeHtml(column.title)} column">
                  ${renderColumnIcon(column.icon)}
                </button>
                <span class="folded-column-count" title="${expenses.length} ${pluralize(expenses.length, "expense", "expenses")}"><strong>${expenses.length}</strong><small>expenses</small></span>
                <button class="folded-column-count folded-planned-count ${openPlanCount ? "has-unmatched" : ""}" type="button" data-action="open-planned-list" data-column-id="${escapeHtml(column.id)}" title="${columnPlans.length} planned expenses · ${openPlanCount} open">
                  <strong>${columnPlans.length}</strong><small>planned</small>
                </button>
              </header>
              <div class="folded-column-drop-zone" data-column-id="${escapeHtml(column.id)}" title="Drop expenses into ${escapeHtml(column.title)}"></div>
            </article>
          `;
        }

        return `
          <article class="column" data-column-id="${escapeHtml(column.id)}" style="--column-color:${escapeHtml(column.color)}">
            <header class="column-header">
              <div class="column-title-row">
                ${column.locked ? "" : `<span class="column-drag-handle" draggable="true" tabindex="0" role="button" data-column-id="${escapeHtml(column.id)}" aria-label="Reorder ${escapeHtml(column.title)} column. Drag, or use the left and right arrow keys." title="Drag to reorder · Arrow keys move left/right">${renderActionIcon("grip")}</span>`}
                <span class="column-dot" aria-hidden="true"></span>
                <h2 class="column-title" title="${escapeHtml(column.title)}">${escapeHtml(column.title)}</h2>
                <span class="count-badge">${expenses.length}</span>
              </div>
              <div class="column-actions-row">
                <button class="planned-count-btn ${openPlanCount ? "has-unmatched" : ""}" type="button" data-action="open-planned-list" data-column-id="${escapeHtml(column.id)}" title="Open planned expenses · ${openPlanCount} remaining (not closed)">
                  ${renderActionIcon("planned")}<strong>${openPlanCount}</strong><small>remaining</small>
                </button>
                <div class="column-actions">
                  <button class="icon-btn" type="button" data-action="toggle-column-fold" data-column-id="${escapeHtml(column.id)}" title="Fold column horizontally" aria-label="Fold ${escapeHtml(column.title)} column">${renderActionIcon("foldLeft")}</button>
                  <button class="icon-btn ${hasActiveGoal(goal) ? "has-goal" : ""}" type="button" data-action="open-goal" data-column-id="${escapeHtml(column.id)}" title="${goalTitle}" aria-label="${goalTitle}">${renderActionIcon("goal")}</button>
                  <button class="icon-btn" type="button" data-action="open-sort" data-column-id="${escapeHtml(column.id)}" title="Sort groups: ${escapeHtml(sortModes[sortMode].label)}" aria-label="Sort groups">${renderActionIcon("sort")}</button>
                  ${column.locked ? "" : `<button class="icon-btn mask-move-btn" type="button" data-action="open-mask-move" data-column-id="${escapeHtml(column.id)}" title="Move matching Unassigned tickets here" aria-label="Move matching Unassigned tickets here">${renderActionIcon("moveRight")}</button>`}
                  <button class="icon-btn" type="button" data-action="add-expense" data-column-id="${escapeHtml(column.id)}" title="Add expense" aria-label="Add expense">${renderActionIcon("add")}</button>
                  ${column.locked ? "" : `<button class="icon-btn" type="button" data-action="edit-column" data-column-id="${escapeHtml(column.id)}" title="Edit column" aria-label="Edit column">${renderActionIcon("edit")}</button>`}
                  ${column.locked ? "" : `<button class="icon-btn danger" type="button" data-action="delete-column" data-column-id="${escapeHtml(column.id)}" title="Delete column" aria-label="Delete column">${renderActionIcon("deleteLeft", "action-icon-delete-left")}</button>`}
                </div>
              </div>
              ${renderColumnSummary(state, column, expenses, boardTransactionSums)}
            </header>
            <div class="ticket-list" data-column-id="${escapeHtml(column.id)}">
              ${expenses.length ? renderTicketGroups(state, column, expenses) : `<div class="empty-column">${column.locked ? "No unassigned expenses" : "Drop expenses here"}</div>`}
            </div>
          </article>
        `;
      }).join("");

      return {
        deleteAllDisabled: state.expenses.length === 0,
        html,
        latestTicketDateText,
        metaText
      };
    }

    function getLatestTicketDateText(expenses) {
      const latest = expenses.reduce((current, expense) => {
        const timestamp = parseDateForSort(expense.date);
        if (!timestamp || timestamp <= (current?.timestamp || 0)) return current;
        return { timestamp, date: cellText(expense.date) };
      }, null);
      if (!latest?.date) return "";
      return `Latest: ${latest.date.split(/\s+/)[0]}`;
    }

    function renderTicketGroups(state, column, expenses) {
      const collapsedLabels = getCollapsedLabels(column);
      const labelOrder = sortModes[getColumnSortMode(column)].order;
      const groups = new Map(labels.map(label => [label, []]));
      expenses.forEach(expense => groups.get(normalizeLabel(expense.label)).push(expense));

      return labelOrder
        .filter(label => groups.get(label).length)
        .map(label => {
          const items = groups.get(label);
          const collapsed = collapsedLabels.includes(label);
          const title = labelTitle(label);
          const totals = groupCurrency(items, "amount", "currency")
            .map(item => `${formatMoney(item.amount)} ${escapeHtml(item.currency)}`)
            .join(" · ");

          return `
            <section class="ticket-group ${collapsed ? "collapsed" : ""}" data-label="${label}">
              <div class="ticket-group-header-row">
                <button class="ticket-group-header" type="button" data-action="toggle-label-group" data-column-id="${escapeHtml(column.id)}" data-label="${label}" aria-expanded="${collapsed ? "false" : "true"}" title="${collapsed ? "Expand" : "Collapse"} ${escapeHtml(title)} tickets">
                  <span class="ticket-group-name"><span class="label-dot ${label}"></span><strong>${escapeHtml(title)}</strong><span class="ticket-group-count">${items.length}</span></span>
                  <span class="ticket-group-total">${totals}</span>
                  <span class="ticket-group-chevron">${renderActionIcon("chevronDown")}</span>
                </button>
                ${label === "none" ? `<button class="bulk-label-btn" type="button" data-action="open-bulk-label" data-column-id="${escapeHtml(column.id)}" title="Apply one label to all unlabelled expenses in this column">Label all</button>` : ""}
              </div>
              <div class="ticket-group-body">${items.map(expense => renderTicket(state, expense)).join("")}</div>
            </section>
          `;
        }).join("");
    }

    function renderColumnSummary(state, column, expenses, boardTransactionSums) {
      const goal = getColumnGoal(column);
      const openPlanCount = state.plannedExpenses.filter(plan => plan.columnId === column.id && plan.closed !== true).length;
      const remainingPlannedSums = getColumnRemainingPlannedSums(column.id);
      if (!expenses.length && !hasActiveGoal(goal) && !remainingPlannedSums.length && !openPlanCount) return "";

      const transactionSums = groupCurrency(expenses, "amount", "currency");
      const initialSums = groupCurrency(expenses, "initialAmount", "initialCurrency");
      const labelStats = buildLabelStats(expenses, transactionSums);

      const remainingPlannedRows = remainingPlannedSums.map(item => `
        <div class="summary-row planned-unmatched-row">
          <span class="summary-label"><span>${escapeHtml(item.currency)}</span></span>
          <span class="summary-value">${formatMoney(item.amount)}</span>
        </div>
      `).join("");

      const transactionRows = transactionSums.map(item => `
        <div class="summary-row">
          <span class="summary-label"><span>${escapeHtml(item.currency)}</span></span>
          <span class="summary-value">${formatMoney(item.amount)}</span>
        </div>
      `).join("");

      const overallShareRows = transactionSums.map(item => {
        const boardTotal = getCurrencyTotal(boardTransactionSums, item.currency);
        const percentage = boardTotal ? item.amount / boardTotal * 100 : 0;
        return `
          <div class="summary-row overall-share-row">
            <span class="summary-label"><span>${escapeHtml(item.currency)}</span></span>
            <span class="summary-value">${formatPercent(percentage)}%</span>
          </div>
        `;
      }).join("");

      const initialRows = initialSums.map(item => `
        <div class="summary-row">
          <span class="summary-label"><span>${escapeHtml(item.currency)} (initial)</span></span>
          <span class="summary-value">${formatMoney(item.amount)}</span>
        </div>
      `).join("");

      const labelRows = labelStats.map(item => `
        <div class="summary-row">
          <span class="summary-label"><span class="label-dot ${item.label}"></span><span>${escapeHtml(item.currency)}</span></span>
          <span class="summary-value">${formatMoney(item.amount)} (${formatPercent(item.percentage)}%)</span>
        </div>
      `).join("");

      const goalCurrency = goal.currency || "UAH";
      const currentGoalAmount = getAmountForCurrency(expenses, goalCurrency);
      const boardGoalTotal = getCurrencyTotal(boardTransactionSums, goalCurrency);
      const currentGoalShare = boardGoalTotal ? currentGoalAmount / boardGoalTotal * 100 : 0;
      const goalRows = [
        isFiniteNumber(goal.sharePercent) ? `
          <div class="summary-row goal-summary-row">
            <span class="summary-label"><span class="goal-status-dot ${goalStatusClass(currentGoalShare, goal.sharePercent)}"></span><span>Share ${escapeHtml(goalCurrency)}</span></span>
            <span class="summary-value ${goalStatusClass(currentGoalShare, goal.sharePercent)}">${formatPercent(currentGoalShare)}% / ≤${formatPercent(goal.sharePercent)}%</span>
          </div>
        ` : "",
        isFiniteNumber(goal.amountLimit) ? `
          <div class="summary-row goal-summary-row">
            <span class="summary-label"><span class="goal-status-dot ${goalStatusClass(currentGoalAmount, goal.amountLimit)}"></span><span>Limit ${escapeHtml(goalCurrency)}</span></span>
            <span class="summary-value ${goalStatusClass(currentGoalAmount, goal.amountLimit)}">${formatMoney(currentGoalAmount)} / ${formatMoney(goal.amountLimit)}</span>
          </div>
        ` : ""
      ].join("");

      return `
        <div class="summary">
          ${openPlanCount ? `<div class="summary-section planned-summary-section"><div class="summary-row"><span class="summary-key">Planned remaining (${openPlanCount})</span><span></span></div>${remainingPlannedRows || `<div class="summary-row planned-unmatched-row"><span class="summary-label"><span>No amount remaining</span></span><span class="summary-value">0</span></div>`}</div>` : ""}
          ${transactionRows ? `<div class="summary-section"><div class="summary-row"><span class="summary-key">Transactions</span><span></span></div>${transactionRows}</div>` : ""}
          ${overallShareRows ? `<div class="summary-section overall-share-section"><div class="summary-row"><span class="summary-key">Overall share</span><span></span></div>${overallShareRows}</div>` : ""}
          ${initialRows ? `<div class="summary-section"><div class="summary-row"><span class="summary-key">Initial</span><span></span></div>${initialRows}</div>` : ""}
          ${labelRows ? `<div class="summary-section"><div class="summary-row"><span class="summary-key">Labels</span><span></span></div>${labelRows}</div>` : ""}
          ${goalRows ? `<div class="summary-section goal-summary-section"><div class="summary-row"><span class="summary-key">Goals</span><span></span></div>${goalRows}</div>` : ""}
        </div>
      `;
    }

    function renderTicket(state, expense) {
      const labelClass = expense.label && expense.label !== "none" ? `label-${expense.label}` : "";
      const displayDate = expense.date || "Date not specified";
      const card = expense.card || "Card not specified";
      const originalCategory = expense.originalCategory || "Category not specified";
      const note = cellText(expense.note);
      const matchedPlan = state.plannedExpenses.find(plan => planHasExpense(plan, expense.id)) || null;
      const splitSource = expense.splitFromExpenseId
        ? state.expenses.find(item => item.id === expense.splitFromExpenseId) || null
        : null;
      const extractedExpenses = state.expenses
        .filter(item => item.splitFromExpenseId === expense.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const footerParts = [];

      if (isFiniteNumber(expense.initialAmount)) {
        footerParts.push(`Initial: <strong>${formatMoney(expense.initialAmount)} ${escapeHtml(expense.initialCurrency || "")}</strong>`);
      }
      if (isFiniteNumber(expense.remainingAmount)) {
        footerParts.push(`Balance: <strong>${formatMoney(expense.remainingAmount)} ${escapeHtml(expense.remainingCurrency || "")}</strong>`);
      }

      const splitRelationMarkup = `
        ${splitSource ? `
          <div class="split-source-link">
            <span>Extracted from</span>
            <button type="button" data-action="navigate-expense" data-expense-id="${escapeHtml(splitSource.id)}" title="Go to original expense">${escapeHtml(splitSource.description)}</button>
          </div>
        ` : ""}
        ${extractedExpenses.length ? `
          <details class="split-children">
            <summary>Extracted expenses <span>${extractedExpenses.length}</span></summary>
            <div class="split-children-list">
              ${extractedExpenses.map(child => `
                <button type="button" data-action="navigate-expense" data-expense-id="${escapeHtml(child.id)}" title="Go to extracted expense">
                  <span>${escapeHtml(child.description)}</span>
                  <strong>${formatMoney(child.amount)} ${escapeHtml(child.currency || "")}</strong>
                </button>
              `).join("")}
            </div>
            <div class="split-children-actions">
              <button class="btn btn-compact" type="button" data-action="merge-extracted" data-expense-id="${escapeHtml(expense.id)}">${renderActionIcon("merge")} Merge extracted</button>
            </div>
          </details>
        ` : ""}
      `;

      return `
        <article class="ticket ${labelClass}" draggable="true" data-expense-id="${escapeHtml(expense.id)}">
          <div class="ticket-top">
            <div class="ticket-amount">
              <strong>${formatMoney(expense.amount)}</strong><span>${escapeHtml(expense.currency || "")}</span>
            </div>
            <div class="ticket-tools">
              <div class="traffic-lights" aria-label="Ticket label">
                ${["blue", "green", "yellow", "red"].map(label => `<button class="traffic-btn ${label} ${expense.label === label ? "active" : ""}" type="button" data-action="set-label" data-expense-id="${escapeHtml(expense.id)}" data-label="${label}" title="${escapeHtml(labelTitle(label))} label"></button>`).join("")}
              </div>
              ${splitSource ? "" : `<button class="icon-btn split-expense-btn" type="button" data-action="split-expense" data-expense-id="${escapeHtml(expense.id)}" title="Split this expense" aria-label="Split expense">${renderActionIcon("split")}</button>`}
              ${extractedExpenses.length ? `<button class="icon-btn merge-expense-btn" type="button" data-action="merge-extracted" data-expense-id="${escapeHtml(expense.id)}" title="Merge extracted expenses back" aria-label="Merge extracted expenses">${renderActionIcon("merge")}</button>` : ""}
              <button class="icon-btn plan-from-ticket-btn ${matchedPlan ? "has-matched-plan" : ""}" type="button" data-action="create-matched-plan-from-expense" data-expense-id="${escapeHtml(expense.id)}" title="${matchedPlan ? "Edit the matched planned expense" : "Create a matched planned expense from this ticket"}" aria-label="${matchedPlan ? "Edit matched planned expense" : "Create matched planned expense"}">${renderActionIcon("clock")}</button>
              <button class="icon-btn" type="button" data-action="edit-expense" data-expense-id="${escapeHtml(expense.id)}" title="Edit expense" aria-label="Edit expense">${renderActionIcon("edit")}</button>
              <button class="icon-btn danger" type="button" data-action="delete-expense" data-expense-id="${escapeHtml(expense.id)}" title="Delete expense" aria-label="Delete expense">${renderDeleteIcon()}</button>
            </div>
          </div>
          <div class="ticket-description" title="${escapeHtml(expense.description)}">${escapeHtml(expense.description)}</div>
          <div class="ticket-meta">
            <div class="meta-row">${renderTicketMetaIcon("date")}<span class="meta-text">${escapeHtml(displayDate)}</span></div>
            <div class="meta-row">${renderTicketMetaIcon("card")}<span class="meta-text">${escapeHtml(card)}</span></div>
            <div class="meta-row">${renderTicketMetaIcon("category")}<span class="meta-text">${escapeHtml(originalCategory)}</span></div>
          </div>
          ${note ? `<div class="ticket-note" title="${escapeHtml(note)}">${renderActionIcon("edit", "ticket-note-icon")}<span>${escapeHtml(note)}</span></div>` : ""}
          ${splitRelationMarkup}
          ${footerParts.length ? `<div class="ticket-footer">${footerParts.map(part => `<span>${part}</span>`).join("")}</div>` : ""}
        </article>
      `;
    }

    return Object.freeze({
      renderBoard,
      renderColumnSummary,
      renderTicket,
      renderTicketGroups
    });
  }

  const api = Object.freeze({ createBoardRenderer });

  if (typeof window !== "undefined") window.BudgetBoardBoardRender = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
