(() => {
  "use strict";

  function createSummaryDialogController(deps) {
    const {
      els,
      getState,
      Summary,
      categoryChartColors,
      labels,
      groupCurrency,
      normalizeLabel,
      getMatchedExpenseIds,
      formatPercent,
      escapeHtml,
      normalizeCurrency,
      formatMoney,
      openDialog,
      openGoalDialog,
      getColumnGoal,
      hasActiveGoal,
      labelTitle,
      pluralize,
      getAmountForCurrency,
      isFiniteNumber,
      goalStatusClass
    } = deps;
    const state = new Proxy({}, {
      get(_target, property) { return getState()[property]; }
    });
    let excludeServiceExpensesFromSummary = false;

  function handleSummaryClick(event) {
    const button = event.target.closest('[data-summary-action="edit-goal"]');
    if (!button) return;
    const columnId = button.dataset.columnId;
    if (els.summaryDialog.open) els.summaryDialog.close();
    openGoalDialog(columnId);
  }

  function handleSummaryChange(event) {
    const input = event.target.closest('[data-summary-action="toggle-service-filter"]');
    if (!input) return;
    excludeServiceExpensesFromSummary = input.checked;
    els.summaryContent.innerHTML = renderSummaryModal();
  }

  function openSummaryDialog() {
    els.summaryContent.innerHTML = renderSummaryModal();
    openDialog(els.summaryDialog);
  }

  function renderSummaryModal() {
    const summaryExpenses = getSummaryExpenses();
    const summaryExpenseIds = new Set(summaryExpenses.map(expense => expense.id));
    const serviceExpenseCount = state.expenses.filter(isServiceExpense).length;
    const excludedExpenseCount = state.expenses.length - summaryExpenses.length;
    const boardTotals = groupCurrency(summaryExpenses, "amount", "currency")
      .sort((a, b) => b.amount - a.amount);
    const assignedCount = summaryExpenses.filter(expense => expense.columnId !== "unassigned").length;
    const assignedPercentage = summaryExpenses.length ? assignedCount / summaryExpenses.length * 100 : 0;
    const activeGoalColumns = state.columns.filter(column => hasActiveGoal(getColumnGoal(column)));
    const labelledCount = summaryExpenses.filter(expense => normalizeLabel(expense.label) !== "none").length;
    const plannedCount = state.plannedExpenses.length;
    const matchedPlannedCount = state.plannedExpenses.filter(plan => getMatchedExpenseIds(plan).some(expenseId => summaryExpenseIds.has(expenseId))).length;
    const unmatchedPlannedCount = plannedCount - matchedPlannedCount;
    const closedPlannedCount = state.plannedExpenses.filter(plan => plan.closed === true).length;
    const openPlannedCount = plannedCount - closedPlannedCount;
    const matchedActualIds = new Set(
      state.plannedExpenses.flatMap(plan => getMatchedExpenseIds(plan))
        .filter(expenseId => summaryExpenseIds.has(expenseId))
    );
    const matchedActualCount = matchedActualIds.size;
    const unmatchedActualCount = Math.max(summaryExpenses.length - matchedActualCount, 0);
    const matchedActualRate = summaryExpenses.length ? matchedActualCount / summaryExpenses.length * 100 : 0;
    const unmatchedActualRate = summaryExpenses.length ? unmatchedActualCount / summaryExpenses.length * 100 : 0;
    const linkedActualCount = state.plannedExpenses.reduce((total, plan) => total + getMatchedExpenseIds(plan).filter(expenseId => summaryExpenseIds.has(expenseId)).length, 0);
    const plannedCurrencyStats = buildPlannedCurrencyStats(summaryExpenses);
    const originalCategoryCharts = renderOriginalCategoryCharts(summaryExpenses);
    const filterNote = excludeServiceExpensesFromSummary
      ? `Showing ${summaryExpenses.length} of ${state.expenses.length} actual expenses.`
      : `${serviceExpenseCount} Service ${pluralize(serviceExpenseCount, "expense", "expenses")} included.`;

    const overviewCards = [
      { label: "Expenses", value: String(summaryExpenses.length), note: excludeServiceExpensesFromSummary ? `${excludedExpenseCount} service excluded` : `${assignedCount} assigned` },
      { label: "Categorised", value: `${formatPercent(assignedPercentage)}%`, note: `${summaryExpenses.length - assignedCount} unassigned` },
      { label: "Matched actual", value: String(matchedActualCount), note: `${formatPercent(matchedActualRate)}% of all actual expenses` },
      { label: "Unmatched actual", value: String(unmatchedActualCount), note: `${formatPercent(unmatchedActualRate)}% of all actual expenses` },
      { label: "Currencies", value: String(boardTotals.length), note: boardTotals.map(item => item.currency).join(" · ") || "No expenses yet" },
      { label: "Planned", value: String(plannedCount), note: `${openPlannedCount} open · ${closedPlannedCount} closed · ${unmatchedPlannedCount} unmatched · ${linkedActualCount} linked tickets` },
      { label: "Active goals", value: String(activeGoalColumns.length), note: `${labelledCount} labelled tickets` }
    ].map(card => `
      <article class="stat-card">
        <span>${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <small>${escapeHtml(card.note)}</small>
      </article>
    `).join("");

    const totalsRows = boardTotals.map(total => {
      const matching = summaryExpenses.filter(expense => (normalizeCurrency(expense.currency) || "—") === total.currency);
      const largest = matching.reduce((max, expense) => Math.max(max, expense.amount || 0), 0);
      const average = matching.length ? total.amount / matching.length : 0;
      return `
        <tr>
          <td><strong>${escapeHtml(total.currency)}</strong></td>
          <td class="numeric">${formatMoney(total.amount)}</td>
          <td class="numeric">${matching.length}</td>
          <td class="numeric">${formatMoney(average)}</td>
          <td class="numeric">${formatMoney(largest)}</td>
        </tr>
      `;
    }).join("");

    const categoryRows = buildCategoryBreakdown(boardTotals, summaryExpenses).map(row => `
      <tr>
        <td><span class="summary-column-name"><span class="summary-column-dot" style="--summary-column-color:${escapeHtml(row.column.color)}"></span>${escapeHtml(row.column.title)}</span></td>
        <td><strong>${escapeHtml(row.currency)}</strong></td>
        <td class="numeric">${formatMoney(row.amount)}</td>
        <td class="numeric"><strong>${formatPercent(row.share)}%</strong></td>
        <td class="numeric">${row.count}</td>
      </tr>
    `).join("");

    const goalsMarkup = activeGoalColumns.length
      ? `<div class="goal-cards">${activeGoalColumns.map(column => renderSummaryGoalCard(column, summaryExpenses)).join("")}</div>`
      : `<div class="summary-empty">No column goals yet. Use the <strong>◎</strong> button in a column header to add a maximum share or exact transaction limit.</div>`;

    const plannedRows = plannedCurrencyStats.map(item => `
      <tr>
        <td><strong>${escapeHtml(item.currency)}</strong></td>
        <td class="numeric">${formatMoney(item.totalExpected)}</td>
        <td class="numeric">${formatMoney(item.matchedExpected)}</td>
        <td class="numeric">${formatMoney(item.matchedActual)}</td>
        <td class="numeric ${item.difference > 0 ? "planned-over-text" : item.difference < 0 ? "planned-under-text" : ""}">${item.comparableCount ? `${item.difference > 0 ? "+" : ""}${formatMoney(item.difference)}` : "—"}</td>
        <td class="numeric">${item.comparableCount}</td>
      </tr>
    `).join("");

    const labelRows = buildBoardLabelStats(boardTotals, summaryExpenses).map(item => `
      <tr>
        <td><span class="summary-label-name"><span class="label-dot ${item.label}"></span>${escapeHtml(labelTitle(item.label))}</span></td>
        <td><strong>${escapeHtml(item.currency)}</strong></td>
        <td class="numeric">${formatMoney(item.amount)}</td>
        <td class="numeric">${formatPercent(item.percentage)}%</td>
        <td class="numeric">${item.count}</td>
      </tr>
    `).join("");

    return `
      <section class="summary-options-panel">
        <label class="summary-option-toggle">
          <input type="checkbox" data-summary-action="toggle-service-filter" ${excludeServiceExpensesFromSummary ? "checked" : ""}>
          <span>Exclude Service expenses from summary</span>
          <small>${escapeHtml(filterNote)}</small>
        </label>
      </section>

      <div class="stats-grid">${overviewCards}</div>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Board totals</h3><p>Plain transaction sums are kept separate by currency.</p></div></div>
        ${totalsRows ? `<div class="table-scroll"><table class="stats-table"><thead><tr><th>Currency</th><th class="numeric">Total</th><th class="numeric">Tickets</th><th class="numeric">Average</th><th class="numeric">Largest</th></tr></thead><tbody>${totalsRows}</tbody></table></div>` : `<div class="summary-empty">Import or add expenses to see board totals.</div>`}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Planned vs matched</h3><p>Planned amounts are reported separately and never affect actual expense totals, shares, labels, or goals.</p></div></div>
        <div class="summary-inline-stats">
          <span><strong>${matchedActualCount}</strong> matched actual expenses</span>
          <span><strong>${formatPercent(matchedActualRate)}%</strong> matched by count</span>
          <span><strong>${unmatchedActualCount}</strong> unmatched actual expenses</span>
        </div>
        ${plannedRows ? `<div class="table-scroll"><table class="stats-table planned-stats-table"><thead><tr><th>Currency</th><th class="numeric">All planned</th><th class="numeric">Matched expected</th><th class="numeric">Matched actual</th><th class="numeric">Difference</th><th class="numeric">Comparable</th></tr></thead><tbody>${plannedRows}</tbody></table></div>` : `<div class="summary-empty">No planned expenses yet. Open a column's planned counter to add one.</div>`}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Column shares</h3><p>Each percentage is the column's share of all expenses in the same plain currency.</p></div></div>
        ${categoryRows ? `<div class="table-scroll"><table class="stats-table"><thead><tr><th>Column</th><th>Currency</th><th class="numeric">Amount</th><th class="numeric">Overall share</th><th class="numeric">Tickets</th></tr></thead><tbody>${categoryRows}</tbody></table></div>` : `<div class="summary-empty">No column statistics are available yet.</div>`}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Original category distribution</h3><p>Circle charts show each imported or entered Original Category as a percentage of plain transaction sums, separately for every currency.</p></div></div>
        ${originalCategoryCharts || `<div class="summary-empty">Add Original Category values to expenses to see the distribution.</div>`}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Goals</h3><p>Progress against each column's maximum share and exact transaction limit.</p></div></div>
        ${goalsMarkup}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Label distribution</h3><p>Ticket labels as a share of the board total in each currency.</p></div></div>
        ${labelRows ? `<div class="table-scroll"><table class="stats-table"><thead><tr><th>Label</th><th>Currency</th><th class="numeric">Amount</th><th class="numeric">Share</th><th class="numeric">Tickets</th></tr></thead><tbody>${labelRows}</tbody></table></div>` : `<div class="summary-empty">No label statistics are available yet.</div>`}
      </section>
    `;
  }

  function renderOriginalCategoryCharts(expenses = getSummaryExpenses()) {
    return Summary.buildOriginalCategoryStats(expenses, categoryChartColors).map(group => {
      let cursor = 0;
      const gradientStops = group.items.map(item => {
        const start = cursor;
        cursor += item.percentage;
        return `${item.color} ${start.toFixed(4)}% ${cursor.toFixed(4)}%`;
      }).join(", ");
      const legend = group.items.map(item => `
        <div class="category-chart-legend-row">
          <span class="category-chart-swatch" style="--category-chart-color:${item.color}"></span>
          <span class="category-chart-name" title="${escapeHtml(item.category)}">${escapeHtml(item.category)}</span>
          <strong>${formatPercent(item.percentage)}%</strong>
          <small>${formatMoney(item.amount)} ${escapeHtml(group.currency)}</small>
        </div>
      `).join("");

      return `
        <article class="category-chart-card">
          <div class="category-chart-card-header">
            <div><strong>${escapeHtml(group.currency)}</strong><span>${formatMoney(group.total)} total</span></div>
            <span>${group.items.length} ${pluralize(group.items.length, "category", "categories")}</span>
          </div>
          <div class="category-chart-layout">
            <div class="category-donut" style="--category-chart-gradient:conic-gradient(${gradientStops})" role="img" aria-label="Original category distribution for ${escapeHtml(group.currency)}">
              <div class="category-donut-center"><strong>${escapeHtml(group.currency)}</strong><span>100%</span></div>
            </div>
            <div class="category-chart-legend">${legend}</div>
          </div>
        </article>
      `;
    }).join("");
  }

  function buildPlannedCurrencyStats(expenses = getSummaryExpenses()) {
    return Summary.buildPlannedCurrencyStats(state.plannedExpenses, expenses);
  }

  function buildCategoryBreakdown(boardTotals, expenses = getSummaryExpenses()) {
    return Summary.buildCategoryBreakdown(state.columns, expenses, boardTotals, { getColumnGoal, hasActiveGoal });
  }

  function renderSummaryGoalCard(column, summaryExpenses = getSummaryExpenses()) {
    const goal = getColumnGoal(column);
    const expenses = summaryExpenses.filter(expense => expense.columnId === column.id);
    const currentAmount = getAmountForCurrency(expenses, goal.currency);
    const boardTotal = getAmountForCurrency(summaryExpenses, goal.currency);
    const currentShare = boardTotal ? currentAmount / boardTotal * 100 : 0;
    const metrics = [
      isFiniteNumber(goal.amountLimit)
        ? renderGoalProgress("Transaction limit", currentAmount, goal.amountLimit, goal.currency, false)
        : "",
      isFiniteNumber(goal.sharePercent)
        ? renderGoalProgress("Overall share", currentShare, goal.sharePercent, "%", true)
        : ""
    ].join("");

    return `
      <article class="goal-card" style="--goal-column-color:${escapeHtml(column.color)}">
        <div class="goal-card-heading">
          <div><span class="summary-column-name"><span class="summary-column-dot" style="--summary-column-color:${escapeHtml(column.color)}"></span><strong>${escapeHtml(column.title)}</strong></span><small>${escapeHtml(goal.currency)}</small></div>
          <button class="btn btn-compact" type="button" data-summary-action="edit-goal" data-column-id="${escapeHtml(column.id)}">Edit goal</button>
        </div>
        ${metrics}
      </article>
    `;
  }

  function renderGoalProgress(label, current, limit, unit, isPercentage) {
    const progress = limit > 0 ? current / limit * 100 : current > 0 ? 100 : 0;
    const status = goalStatusClass(current, limit);
    const currentText = isPercentage ? `${formatPercent(current)}%` : `${formatMoney(current)} ${escapeHtml(unit)}`;
    const limitText = isPercentage ? `${formatPercent(limit)}%` : `${formatMoney(limit)} ${escapeHtml(unit)}`;
    return `
      <div class="goal-metric">
        <div class="goal-metric-line"><span>${escapeHtml(label)}</span><strong class="${status}">${currentText} / ${limitText}</strong></div>
        <div class="progress-track"><span class="progress-fill ${status}" style="width:${Math.min(Math.max(progress, 0), 100)}%"></span></div>
        <div class="goal-metric-note">${progress <= 100 ? `${formatPercent(100 - progress)}% remaining` : `${formatPercent(progress - 100)}% over goal`}</div>
      </div>
    `;
  }

  function buildBoardLabelStats(boardTotals, expenses = getSummaryExpenses()) {
    return Summary.buildBoardLabelStats(expenses, boardTotals, labels);
  }

  function getSummaryExpenses() {
    return excludeServiceExpensesFromSummary
      ? state.expenses.filter(expense => !isServiceExpense(expense))
      : state.expenses;
  }

  function isServiceExpense(expense) {
    return normalizeLabel(expense?.label) === "blue";
  }


    return Object.freeze({
      handleSummaryChange,
      handleSummaryClick,
      openSummaryDialog,
      renderSummaryModal
    });
  }

  const api = Object.freeze({ createSummaryDialogController });

  if (typeof window !== "undefined") window.BudgetBoardSummaryDialogs = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
