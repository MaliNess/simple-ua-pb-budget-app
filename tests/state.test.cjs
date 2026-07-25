const assert = require("node:assert/strict");
const core = require("../src/core/budget-core.js");
globalThis.BudgetBoardCore = core;

const stateTools = require("../src/state/budget-state.js");

const LABELS = ["none", "blue", "green", "yellow", "red"];
const SORT_MODES = {
  "green-first": { label: "Green first", order: ["green", "yellow", "red", "blue", "none"] }
};
const OPTIONS = {
  stateVersion: 11,
  defaultCurrencies: ["UAH", "EUR", "USD"],
  defaultSortMode: "green-first",
  sortModes: SORT_MODES,
  labels: LABELS,
  defaultColumnIcon: id => id === "unassigned" ? "inbox" : "wallet",
  normalizeColumnIcon: value => ["wallet", "inbox"].includes(value) ? value : "wallet"
};

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("sanitizeState restores unassigned, cleans expenses, plans, goals, and currencies", () => {
  const restored = stateTools.sanitizeState({
    currencies: ["PLN"],
    columns: [
      { id: "food", title: " Food ", color: "#ABCDEF", icon: "missing", sortMode: "missing", collapsedLabels: ["red", "bad"], goal: { currency: "eur", sharePercent: 120, amountLimit: 50 } }
    ],
    expenses: [
      { id: "e1", columnId: "food", order: 10, description: "Market", amount: -12, currency: "uah", initialAmount: 3, initialCurrency: "eur", remainingAmount: 99, remainingCurrency: "uah", label: "green", splitFromExpenseId: "missing" },
      { id: "e2", columnId: "missing", description: "Other", amount: 5, currency: "usd", label: "bad" }
    ],
    plannedExpenses: [
      { id: "p1", columnId: "food", description: "Plan", amount1: 20, currency1: "uah", amount2: 2, currency2: "eur", matchedExpenseIds: ["e1", "e2"], closed: false },
      { id: "p2", columnId: "missing", description: "Bad", amount1: "nope" }
    ]
  }, OPTIONS);

  assert.equal(restored.version, 11);
  assert.deepEqual(restored.columns.map(column => column.id), ["unassigned", "food"]);
  assert.equal(restored.columns[1].title, "Food");
  assert.equal(restored.columns[1].color, "#abcdef");
  assert.equal(restored.columns[1].icon, "wallet");
  assert.deepEqual(restored.columns[1].collapsedLabels, ["red"]);
  assert.deepEqual(restored.columns[1].goal, { currency: "EUR", sharePercent: null, amountLimit: 50 });
  assert.equal(restored.expenses[0].amount, 12);
  assert.equal(restored.expenses[0].splitFromExpenseId, "");
  assert.equal(restored.expenses[1].columnId, "unassigned");
  assert.equal(restored.expenses[1].label, "none");
  assert.deepEqual(restored.plannedExpenses[0].matchedExpenseIds, ["e1"]);
  assert.deepEqual(restored.currencies, ["UAH", "EUR", "USD", "PLN"]);
});

test("loadState falls back and persistState writes JSON", () => {
  const storage = new Map();
  const adapter = {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value)
  };
  const fallback = { columns: [{ id: "unassigned", title: "Unassigned" }], expenses: [], plannedExpenses: [] };

  assert.deepEqual(stateTools.loadState(adapter, "board", fallback, OPTIONS), fallback);
  stateTools.persistState(adapter, "board", fallback);
  assert.equal(JSON.parse(storage.get("board")).columns[0].id, "unassigned");
});

test("order helpers remain deterministic", () => {
  const expenses = [
    { id: "b", columnId: "food", order: 10 },
    { id: "a", columnId: "food", order: 5 },
    { id: "c", columnId: "other", order: 1 }
  ];
  assert.equal(stateTools.nextOrder(expenses, "food"), 11);
  stateTools.normalizeOrdersFor(expenses, "food");
  assert.deepEqual(expenses.filter(expense => expense.columnId === "food").map(expense => [expense.id, expense.order]), [["b", 1], ["a", 0]]);
});
