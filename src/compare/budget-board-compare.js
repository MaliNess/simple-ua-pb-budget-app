(() => {
  "use strict";

  const Config = globalThis.BudgetBoardConfig || (typeof require === "function" ? require("../app/budget-config.js") : null);
  const Core = globalThis.BudgetBoardCore || (typeof require === "function" ? require("../core/budget-core.js") : null);
  const StateTools = globalThis.BudgetBoardState || (typeof require === "function" ? require("../state/budget-state.js") : null);
  const ImportExport = globalThis.BudgetBoardImportExport || (typeof require === "function" ? require("../import/budget-import-export.js") : null);
  const Tickets = globalThis.BudgetBoardTickets || (typeof require === "function" ? require("../tickets/budget-tickets.js") : null);
  const Summary = globalThis.BudgetBoardSummary || (typeof require === "function" ? require("../summary/budget-summary.js") : null);
  const Ui = globalThis.BudgetBoardUi || (typeof require === "function" ? require("../app/budget-ui.js") : null);

  if (!Config || !Core || !StateTools || !ImportExport || !Tickets || !Summary || !Ui) {
    throw new Error("Budget board comparison dependencies must be loaded before budget-board-compare.js.");
  }

  const stateOptions = Object.freeze({
    stateVersion: Config.STATE_VERSION,
    defaultCurrencies: Config.DEFAULT_CURRENCIES,
    defaultSortMode: Config.DEFAULT_SORT_MODE,
    sortModes: Config.SORT_MODES,
    labels: Config.LABELS,
    defaultColumnIcon: () => "wallet",
    normalizeColumnIcon: value => String(value || "wallet").trim() || "wallet"
  });

  function sanitizeBoardPayload(parsed) {
    const candidate = ImportExport.getRestoreCandidate(parsed);
    const state = StateTools.sanitizeState(candidate, stateOptions);
    if (!state) throw new Error("This file is not a valid Budget Board backup.");
    return state;
  }

  function summarizeBoard(state, label = "Board", options = {}) {
    const expenses = options.excludeService === true
      ? state.expenses.filter(expense => !isServiceExpense(expense))
      : state.expenses;
    const actualTotals = Tickets.groupCurrency(expenses, "amount", "currency");
    const initialTotals = Tickets.groupCurrency(expenses, "initialAmount", "initialCurrency");
    const counts = Summary.buildSummaryCounts(expenses, state.plannedExpenses);
    const plannedStats = Summary.buildPlannedCurrencyStats(state.plannedExpenses, expenses);
    const labelStats = Summary.buildBoardLabelStats(expenses, actualTotals, Config.LABELS);
    const columnShareStats = buildColumnShareStats(state, expenses, actualTotals);
    const originalCategoryStats = buildOriginalCategoryDistribution(expenses, actualTotals);
    const goalStats = buildGoalStats(state, expenses, actualTotals);
    const latestExpenseDate = getLatestExpenseDate(expenses);

    return {
      label,
      state,
      expenses,
      actualTotals,
      initialTotals,
      counts,
      plannedStats,
      labelStats,
      columnShareStats,
      originalCategoryStats,
      goalStats,
      latestExpenseDate,
      columnCount: state.columns.filter(column => !column.locked).length
    };
  }

  function renderComparison(leftState, rightState, options = {}) {
    const summaryOptions = { excludeService: options.excludeService === true };
    const left = summarizeBoard(leftState, options.leftLabel || "Previous", summaryOptions);
    const right = summarizeBoard(rightState, options.rightLabel || "Current", summaryOptions);

    return `
      <div class="compare-board-names">
        <div><span>Previous</span><strong>${Ui.escapeHtml(left.label)}</strong><small>${Ui.escapeHtml(left.latestExpenseDate || "No ticket dates")}</small></div>
        <div><span>Current</span><strong>${Ui.escapeHtml(right.label)}</strong><small>${Ui.escapeHtml(right.latestExpenseDate || "No ticket dates")}</small></div>
      </div>
      <div class="stats-grid compare-stats-grid">${renderOverviewCards(left, right)}</div>
      ${renderAmountComparisonPanel("Actual totals", "Plain transaction totals grouped by currency.", compareAmountGroups(left.actualTotals, right.actualTotals))}
      ${renderAmountComparisonPanel("Initial totals", "Initial imported transaction totals grouped by original currency.", compareAmountGroups(left.initialTotals, right.initialTotals))}
      ${renderPlannedComparison(left, right)}
      ${renderColumnStatsComparison(left, right)}
      ${renderOriginalCategoryComparison(left, right)}
      ${renderGoalComparison(left, right)}
      ${renderLabelComparison(left, right)}
    `;
  }

  function renderOverviewCards(left, right) {
    return [
      compareMetric("Expenses", left.expenses.length, right.expenses.length),
      compareMetric("Columns", left.columnCount, right.columnCount),
      compareMetric("Planned", left.state.plannedExpenses.length, right.state.plannedExpenses.length),
      compareMetric("Open plans", left.counts.openPlannedCount, right.counts.openPlannedCount),
      compareMetric("Matched actuals", left.counts.matchedActualCount, right.counts.matchedActualCount, shareDeltaClass),
      compareMetric("Unmatched actuals", left.counts.unmatchedActualCount, right.counts.unmatchedActualCount)
    ].map(card => `
      <article class="stat-card compare-stat-card">
        <span>${Ui.escapeHtml(card.label)}</span>
        <strong>${Ui.escapeHtml(String(card.right))}</strong>
        <small>Previous ${Ui.escapeHtml(String(card.left))} - Delta <span class="${card.deltaClass}">${formatDelta(card.delta)}</span></small>
      </article>
    `).join("");
  }

  function compareMetric(label, left, right, classForDelta = expenseDeltaClass) {
    const delta = right - left;
    return { label, left, right, delta, deltaClass: classForDelta(delta) };
  }

  function renderAmountComparisonPanel(title, note, rows) {
    return `
      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>${Ui.escapeHtml(title)}</h3><p>${Ui.escapeHtml(note)}</p></div></div>
        ${rows.length ? `<div class="table-scroll"><table class="stats-table compare-table"><thead><tr><th>Currency</th><th class="numeric">Previous</th><th class="numeric">Current</th><th class="numeric">Delta</th></tr></thead><tbody>${rows.map(row => `
          <tr>
            <td><strong>${Ui.escapeHtml(row.key)}</strong></td>
            <td class="numeric">${Core.formatMoney(row.left)}</td>
            <td class="numeric">${Core.formatMoney(row.right)}</td>
            <td class="numeric ${expenseDeltaClass(row.delta)}">${formatMoneyDelta(row.delta)}</td>
          </tr>
        `).join("")}</tbody></table></div>` : `<div class="summary-empty">No comparable totals.</div>`}
      </section>
    `;
  }

  function renderPlannedComparison(left, right) {
    const rows = comparePlannedStats(left.plannedStats, right.plannedStats);
    return `
      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Planned comparison</h3><p>Expected plan totals and matched actual totals by currency.</p></div></div>
        ${rows.length ? `<div class="table-scroll"><table class="stats-table compare-table compare-wide-table"><thead><tr><th>Currency</th><th class="numeric">Expected previous</th><th class="numeric">Expected current</th><th class="numeric">Expected delta</th><th class="numeric">Matched previous</th><th class="numeric">Matched current</th><th class="numeric">Matched delta</th></tr></thead><tbody>${rows.map(row => `
          <tr>
            <td><strong>${Ui.escapeHtml(row.currency)}</strong></td>
            <td class="numeric">${Core.formatMoney(row.leftExpected)}</td>
            <td class="numeric">${Core.formatMoney(row.rightExpected)}</td>
            <td class="numeric ${expenseDeltaClass(row.expectedDelta)}">${formatMoneyDelta(row.expectedDelta)}</td>
            <td class="numeric">${Core.formatMoney(row.leftMatched)}</td>
            <td class="numeric">${Core.formatMoney(row.rightMatched)}</td>
            <td class="numeric ${expenseDeltaClass(row.matchedDelta)}">${formatMoneyDelta(row.matchedDelta)}</td>
          </tr>
        `).join("")}</tbody></table></div>` : `<div class="summary-empty">No planned expenses to compare.</div>`}
      </section>
    `;
  }

  function renderLabelComparison(left, right) {
    const rows = compareShareStats(left.labelStats, right.labelStats, item => `${item.label}|${item.currency}`);
    return `
      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Label stats</h3><p>Actual totals and shares by ticket label and currency.</p></div></div>
        ${rows.length ? `<div class="table-scroll"><table class="stats-table compare-table compare-wide-table"><thead><tr><th>Label</th><th>Currency</th><th class="numeric">Amount previous</th><th class="numeric">Share previous</th><th class="numeric">Amount current</th><th class="numeric">Share current</th><th class="numeric">Amount delta</th><th class="numeric">Share delta</th></tr></thead><tbody>${rows.map(row => {
          const [label, currency] = row.key.split("|");
          return `
            <tr>
              <td>${Ui.escapeHtml(Config.LABEL_TITLES[label] || label)}</td>
              <td><strong>${Ui.escapeHtml(currency)}</strong></td>
              <td class="numeric">${Core.formatMoney(row.leftAmount)}</td>
              <td class="numeric">${Core.formatPercent(row.leftShare)}%</td>
              <td class="numeric">${Core.formatMoney(row.rightAmount)}</td>
              <td class="numeric">${Core.formatPercent(row.rightShare)}%</td>
              <td class="numeric ${expenseDeltaClass(row.amountDelta)}">${formatMoneyDelta(row.amountDelta)}</td>
              <td class="numeric ${shareDeltaClass(row.shareDelta)}">${formatPercentDelta(row.shareDelta)}</td>
            </tr>
          `;
        }).join("")}</tbody></table></div>` : `<div class="summary-empty">No label stats to compare.</div>`}
      </section>
    `;
  }

  function renderColumnStatsComparison(left, right) {
    const rows = compareShareStats(left.columnShareStats, right.columnShareStats, item => `${item.columnTitle}|${item.currency}`);
    return `
      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Column stats</h3><p>Actual totals and column shares in the same currency.</p></div></div>
        ${rows.length ? `<div class="table-scroll"><table class="stats-table compare-table compare-wide-table"><thead><tr><th>Column</th><th>Currency</th><th class="numeric">Amount previous</th><th class="numeric">Share previous</th><th class="numeric">Amount current</th><th class="numeric">Share current</th><th class="numeric">Amount delta</th><th class="numeric">Share delta</th></tr></thead><tbody>${rows.map(row => {
          const [columnTitle, currency] = row.key.split("|");
          return `
            <tr>
              <td>${Ui.escapeHtml(columnTitle)}</td>
              <td><strong>${Ui.escapeHtml(currency)}</strong></td>
              <td class="numeric">${Core.formatMoney(row.leftAmount)}</td>
              <td class="numeric">${Core.formatPercent(row.leftShare)}%</td>
              <td class="numeric">${Core.formatMoney(row.rightAmount)}</td>
              <td class="numeric">${Core.formatPercent(row.rightShare)}%</td>
              <td class="numeric ${expenseDeltaClass(row.amountDelta)}">${formatMoneyDelta(row.amountDelta)}</td>
              <td class="numeric ${shareDeltaClass(row.shareDelta)}">${formatPercentDelta(row.shareDelta)}</td>
            </tr>
          `;
        }).join("")}</tbody></table></div>` : `<div class="summary-empty">No column stats to compare.</div>`}
      </section>
    `;
  }

  function renderOriginalCategoryComparison(left, right) {
    const rows = compareShareStats(left.originalCategoryStats, right.originalCategoryStats, item => `${item.category}|${item.currency}`);
    return `
      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Original category distribution</h3><p>Imported or entered Original Category totals and shares by currency.</p></div></div>
        ${rows.length ? `<div class="table-scroll"><table class="stats-table compare-table compare-wide-table"><thead><tr><th>Original category</th><th>Currency</th><th class="numeric">Amount previous</th><th class="numeric">Share previous</th><th class="numeric">Amount current</th><th class="numeric">Share current</th><th class="numeric">Amount delta</th><th class="numeric">Share delta</th></tr></thead><tbody>${rows.map(row => {
          const [category, currency] = row.key.split("|");
          return `
            <tr>
              <td>${Ui.escapeHtml(category)}</td>
              <td><strong>${Ui.escapeHtml(currency)}</strong></td>
              <td class="numeric">${Core.formatMoney(row.leftAmount)}</td>
              <td class="numeric">${Core.formatPercent(row.leftShare)}%</td>
              <td class="numeric">${Core.formatMoney(row.rightAmount)}</td>
              <td class="numeric">${Core.formatPercent(row.rightShare)}%</td>
              <td class="numeric ${expenseDeltaClass(row.amountDelta)}">${formatMoneyDelta(row.amountDelta)}</td>
              <td class="numeric ${shareDeltaClass(row.shareDelta)}">${formatPercentDelta(row.shareDelta)}</td>
            </tr>
          `;
        }).join("")}</tbody></table></div>` : `<div class="summary-empty">No Original Category values to compare.</div>`}
      </section>
    `;
  }

  function renderGoalComparison(left, right) {
    const rows = compareGoalStats(left.goalStats, right.goalStats);
    return `
      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Goal actual amounts</h3><p>Actual amounts and shares for matching column goals by column title and goal currency.</p></div></div>
        ${rows.length ? `<div class="table-scroll"><table class="stats-table compare-table compare-wide-table"><thead><tr><th>Goal</th><th>Currency</th><th class="numeric">Actual previous</th><th class="numeric">Actual current</th><th class="numeric">Actual delta</th><th class="numeric">Share previous</th><th class="numeric">Share current</th><th>Targets</th></tr></thead><tbody>${rows.map(row => `
          <tr>
            <td>${Ui.escapeHtml(row.columnTitle)}</td>
            <td><strong>${Ui.escapeHtml(row.currency)}</strong></td>
            <td class="numeric">${Core.formatMoney(row.leftAmount)}</td>
            <td class="numeric">${Core.formatMoney(row.rightAmount)}</td>
            <td class="numeric ${expenseDeltaClass(row.amountDelta)}">${formatMoneyDelta(row.amountDelta)}</td>
            <td class="numeric">${Core.formatPercent(row.leftShare)}%</td>
            <td class="numeric">${Core.formatPercent(row.rightShare)}%</td>
            <td>${Ui.escapeHtml(row.targetText)}</td>
          </tr>
        `).join("")}</tbody></table></div>` : `<div class="summary-empty">No active goals to compare.</div>`}
      </section>
    `;
  }

  function compareAmountGroups(left, right) {
    return compareByCompositeKey(left, right, item => item.currency, item => item.amount);
  }

  function comparePlannedStats(left, right) {
    const rows = compareByCompositeKey(left, right, item => item.currency, item => item);
    return rows.map(row => {
      const leftValue = row.leftRaw || {};
      const rightValue = row.rightRaw || {};
      const leftExpected = leftValue.totalExpected || 0;
      const rightExpected = rightValue.totalExpected || 0;
      const leftMatched = leftValue.matchedActual || 0;
      const rightMatched = rightValue.matchedActual || 0;
      return {
        currency: row.key,
        leftExpected,
        rightExpected,
        expectedDelta: rightExpected - leftExpected,
        leftMatched,
        rightMatched,
        matchedDelta: rightMatched - leftMatched
      };
    });
  }

  function compareShareStats(left, right, keyFn) {
    const leftMap = toMap(left, keyFn, item => item);
    const rightMap = toMap(right, keyFn, item => item);
    return [...new Set([...leftMap.keys(), ...rightMap.keys()])]
      .sort((a, b) => a.localeCompare(b))
      .map(key => {
        const leftValue = leftMap.get(key) || {};
        const rightValue = rightMap.get(key) || {};
        const leftShare = getShareValue(leftValue);
        const rightShare = getShareValue(rightValue);
        return {
          key,
          leftAmount: leftValue.amount || 0,
          rightAmount: rightValue.amount || 0,
          amountDelta: (rightValue.amount || 0) - (leftValue.amount || 0),
          leftShare,
          rightShare,
          shareDelta: rightShare - leftShare
        };
      });
  }

  function getShareValue(value) {
    if (Core.isFiniteNumber(value?.share)) return value.share;
    if (Core.isFiniteNumber(value?.percentage)) return value.percentage;
    return 0;
  }

  function compareGoalStats(left, right) {
    const leftMap = toMap(left, item => `${item.columnTitle}|${item.currency}`, item => item);
    const rightMap = toMap(right, item => `${item.columnTitle}|${item.currency}`, item => item);
    return [...new Set([...leftMap.keys(), ...rightMap.keys()])]
      .sort((a, b) => a.localeCompare(b))
      .map(key => {
        const [columnTitle, currency] = key.split("|");
        const leftValue = leftMap.get(key) || {};
        const rightValue = rightMap.get(key) || {};
        const leftAmount = leftValue.amount || 0;
        const rightAmount = rightValue.amount || 0;
        return {
          columnTitle,
          currency,
          leftAmount,
          rightAmount,
          amountDelta: rightAmount - leftAmount,
          leftShare: leftValue.share || 0,
          rightShare: rightValue.share || 0,
          targetText: [
            leftValue.targetText ? `Previous: ${leftValue.targetText}` : "",
            rightValue.targetText ? `Current: ${rightValue.targetText}` : ""
          ].filter(Boolean).join(" | ")
        };
      });
  }

  function compareByCompositeKey(leftItems, rightItems, keyFn, valueFn) {
    const leftMap = toMap(leftItems, keyFn, valueFn);
    const rightMap = toMap(rightItems, keyFn, valueFn);
    return [...new Set([...leftMap.keys(), ...rightMap.keys()])]
      .sort((a, b) => a.localeCompare(b))
      .map(key => {
        const leftRaw = leftMap.get(key);
        const rightRaw = rightMap.get(key);
        const left = typeof leftRaw === "number" ? leftRaw : 0;
        const right = typeof rightRaw === "number" ? rightRaw : 0;
        return { key, left, right, delta: right - left, leftRaw, rightRaw };
      });
  }

  function toMap(items, keyFn, valueFn) {
    const map = new Map();
    for (const item of items || []) map.set(keyFn(item), valueFn(item));
    return map;
  }

  function buildColumnShareStats(state, expenses, actualTotals) {
    return Summary.buildCategoryBreakdown(state.columns, expenses, actualTotals)
      .map(row => ({
        columnTitle: row.column.title,
        currency: row.currency,
        amount: row.amount,
        share: row.share
      }));
  }

  function buildOriginalCategoryDistribution(expenses, actualTotals) {
    const boardTotals = new Map(actualTotals.map(total => [total.currency, total.amount]));
    const grouped = new Map();
    expenses.forEach(expense => {
      if (!Core.isFiniteNumber(expense.amount)) return;
      const currency = Core.normalizeCurrency(expense.currency) || "-";
      const category = Core.cellText(expense.originalCategory) || "Uncategorised";
      const key = `${category}|${currency}`;
      grouped.set(key, (grouped.get(key) || 0) + expense.amount);
    });
    return [...grouped.entries()].map(([key, amount]) => {
      const [category, currency] = key.split("|");
      const total = boardTotals.get(currency) || 0;
      return {
        category,
        currency,
        amount,
        share: total ? amount / total * 100 : 0
      };
    }).sort((a, b) => a.currency.localeCompare(b.currency) || b.amount - a.amount);
  }

  function buildGoalStats(state, expenses, actualTotals) {
    const boardTotals = new Map(actualTotals.map(total => [total.currency, total.amount]));
    return state.columns
      .filter(column => hasActiveGoal(column.goal))
      .map(column => {
        const currency = Core.normalizeCurrency(column.goal.currency) || "UAH";
        const columnExpenses = expenses.filter(expense => expense.columnId === column.id);
        const amount = Summary.getAmountForCurrency(columnExpenses, currency);
        const boardTotal = boardTotals.get(currency) || 0;
        return {
          columnTitle: column.title,
          currency,
          amount,
          share: boardTotal ? amount / boardTotal * 100 : 0,
          targetText: formatGoalTarget(column.goal)
        };
      });
  }

  function hasActiveGoal(goal) {
    return Core.isFiniteNumber(goal?.sharePercent) || Core.isFiniteNumber(goal?.amountLimit);
  }

  function isServiceExpense(expense) {
    return Tickets.normalizeLabel(expense?.label, Config.LABELS) === "blue";
  }

  function formatGoalTarget(goal) {
    const parts = [];
    if (Core.isFiniteNumber(goal?.amountLimit)) parts.push(`limit ${Core.formatMoney(goal.amountLimit)}`);
    if (Core.isFiniteNumber(goal?.sharePercent)) parts.push(`share ${Core.formatPercent(goal.sharePercent)}%`);
    return parts.join(", ");
  }

  function getLatestExpenseDate(expenses) {
    const latest = expenses.reduce((current, expense) => {
      const timestamp = Core.parseDateForSort(expense.date);
      if (!timestamp || timestamp <= (current?.timestamp || 0)) return current;
      return { timestamp, date: Core.cellText(expense.date) };
    }, null);
    return latest?.date || "";
  }

  function formatDelta(value) {
    return `${value > 0 ? "+" : ""}${value}`;
  }

  function formatMoneyDelta(value) {
    return `${value > 0 ? "+" : ""}${Core.formatMoney(value)}`;
  }

  function formatPercentDelta(value) {
    return `${value > 0 ? "+" : ""}${Core.formatPercent(value)}%`;
  }

  function expenseDeltaClass(value) {
    return value > 0 ? "compare-delta-down" : value < 0 ? "compare-delta-up" : "";
  }

  function shareDeltaClass(value) {
    return value > 0 ? "compare-delta-up" : value < 0 ? "compare-delta-down" : "";
  }

  function initBrowserComparison(documentRef = document) {
    const leftInput = documentRef.getElementById("compareBoardA");
    const rightInput = documentRef.getElementById("compareBoardB");
    const excludeServiceInput = documentRef.getElementById("compareExcludeService");
    const leftStatus = documentRef.getElementById("compareBoardAStatus");
    const rightStatus = documentRef.getElementById("compareBoardBStatus");
    const content = documentRef.getElementById("compareContent");
    if (!leftInput || !rightInput || !content) return;

    const selected = { left: null, right: null, excludeService: excludeServiceInput?.checked === true };
    leftInput.addEventListener("change", () => loadSelectedFile(leftInput, "left", leftStatus, selected, content));
    rightInput.addEventListener("change", () => loadSelectedFile(rightInput, "right", rightStatus, selected, content));
    excludeServiceInput?.addEventListener("change", () => {
      selected.excludeService = excludeServiceInput.checked;
      renderBrowserContent(selected, content);
    });
  }

  async function loadSelectedFile(input, side, status, selected, content) {
    const file = input.files?.[0];
    selected[side] = null;
    if (!file) {
      setStatus(status, "No file selected.", false);
      renderBrowserContent(selected, content);
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      selected[side] = {
        label: file.name,
        state: sanitizeBoardPayload(parsed)
      };
      setStatus(status, `${file.name} loaded.`, true);
    } catch (error) {
      setStatus(status, error.message || "Could not read this board backup.", false);
    }
    renderBrowserContent(selected, content);
  }

  function renderBrowserContent(selected, content) {
    if (!selected.left || !selected.right) {
      content.innerHTML = `<div class="summary-empty">Choose two exported board JSON backups to compare their summaries.</div>`;
      return;
    }
    content.innerHTML = renderComparison(selected.left.state, selected.right.state, {
      leftLabel: selected.left.label,
      rightLabel: selected.right.label,
      excludeService: selected.excludeService === true
    });
  }

  function setStatus(element, message, success) {
    if (!element) return;
    element.textContent = message;
    element.className = `compare-file-status ${success ? "success" : "error"}`;
  }

  const api = Object.freeze({
    compareAmountGroups,
    compareByCompositeKey,
    renderComparison,
    sanitizeBoardPayload,
    summarizeBoard,
    initBrowserComparison
  });

  if (typeof window !== "undefined") {
    window.BudgetBoardCompare = api;
    window.addEventListener("DOMContentLoaded", () => initBrowserComparison());
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
