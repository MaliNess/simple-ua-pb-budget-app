const assert = require("node:assert/strict");
const bootstrap = require("../budget-app-bootstrap.js");
const boardController = require("../budget-board-controller.js");
const bulkLabelDialogs = require("../budget-bulk-label-dialogs.js");
const config = require("../budget-config.js");
const core = require("../budget-core.js");
globalThis.BudgetBoardCore = core;

const dom = require("../budget-dom.js");
const importExport = require("../budget-import-export.js");
const columns = require("../budget-columns.js");
const columnDialogs = require("../budget-column-dialogs.js");
const currencies = require("../budget-currencies.js");
const expenseDialogs = require("../budget-expense-dialogs.js");
const fileActions = require("../budget-file-actions.js");
const icons = require("../budget-icons.js");
const maskActions = require("../budget-mask-actions.js");
const planningDialogCore = require("../budget-planning-dialog-core.js");
const planningEditDialog = require("../budget-planning-edit-dialog.js");
const planningListDialog = require("../budget-planning-list-dialog.js");
const planningMatchDialog = require("../budget-planning-match-dialog.js");
const planningRender = require("../budget-planning-render.js");
const tickets = require("../budget-tickets.js");

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

test("import rows become sanitized unassigned expenses", () => {
  const rows = [
    ["header", "category", "card", "description", "amount", "currency", "initial", "initial currency", "balance", "balance currency"],
    ["10.06.2026", "Food", "1234", "Market", "-1 234,50", "uah", "30,00", "eur", "1000", "uah"],
    ["", "", "", "", "", "", "", "", "", ""],
    ["bad", "Bad", "1234", "", "not money", "UAH"]
  ];

  assert.equal(importExport.looksLikeHeader(rows[0]), true);
  const result = importExport.importRowsToExpenses(rows.slice(1), {
    startOrder: 5,
    createId: () => "id-1"
  });

  assert.equal(result.imported, 1);
  assert.equal(result.skipped, 1);
  assert.deepEqual(result.expenses[0], {
    id: "id-1",
    columnId: "unassigned",
    order: 5,
    date: "10.06.2026 00:00:00",
    originalCategory: "Food",
    card: "1234",
    description: "Market",
    note: "",
    amount: 1234.5,
    currency: "UAH",
    initialAmount: 30,
    initialCurrency: "EUR",
    remainingAmount: 1000,
    remainingCurrency: "UAH",
    label: "none"
  });
});

test("backup helpers wrap and unwrap board state", () => {
  const state = { columns: [], expenses: [], plannedExpenses: [] };
  const payload = importExport.createBackupPayload(state, 11, "2026-07-13T12:00:00.000Z");
  assert.equal(payload.app, "Budget Board");
  assert.equal(payload.version, 11);
  assert.equal(importExport.getRestoreCandidate(payload), state);
  assert.equal(importExport.getRestoreCandidate(state), state);
});

test("column helpers keep unassigned fixed and move deleted data", () => {
  const state = {
    columns: [
      { id: "unassigned", title: "Unassigned", locked: true },
      { id: "food", title: "Food" },
      { id: "transport", title: "Transport" }
    ],
    expenses: [
      { id: "a", columnId: "food", order: 0 },
      { id: "b", columnId: "unassigned", order: 0 }
    ],
    plannedExpenses: [{ id: "p", columnId: "food" }]
  };

  assert.equal(columns.moveColumnByOffset(state.columns, "transport", -1).moved, true);
  assert.deepEqual(state.columns.map(column => column.id), ["unassigned", "transport", "food"]);
  assert.equal(columns.reorderColumn(state.columns, "food", "unassigned", "before").moved, true);
  assert.deepEqual(state.columns.map(column => column.id), ["unassigned", "food", "transport"]);

  const impact = columns.getDeleteColumnImpact(state, "food");
  assert.deepEqual(impact, { column: state.columns[1], expenseCount: 1, plannedCount: 1 });
  assert.equal(columns.moveDeletedColumnItemsToUnassigned(state, "food").moved, true);
  assert.equal(state.expenses[0].columnId, "unassigned");
  assert.equal(state.plannedExpenses[0].columnId, "unassigned");
});

