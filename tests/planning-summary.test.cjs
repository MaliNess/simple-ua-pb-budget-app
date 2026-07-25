const assert = require("node:assert/strict");
const core = require("../src/core/budget-core.js");
globalThis.BudgetBoardCore = core;
globalThis.BudgetBoardTickets = require("../src/tickets/budget-tickets.js");
globalThis.BudgetBoardPlanning = require("../src/planning/budget-planning.js");

const planning = require("../src/planning/budget-planning.js");
const planningDialogs = require("../src/planning/budget-planning-dialogs.js");
const summary = require("../src/summary/budget-summary.js");
const summaryDialogs = require("../src/summary/budget-summary-dialogs.js");
const tickets = require("../src/tickets/budget-tickets.js");

const LABELS = ["none", "blue", "green", "yellow", "red"];
const CATEGORY_COLORS = ["#111111", "#222222", "#333333", "#444444", "#555555", "#666666", "#777777", "#888888"];

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function sampleExpenses() {
  return [
    { id: "e1", columnId: "food", amount: 100, currency: "UAH", initialAmount: 10, initialCurrency: "EUR", originalCategory: "Groceries", label: "green" },
    { id: "e2", columnId: "food", amount: 5, currency: "EUR", initialAmount: 50, initialCurrency: "UAH", originalCategory: "Service", label: "blue" },
    { id: "e3", columnId: "food", amount: 20, currency: "UAH", initialAmount: 2, initialCurrency: "EUR", originalCategory: "Groceries", label: "red" },
    { id: "e4", columnId: "transport", amount: 40, currency: "UAH", initialAmount: 40, initialCurrency: "UAH", originalCategory: "Taxi", label: "none" }
  ];
}

function samplePlans() {
  return [
    { id: "p1", columnId: "food", amount1: 200, currency1: "UAH", amount2: 20, currency2: "EUR", matchedExpenseIds: ["e1", "e2", "e3"], closed: false },
    { id: "p2", columnId: "food", amount1: 50, currency1: "UAH", matchedExpenseIds: [], closed: false },
    { id: "p3", columnId: "transport", amount1: 40, currency1: "UAH", matchedExpenseIds: ["e4"], closed: true }
  ];
}

test("planning sums matched actuals and open remaining amounts by currency", () => {
  const expenses = sampleExpenses();
  const plans = samplePlans();

  assert.deepEqual(planning.getMatchedExpenses(plans[0], expenses).map(expense => expense.id), ["e1", "e2", "e3"]);
  assert.deepEqual(planning.getColumnRemainingPlannedSums(plans, expenses, "food"), [
    { currency: "EUR", amount: 3 },
    { currency: "UAH", amount: 80 }
  ]);
  assert.deepEqual(planning.buildAllPlannedCurrencyTotals(plans, expenses), [
    { currency: "EUR", expected: 20, actual: 17, remaining: 3, planCount: 1 },
    { currency: "UAH", expected: 290, actual: 210, remaining: 80, planCount: 3 }
  ]);
});

test("planning recalculates closed state after matched actual deletion", () => {
  const expenses = sampleExpenses();
  const plans = samplePlans();
  const covered = plans[2];
  assert.equal(covered.closed, true);

  planning.reconcilePlanClosedAfterDeletion(covered, []);
  assert.equal(covered.closed, false);

  const plan = { id: "p4", amount1: 170, currency1: "UAH", matchedExpenseIds: ["e1", "e2", "e3"], closed: false };
  planning.syncAllPlanClosedStates([plan], expenses);
  assert.equal(plan.closed, true);
});

test("summary counts planned and actual matching state", () => {
  const counts = summary.buildSummaryCounts(sampleExpenses(), samplePlans());
  assert.deepEqual(counts, {
    plannedCount: 3,
    matchedPlannedCount: 2,
    unmatchedPlannedCount: 1,
    openPlannedCount: 2,
    closedPlannedCount: 1,
    matchedActualCount: 4,
    unmatchedActualCount: 0,
    matchedActualRate: 100
  });
});

test("summary builds planned currency stats for matched and comparable plans", () => {
  assert.deepEqual(summary.buildPlannedCurrencyStats(samplePlans(), sampleExpenses()), [
    {
      currency: "EUR",
      totalExpected: 20,
      matchedExpected: 20,
      matchedActual: 17,
      comparableExpected: 20,
      comparableCount: 1,
      difference: -3
    },
    {
      currency: "UAH",
      totalExpected: 290,
      matchedExpected: 240,
      matchedActual: 210,
      comparableExpected: 240,
      comparableCount: 2,
      difference: -30
    }
  ]);
});

test("summary groups original categories by currency and folds small categories into Other", () => {
  const manyCategories = Array.from({ length: 9 }, (_, index) => ({
    id: `cat-${index}`,
    amount: 10 - index,
    currency: "UAH",
    originalCategory: `Category ${index}`,
    columnId: "misc"
  }));
  const stats = summary.buildOriginalCategoryStats(manyCategories, CATEGORY_COLORS);

  assert.equal(stats.length, 1);
  assert.equal(stats[0].currency, "UAH");
  assert.equal(stats[0].items.length, 8);
  assert.equal(stats[0].items[7].category, "Other");
  assert.equal(stats[0].items[7].amount, 5);
  assert.equal(stats[0].items[0].color, CATEGORY_COLORS[0]);
});

