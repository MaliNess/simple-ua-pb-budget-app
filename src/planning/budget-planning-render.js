(() => {
  "use strict";

  function createPlanningRenderer(deps) {
    const {
      getState,
      escapeHtml,
      formatMoney,
      formatPercent,
      pluralize,
      isFiniteNumber,
      normalizeCurrency,
      getCombinedActualAmountForCurrency,
      getMatchedExpenseIds,
      getMatchedExpenses,
      getPlannedPrices
    } = deps;

    function renderAllPlannedContent(plans, currencyTotals) {
      const state = getState();
      const openCount = plans.filter(plan => plan.closed !== true).length;
      const closedCount = plans.length - openCount;
      const matchedCount = plans.filter(plan => getMatchedExpenseIds(plan).length > 0).length;
      const linkedActualCount = plans.reduce((sum, plan) => sum + getMatchedExpenseIds(plan).length, 0);

      const overview = [
        { label: "Planned", value: plans.length, note: `${openCount} open · ${closedCount} closed` },
        { label: "Matched plans", value: matchedCount, note: `${plans.length ? formatPercent(matchedCount / plans.length * 100) : "0"}% of plans` },
        { label: "Linked actuals", value: linkedActualCount, note: `${Math.max(state.expenses.length - linkedActualCount, 0)} actuals not linked` },
        { label: "Columns", value: new Set(plans.map(plan => plan.columnId)).size, note: `${state.columns.length} board columns` }
      ].map(item => `
        <article class="stat-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(String(item.value))}</strong>
          <small>${escapeHtml(item.note)}</small>
        </article>
      `).join("");

      const currencyMarkup = currencyTotals.length ? `
        <section class="summary-panel all-planned-totals-panel">
          <div class="summary-panel-heading"><div><h3>Overall planned sums</h3><p>Expected, matched actual, and still remaining amounts are kept separate by currency.</p></div></div>
          <div class="table-scroll"><table class="stats-table"><thead><tr><th>Currency</th><th class="numeric">Expected</th><th class="numeric">Matched actual</th><th class="numeric">Open remaining</th><th class="numeric">Plans</th></tr></thead><tbody>
            ${currencyTotals.map(item => `<tr><td><strong>${escapeHtml(item.currency)}</strong></td><td class="numeric">${formatMoney(item.expected)}</td><td class="numeric">${formatMoney(item.actual)}</td><td class="numeric">${formatMoney(item.remaining)}</td><td class="numeric">${item.planCount}</td></tr>`).join("")}
          </tbody></table></div>
        </section>
      ` : "";

      return `
        <div class="stats-grid">${overview}</div>
        ${currencyMarkup}
        <section class="all-planned-list-section">
          <div class="all-planned-section-heading"><div><h3>Planned expense list</h3><p>Edit a plan, change its matches, or close/reopen it directly here.</p></div></div>
          <div class="all-planned-list">
            ${plans.length ? plans.map(renderAllPlannedRow).join("") : `<div class="summary-empty"><strong>No planned expenses yet.</strong><br>Add one from a column header.</div>`}
          </div>
        </section>
      `;
    }

    function renderAllPlannedRow(plan) {
      const state = getState();
      const column = state.columns.find(item => item.id === plan.columnId) || state.columns[0];
      const actuals = getMatchedExpenses(plan);
      const linkedCount = actuals.length;
      const prices = [
        isFiniteNumber(plan.amount1) ? { name: "Price 1", amount: plan.amount1, currency: normalizeCurrency(plan.currency1) || "—" } : null,
        isFiniteNumber(plan.amount2) ? { name: "Price 2", amount: plan.amount2, currency: normalizeCurrency(plan.currency2) || "—" } : null
      ].filter(Boolean);
      const priceCards = prices.map(price => {
        const actualAmount = getCombinedActualAmountForCurrency(actuals, price.currency);
        const matchedAmount = isFiniteNumber(actualAmount) ? actualAmount : 0;
        const percentage = price.amount > 0 ? matchedAmount / price.amount * 100 : (matchedAmount > 0 ? 100 : 0);
        const remaining = plan.closed === true ? 0 : Math.max(price.amount - matchedAmount, 0);
        return `
          <div class="all-planned-price">
            <div class="all-planned-price-heading"><strong>${escapeHtml(price.name)} · ${escapeHtml(price.currency)}</strong><span>${formatPercent(percentage)}% matched</span></div>
            <div class="all-planned-price-values"><span>Planned <strong>${formatMoney(price.amount)}</strong></span><span>Actual <strong>${formatMoney(matchedAmount)}</strong></span><span>Remaining <strong>${formatMoney(remaining)}</strong></span></div>
            <div class="all-planned-progress"><span style="width:${Math.min(Math.max(percentage, 0), 100)}%"></span></div>
          </div>
        `;
      }).join("");
      const primaryCurrency = normalizeCurrency(plan.currency1) || "—";
      const primaryActual = getCombinedActualAmountForCurrency(actuals, primaryCurrency) || 0;
      const primaryPercentage = isFiniteNumber(plan.amount1) && plan.amount1 > 0 ? primaryActual / plan.amount1 * 100 : 0;

      return `
        <article class="all-planned-row ${plan.closed ? "is-closed" : "is-open"}" data-planned-id="${escapeHtml(plan.id)}" style="--planned-column-color:${escapeHtml(column?.color || "#64748b")}">
          <div class="all-planned-row-heading">
            <div class="all-planned-row-title">
              <span class="all-planned-column"><span class="summary-column-dot" style="--summary-column-color:${escapeHtml(column?.color || "#64748b")}"></span>${escapeHtml(column?.title || "Unassigned")}</span>
              <h3>${escapeHtml(plan.description)}</h3>
              <span class="all-planned-row-meta">${linkedCount} linked actual ${pluralize(linkedCount, "expense", "expenses")} · ${formatPercent(primaryPercentage)}% of price 1 matched · ${plan.closed ? "Closed" : "Open"}</span>
            </div>
            <div class="all-planned-row-actions">
              <label class="planned-card-closed-check" title="Closed plans are excluded from remaining planned totals">
                <input type="checkbox" data-all-planned-action="toggle-closed" data-planned-id="${escapeHtml(plan.id)}" ${plan.closed ? "checked" : ""}>
                <span>Closed</span>
              </label>
              <button class="btn btn-compact" type="button" data-all-planned-action="edit" data-planned-id="${escapeHtml(plan.id)}">Edit</button>
              <button class="btn btn-compact ${linkedCount ? "" : "btn-primary"}" type="button" data-all-planned-action="match" data-planned-id="${escapeHtml(plan.id)}">${linkedCount ? "Edit matches" : "Match actuals"}</button>
              <button class="icon-btn danger" type="button" data-all-planned-action="delete" data-planned-id="${escapeHtml(plan.id)}" title="Delete planned expense">Г—</button>
            </div>
          </div>
          <div class="all-planned-price-grid">${priceCards}</div>
        </article>
      `;
    }

    function renderPlannedCard(plan) {
      const actuals = getMatchedExpenses(plan);
      const matched = actuals.length > 0;
      const prices = getPlannedPrices(plan);
      const expectedMarkup = prices.map(price => `<span>${formatMoney(price.amount)} ${escapeHtml(price.currency)}</span>`).join("");
      const comparisons = matched ? renderPlanComparisons(plan, actuals) : "";
      const actualMarkup = actuals.map(actual => `
        <button class="planned-actual-item" type="button" data-planned-action="open-actual" data-expense-id="${escapeHtml(actual.id)}" title="Open this actual expense">
          <strong>${escapeHtml(actual.description)}</strong>
          <small>${escapeHtml(actual.date || "No date")} · ${formatMoney(actual.amount)} ${escapeHtml(actual.currency || "")}</small>
        </button>
      `).join("");

      return `
        <article class="planned-card ${matched ? "is-matched" : "is-unmatched"} ${plan.closed ? "is-closed" : "is-open"}" data-planned-id="${escapeHtml(plan.id)}">
          <div class="planned-card-heading">
            <div class="planned-card-title-wrap">
              <div class="planned-status-row">
                <span class="planned-status ${matched ? "matched" : "unmatched"}">${matched ? `Matched · ${actuals.length}` : "Unmatched"}</span>
                <span class="planned-status ${plan.closed ? "closed" : "open"}">${plan.closed ? "Closed" : "Open"}</span>
              </div>
              <h3>${escapeHtml(plan.description)}</h3>
            </div>
            <div class="planned-card-actions">
              <label class="planned-card-closed-check" title="Closed plans are excluded from the remaining planned total">
                <input type="checkbox" data-planned-action="toggle-closed" data-planned-id="${escapeHtml(plan.id)}" ${plan.closed ? "checked" : ""}>
                <span>Closed</span>
              </label>
              <button class="btn btn-compact" type="button" data-planned-action="edit" data-planned-id="${escapeHtml(plan.id)}">Edit</button>
              <button class="btn btn-compact ${matched ? "" : "btn-primary"}" type="button" data-planned-action="match" data-planned-id="${escapeHtml(plan.id)}">${matched ? "Edit matches" : "Match actuals"}</button>
              <button class="icon-btn danger" type="button" data-planned-action="delete" data-planned-id="${escapeHtml(plan.id)}" title="Delete planned expense">Г—</button>
            </div>
          </div>
          <div class="planned-expected"><span>Expected</span><div>${expectedMarkup}</div></div>
          ${matched ? `
            <div class="planned-actual-group">
              <span class="planned-actual-group-label">Actual expenses (${actuals.length})</span>
              <div class="planned-actual-list">${actualMarkup}</div>
            </div>
            <div class="planned-comparisons">${comparisons}</div>
          ` : `<div class="planned-awaiting">Waiting for one or more actual expenses to be matched.</div>`}
        </article>
      `;
    }

    function renderPlanComparisons(plan, actuals) {
      const matchedActuals = Array.isArray(actuals) ? actuals : (actuals ? [actuals] : []);
      return getPlannedPrices(plan).map(price => {
        const actualAmount = getCombinedActualAmountForCurrency(matchedActuals, price.currency);
        if (!isFiniteNumber(actualAmount)) {
          return `<div class="planned-comparison unavailable"><span>${escapeHtml(price.currency)}</span><strong>Expected ${formatMoney(price.amount)}</strong><small>No actual value in this currency</small></div>`;
        }
        const difference = actualAmount - price.amount;
        const percentage = price.amount ? difference / price.amount * 100 : 0;
        const status = difference > 0 ? "over" : difference < 0 ? "under" : "exact";
        const sign = difference > 0 ? "+" : "";
        const percentSign = percentage > 0 ? "+" : "";
        return `<div class="planned-comparison ${status}"><span>${escapeHtml(price.currency)}</span><strong>${formatMoney(actualAmount)} of ${formatMoney(price.amount)}</strong><small>${sign}${formatMoney(difference)} · ${percentSign}${formatPercent(percentage)}%</small></div>`;
      }).join("");
    }

    function renderPlannedMatchPreview(plan, actuals) {
      if (!plan || !actuals.length) {
        return `<div class="summary-empty">Select one or more actual expenses from this column.</div>`;
      }
      const selectedMarkup = actuals.map(actual => `
        <div class="planned-match-selected">
          <strong>${escapeHtml(actual.description)}</strong>
          <span>${escapeHtml(actual.date || "No date")} · ${formatMoney(actual.amount)} ${escapeHtml(actual.currency || "")}</span>
        </div>
      `).join("");
      return `
        <div class="planned-match-selected-list">${selectedMarkup}</div>
        <div class="planned-comparisons">${renderPlanComparisons(plan, actuals)}</div>
      `;
    }

    function formatExpenseOption(expense) {
      return `${expense.date || "No date"} · ${formatMoney(expense.amount)} ${expense.currency || ""} · ${expense.description}`;
    }

    return Object.freeze({
      formatExpenseOption,
      renderAllPlannedContent,
      renderAllPlannedRow,
      renderPlanComparisons,
      renderPlannedCard,
      renderPlannedMatchPreview
    });
  }

  const api = Object.freeze({ createPlanningRenderer });

  if (typeof window !== "undefined") window.BudgetBoardPlanningRender = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
