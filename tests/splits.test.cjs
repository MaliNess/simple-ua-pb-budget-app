const assert = require("node:assert/strict");
const core = require("../budget-core.js");
globalThis.BudgetBoardCore = core;

const splits = require("../budget-splits.js");
const splitDialogs = require("../budget-split-dialogs.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("getExtractedChildren returns children in transaction order", () => {
  const expenses = [
    { id: "child-2", splitFromExpenseId: "parent", order: 2 },
    { id: "other", splitFromExpenseId: "", order: 0 },
    { id: "child-1", splitFromExpenseId: "parent", order: 1 }
  ];
  assert.deepEqual(splits.getExtractedChildren(expenses, "parent").map(expense => expense.id), ["child-1", "child-2"]);
});

test("recalculateExtractedExpenseBalances preserves parent final balance", () => {
  const parent = { id: "parent", amount: 7, currency: "UAH", remainingAmount: 100 };
  const expenses = [
    { id: "child-2", splitFromExpenseId: "parent", amount: 3, currency: "UAH", order: 2 },
    { id: "child-1", splitFromExpenseId: "parent", amount: 2, currency: "UAH", order: 1 },
    parent
  ];

  assert.equal(splits.recalculateExtractedExpenseBalances(parent, expenses), true);
  assert.deepEqual(expenses.slice(0, 2).map(expense => [expense.id, expense.remainingAmount, expense.remainingCurrency]), [
    ["child-2", 107, "UAH"],
    ["child-1", 110, "UAH"]
  ]);
});

test("calculateMergeResult combines selected children and preserves known parent balance", () => {
  const parent = { id: "parent", amount: 5, currency: "UAH", initialAmount: 0.5, initialCurrency: "EUR", remainingAmount: 100 };
  const children = [
    { id: "child-1", amount: 2, currency: "UAH", initialAmount: 0.2, initialCurrency: "EUR", remainingAmount: 107, remainingCurrency: "UAH", order: 1 },
    { id: "child-2", amount: 3, currency: "UAH", initialAmount: 0.3, initialCurrency: "EUR", remainingAmount: 105, remainingCurrency: "UAH", order: 2 }
  ];

  assert.deepEqual(splits.calculateMergeResult(parent, children, children), {
    mergedPlain: 10,
    plainCurrency: "UAH",
    mergedInitial: 1,
    initialCurrency: "EUR",
    mergedBalance: 100,
    balanceCurrency: "UAH"
  });
});

test("calculateMergeResult can infer missing parent balance from latest child", () => {
  const parent = { id: "parent", amount: 5, currency: "UAH" };
  const children = [
    { id: "child-1", amount: 2, currency: "UAH", remainingAmount: 108, remainingCurrency: "UAH", order: 1 },
    { id: "child-2", amount: 3, currency: "UAH", remainingAmount: 105, remainingCurrency: "UAH", order: 2 }
  ];

  assert.equal(splits.calculateMergeResult(parent, [children[0]], children).mergedBalance, 100);
});

test("calculateMergeResult rejects incompatible currencies", () => {
  const parent = { id: "parent", amount: 5, currency: "UAH", initialAmount: 1, initialCurrency: "EUR" };
  assert.equal(
    splits.calculateMergeResult(parent, [{ id: "child", amount: 2, currency: "USD" }]).error,
    "Selected expenses do not use the same plain transaction currency as the parent."
  );
  assert.equal(
    splits.calculateMergeResult(parent, [{ id: "child", amount: 2, currency: "UAH", initialAmount: 1, initialCurrency: "USD" }]).error,
    "Selected expenses use different initial transaction currencies and cannot be merged automatically."
  );
});

test("split dialog controller exposes split and merge workflow handlers", () => {
  const controller = splitDialogs.createSplitExpenseController({});
  assert.deepEqual(Object.keys(controller), [
    "openSplitExpenseDialog",
    "updateSplitBasis",
    "updateSplitPreview",
    "saveSplitExpenseFromForm",
    "openMergeExpenseDialog",
    "updateMergePreview",
    "saveMergeExpenseFromForm"
  ]);
});