test("column controller owns reorder, fold, and group actions", () => {
  const columnsState = [
    { id: "unassigned", title: "Unassigned", locked: true },
    { id: "food", title: "Food", folded: false, collapsedLabels: [] },
    { id: "transport", title: "Transport", folded: false, collapsedLabels: [] }
  ];
  let commits = 0;
  let focused = false;
  const messages = [];
  const controller = columns.createColumnController({
    getColumns: () => columnsState,
    commit: () => { commits += 1; },
    showToast: message => messages.push(message),
    boardElement: { querySelector: () => ({ focus: () => { focused = true; } }) },
    cssEscape: value => value,
    requestAnimationFrameFn: callback => callback()
  });

  assert.equal(controller.moveByOffset("transport", -1), true);
  assert.deepEqual(columnsState.map(column => column.id), ["unassigned", "transport", "food"]);
  assert.equal(focused, true);
  assert.equal(controller.reorder("food", "transport", "before"), true);
  assert.deepEqual(columnsState.map(column => column.id), ["unassigned", "food", "transport"]);
  assert.equal(controller.toggleFold("food"), true);
  assert.equal(columnsState[1].folded, true);
  assert.equal(controller.toggleLabelGroup("food", "green", LABELS), true);
  assert.deepEqual(columnsState[1].collapsedLabels, ["green"]);
  assert.equal(commits, 4);
  assert.equal(messages.length, 2);
});

test("ticket helpers sort and label consistently", () => {
  const column = { sortMode: "green-first", collapsedLabels: ["red"] };
  const expenses = [
    { id: "old", label: "none", date: "01.01.2026 00:00:00", order: 0, amount: 10, currency: "UAH" },
    { id: "new", label: "green", date: "02.01.2026 00:00:00", order: 1, amount: 20, currency: "UAH" },
    { id: "red", label: "red", date: "03.01.2026 00:00:00", order: 2, amount: 30, currency: "UAH" }
  ];

  assert.deepEqual(tickets.getSortedColumnExpenses(column, expenses, ticketOptions).map(item => item.id), ["new", "red", "old"]);
  assert.deepEqual(tickets.getCollapsedLabels(column, LABELS), ["red"]);
  assert.equal(tickets.toggleExpenseLabel(expenses[0], "blue", LABELS), true);
  assert.equal(expenses[0].label, "blue");
  assert.equal(tickets.toggleExpenseLabel(expenses[0], "blue", LABELS), true);
  assert.equal(expenses[0].label, "none");

  const changed = tickets.applyBulkLabel(expenses, "green", LABELS);
  assert.equal(changed, 1);
  assert.deepEqual(tickets.groupCurrency(expenses, "amount", "currency"), [{ currency: "UAH", amount: 60 }]);
  assert.deepEqual(tickets.buildLabelStats(expenses, [{ currency: "UAH", amount: 60 }], LABELS), [
    { label: "green", currency: "UAH", amount: 30, percentage: 50 },
    { label: "red", currency: "UAH", amount: 30, percentage: 50 }
  ]);
});

test("mask helpers match unassigned ticket titles with wildcards", () => {
  const expenses = [
    { id: "a", columnId: "unassigned", description: "Автоплатіж. Отримувач Благодійний фонд 1" },
    { id: "b", columnId: "food", description: "Автоплатіж. Отримувач Благодійний фонд 2" },
    { id: "c", columnId: "unassigned", description: "Market ABC" }
  ];

  assert.deepEqual(
    maskActions.findUnassignedByMask(expenses, "Автоплатіж. Отримувач Благодійний фонд*").map(expense => expense.id),
    ["a"]
  );
  assert.equal(maskActions.wildcardToRegExp("Market ???").test("Market ABC"), true);
});

test("currency helpers collect board currencies in stable order", () => {
  const state = {
    currencies: ["PLN"],
    columns: [{ goal: { currency: "gbp" } }],
    expenses: [{ currency: "uah", initialCurrency: "eur", remainingCurrency: "czk" }],
    plannedExpenses: [{ currency1: "usd", currency2: "jpy" }]
  };

  assert.deepEqual(currencies.getAvailableCurrencies(state, ["UAH", "EUR", "USD"]), ["UAH", "EUR", "USD", "CZK", "GBP", "JPY", "PLN"]);
});

