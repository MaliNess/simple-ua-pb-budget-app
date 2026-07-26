const assert = require("node:assert/strict");
const core = require("../src/core/budget-core.js");
const tickets = require("../src/tickets/budget-tickets.js");
const summary = require("../src/summary/budget-summary.js");
const ui = require("../src/app/budget-ui.js");
const boardRender = require("../src/board/budget-board-render.js");

const LABELS = ["none", "blue", "green", "yellow", "red"];
const SORT_MODES = {
  "unlabelled-first": { label: "Unlabelled first", order: ["none", "blue", "green", "yellow", "red"] },
  "green-first": { label: "Green first", order: ["green", "yellow", "red", "blue", "none"] },
  "red-first": { label: "Red first", order: ["red", "yellow", "green", "blue", "none"] }
};
const DEFAULT_SORT_MODE = "green-first";
const ticketOptions = { labels: LABELS, sortModes: SORT_MODES, defaultSortMode: DEFAULT_SORT_MODE };

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function makeRenderer() {
  return boardRender.createBoardRenderer({
    labels: LABELS,
    sortModes: SORT_MODES,
    escapeHtml: ui.escapeHtml,
    pluralize: ui.pluralize,
    formatMoney: core.formatMoney,
    formatPercent: core.formatPercent,
    cellText: core.cellText,
    isFiniteNumber: core.isFiniteNumber,
    planHasExpense: core.planHasExpense,
    renderActionIcon: ui.renderActionIcon,
    renderDeleteIcon: ui.renderDeleteIcon,
    renderTicketMetaIcon: ui.renderTicketMetaIcon,
    renderColumnIcon: value => `<svg data-icon="${ui.escapeHtml(value || "wallet")}"></svg>`,
    getSortedColumnExpenses: (column, expenses) => tickets.getSortedColumnExpenses(column, expenses, ticketOptions),
    getColumnSortMode: column => tickets.getColumnSortMode(column, SORT_MODES, DEFAULT_SORT_MODE),
    getCollapsedLabels: column => tickets.getCollapsedLabels(column, LABELS),
    normalizeLabel: label => tickets.normalizeLabel(label, LABELS),
    labelTitle: label => ({ none: "Unlabelled", blue: "Service", green: "Green", yellow: "Yellow", red: "Red" }[tickets.normalizeLabel(label, LABELS)]),
    getColumnGoal: column => column.goal || { currency: "UAH", sharePercent: null, amountLimit: null },
    hasActiveGoal: goal => core.isFiniteNumber(goal?.sharePercent) || core.isFiniteNumber(goal?.amountLimit),
    getColumnRemainingPlannedSums: columnId => columnId === "food" ? [{ currency: "UAH", amount: 80 }] : [],
    groupCurrency: tickets.groupCurrency,
    buildLabelStats: (expenses, transactionSums) => tickets.buildLabelStats(expenses, transactionSums, LABELS),
    getCurrencyTotal: summary.getCurrencyTotal,
    getAmountForCurrency: summary.getAmountForCurrency,
    goalStatusClass: (current, limit) => current > limit ? "goal-over" : "goal-good"
  });
}

test("board renderer emits board metadata and action hooks", () => {
  const renderer = makeRenderer();
  const state = {
    columns: [
      { id: "unassigned", title: "Unassigned", color: "#64748b", icon: "inbox", locked: true, sortMode: "green-first", collapsedLabels: [] },
      { id: "food", title: "Food", color: "#ff6b1a", icon: "utensils", sortMode: "green-first", collapsedLabels: ["green"], goal: { currency: "UAH", sharePercent: 70, amountLimit: 300 } },
      { id: "folded", title: "Folded", color: "#3b82f6", icon: "wallet", folded: true, sortMode: "green-first", collapsedLabels: [] }
    ],
    expenses: [
      {
        id: "parent",
        columnId: "food",
        order: 0,
        date: "10.06.2026 00:00:00",
        card: "1234",
        description: "Parent & lunch",
        originalCategory: "Dining",
        note: "internal note",
        amount: 100,
        currency: "UAH",
        initialAmount: 10,
        initialCurrency: "EUR",
        remainingAmount: 900,
        remainingCurrency: "UAH",
        label: "green"
      },
      {
        id: "child",
        splitFromExpenseId: "parent",
        columnId: "food",
        order: 1,
        description: "Child",
        amount: 20,
        currency: "UAH",
        label: "none"
      }
    ],
    plannedExpenses: [
      { id: "plan-1", columnId: "food", closed: false, matchedExpenseIds: ["parent"] },
      { id: "plan-2", columnId: "folded", closed: true, matchedExpenseIds: [] }
    ]
  };

  const result = renderer.renderBoard(state);

  assert.equal(result.deleteAllDisabled, false);
  assert.match(result.metaText, /2 expenses/);
  assert.match(result.metaText, /2 planned/);
  assert.match(result.html, /data-action="open-planned-list" data-column-id="food"/);
  assert.match(result.html, /data-action="toggle-label-group" data-column-id="food" data-label="green"/);
  assert.match(result.html, /class="ticket-note"/);
  assert.match(result.html, /Parent &amp; lunch/);
  assert.match(result.html, /data-action="navigate-expense" data-expense-id="parent"/);
  assert.match(result.html, /data-action="merge-extracted" data-expense-id="parent"/);
  assert.match(result.html, /column column-folded/);
  assert.match(result.html, /data-icon="wallet"/);
});

test("board renderer marks an empty board as delete-disabled", () => {
  const renderer = makeRenderer();
  const result = renderer.renderBoard({
    columns: [{ id: "unassigned", title: "Unassigned", color: "#64748b", locked: true, sortMode: "green-first", collapsedLabels: [] }],
    expenses: [],
    plannedExpenses: []
  });

  assert.equal(result.deleteAllDisabled, true);
  assert.match(result.html, /No unassigned expenses/);
});