test("summary calculates column breakdown and board label distribution", () => {
  const expenses = sampleExpenses();
  const columns = [
    { id: "food", title: "Food", goal: { currency: "UAH", sharePercent: 80, amountLimit: null } },
    { id: "transport", title: "Transport", goal: { currency: "UAH", sharePercent: null, amountLimit: null } }
  ];
  const boardTotals = tickets.groupCurrency(expenses, "amount", "currency");
  const rows = summary.buildCategoryBreakdown(columns, expenses, boardTotals);

  assert.deepEqual(rows.map(row => ({ column: row.column.id, currency: row.currency, amount: row.amount, count: row.count })), [
    { column: "food", currency: "EUR", amount: 5, count: 1 },
    { column: "food", currency: "UAH", amount: 120, count: 2 },
    { column: "transport", currency: "UAH", amount: 40, count: 1 }
  ]);
  assert.equal(rows.find(row => row.column.id === "food" && row.currency === "UAH").share, 75);

  assert.deepEqual(summary.buildBoardLabelStats(expenses, boardTotals, LABELS), [
    { label: "blue", currency: "EUR", amount: 5, count: 1, percentage: 100 },
    { label: "none", currency: "UAH", amount: 40, count: 1, percentage: 25 },
    { label: "green", currency: "UAH", amount: 100, count: 1, percentage: 62.5 },
    { label: "red", currency: "UAH", amount: 20, count: 1, percentage: 12.5 }
  ]);
});

test("planning dialog controller exposes planned expense workflow handlers", () => {
  const controller = planningDialogs.createPlanningDialogController({
    getState: () => ({ columns: [], expenses: [], plannedExpenses: [] }),
    PlanningRender: {
      createPlanningRenderer: () => ({
        formatExpenseOption: () => "",
        renderAllPlannedContent: () => "",
        renderPlanComparisons: () => "",
        renderPlannedCard: () => "",
        renderPlannedMatchPreview: () => ""
      })
    }
  });

  assert.equal(typeof controller.openPlannedDialog, "function");
  assert.equal(typeof controller.openAllPlannedDialog, "function");
  assert.equal(typeof controller.savePlannedFromForm, "function");
  assert.equal(typeof controller.confirmAndUnmatchExpenseForColumnMove, "function");
  assert.equal(typeof controller.getColumnRemainingPlannedSums, "function");
});

test("summary dialog controller exposes summary workflow handlers", () => {
  const controller = summaryDialogs.createSummaryDialogController({
    getState: () => ({ columns: [], expenses: [], plannedExpenses: [] })
  });

  assert.equal(typeof controller.handleSummaryChange, "function");
  assert.equal(typeof controller.handleSummaryClick, "function");
  assert.equal(typeof controller.openSummaryDialog, "function");
  assert.equal(typeof controller.renderSummaryModal, "function");
});

test("summary dialog can exclude Service labelled actual expenses", () => {
  const state = {
    columns: [
      { id: "food", title: "Food", color: "#111111", goal: { currency: "UAH", sharePercent: null, amountLimit: null } },
      { id: "transport", title: "Transport", color: "#222222", goal: { currency: "UAH", sharePercent: null, amountLimit: null } }
    ],
    expenses: sampleExpenses(),
    plannedExpenses: samplePlans()
  };
  const els = {
    summaryContent: { innerHTML: "" },
    summaryDialog: { open: false }
  };
  const controller = summaryDialogs.createSummaryDialogController({
    els,
    getState: () => state,
    Summary: summary,
    categoryChartColors: CATEGORY_COLORS,
    labels: LABELS,
    groupCurrency: tickets.groupCurrency,
    normalizeLabel: label => tickets.normalizeLabel(label, LABELS),
    getMatchedExpenseIds: core.getMatchedExpenseIds,
    formatPercent: value => String(Number(value).toFixed(1).replace(/\.0$/, "")),
    escapeHtml: value => String(value ?? ""),
    normalizeCurrency: core.normalizeCurrency,
    formatMoney: value => String(value),
    openDialog: () => {},
    openGoalDialog: () => {},
    getColumnGoal: column => column.goal,
    hasActiveGoal: () => false,
    labelTitle: label => ({ none: "Unlabelled", blue: "Service", green: "Green", yellow: "Yellow", red: "Red" }[label] || label),
    pluralize: (count, one, many) => count === 1 ? one : many,
    getAmountForCurrency: summary.getAmountForCurrency,
    isFiniteNumber: Number.isFinite,
    goalStatusClass: () => "goal-neutral"
  });

  assert.match(controller.renderSummaryModal(), /label-dot blue/);
  controller.handleSummaryChange({
    target: {
      closest: selector => selector === '[data-summary-action="toggle-service-filter"]' ? { checked: true } : null
    }
  });

  assert.doesNotMatch(els.summaryContent.innerHTML, /label-dot blue/);
  assert.match(els.summaryContent.innerHTML, /1 service excluded/);
});