test("icon helpers normalize and render column icons", () => {
  assert.equal(icons.defaultColumnIcon("unassigned"), "inbox");
  assert.equal(icons.normalizeColumnIcon("missing"), "wallet");
  assert.match(icons.renderColumnIcon("car"), /viewBox="0 0 512 512"/);
  assert.match(icons.renderColumnIconOptions(), /value="wallet"/);
});

test("file actions controller exposes import, export, and restore handlers", () => {
  const controller = fileActions.createFileActionsController({});
  assert.equal(typeof controller.importXlsx, "function");
  assert.equal(typeof controller.exportBoard, "function");
  assert.equal(typeof controller.restoreBoard, "function");
});

test("expense controller exposes ticket workflow handlers", () => {
  const controller = expenseDialogs.createExpenseController({});
  assert.equal(typeof controller.openExpenseDialog, "function");
  assert.equal(typeof controller.saveExpenseFromForm, "function");
  assert.equal(typeof controller.deleteExpense, "function");
  assert.equal(typeof controller.deleteAllExpenses, "function");
  assert.equal(typeof controller.setExpenseLabel, "function");
});

test("bulk label controller exposes label-all workflow handlers", () => {
  const controller = bulkLabelDialogs.createBulkLabelController({});
  assert.equal(typeof controller.openBulkLabelDialog, "function");
  assert.equal(typeof controller.applyBulkLabelFromForm, "function");
});

test("column dialog controller exposes column, sort, and goal handlers", () => {
  const controller = columnDialogs.createColumnDialogController({});
  assert.equal(typeof controller.openColumnDialog, "function");
  assert.equal(typeof controller.deleteColumn, "function");
  assert.equal(typeof controller.openSortDialog, "function");
  assert.equal(typeof controller.openGoalDialog, "function");
  assert.equal(typeof controller.updateGoalPreview, "function");
});

test("config exposes stable defaults for offline startup", () => {
  assert.deepEqual(config.DEFAULT_CURRENCIES, ["UAH", "EUR", "USD"]);
  assert.equal(config.SORT_MODES["green-first"].label, "Green first");
  assert.equal(config.STORAGE_KEY, "budgetBoardState.v1");
});

test("dom helper looks up expected element ids", () => {
  const requested = [];
  const elements = dom.getElements({
    getElementById(id) {
      requested.push(id);
      return { id };
    }
  });

  assert.equal(elements.board.id, "board");
  assert.equal(elements.expenseForm.id, "expenseForm");
  assert.ok(requested.includes("allPlannedContent"));
});

test("board and bootstrap controllers expose app-shell handlers", () => {
  const board = boardController.createBoardController({});
  const app = bootstrap.createAppBootstrap({});
  assert.equal(typeof board.bindBoardEvents, "function");
  assert.equal(typeof board.navigateToExpense, "function");
  assert.equal(typeof app.init, "function");
  assert.equal(typeof app.bindEvents, "function");
});

test("planning renderer exposes planned list and comparison renderers", () => {
  const renderer = planningRender.createPlanningRenderer({
    getState: () => ({ columns: [], expenses: [] }),
    getMatchedExpenseIds: () => [],
    getMatchedExpenses: () => [],
    getPlannedPrices: () => [],
    escapeHtml: value => String(value ?? ""),
    formatMoney: value => String(value),
    formatPercent: value => String(value),
    pluralize: (_count, one, many) => many || one,
    isFiniteNumber: Number.isFinite,
    normalizeCurrency: value => value,
    getCombinedActualAmountForCurrency: () => null
  });

  assert.equal(typeof renderer.renderPlannedCard, "function");
  assert.equal(typeof renderer.renderAllPlannedContent, "function");
  assert.equal(typeof renderer.renderPlanComparisons, "function");
});

test("planning dialog modules expose focused controllers", () => {
  const coreController = planningDialogCore.createPlanningDialogCore({
    getState: () => ({ columns: [], expenses: [], plannedExpenses: [] })
  });
  const listController = planningListDialog.createPlanningListDialog({ core: coreController });
  const editController = planningEditDialog.createPlanningEditDialog({ core: coreController });
  const matchController = planningMatchDialog.createPlanningMatchDialog({ core: coreController });

  assert.equal(typeof coreController.getColumnPlans, "function");
  assert.equal(typeof listController.openPlannedDialog, "function");
  assert.equal(typeof editController.openPlannedEditDialog, "function");
  assert.equal(typeof matchController.openPlannedMatchDialog, "function");
});
