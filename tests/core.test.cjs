const assert = require("node:assert/strict");
const core = require("../src/core/budget-core.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("parseMoney accepts common bank export formats", () => {
  assert.equal(core.parseMoney("1 234,56"), 1234.56);
  assert.equal(core.parseMoney("1.234,56 UAH"), 1234.56);
  assert.equal(core.parseMoney("1,234.56"), 1234.56);
  assert.equal(core.parseMoney("-42,10"), -42.1);
  assert.equal(core.parseMoney(""), null);
});

test("normalizeImportedDate preserves day-month-year text dates", () => {
  assert.equal(core.normalizeImportedDate("10.06.2026"), "10.06.2026 00:00:00");
  assert.equal(core.normalizeImportedDate("31.05.2026 20:36:03"), "31.05.2026 20:36:03");
  assert.equal(core.normalizeImportedDate("2026-06-10 08:09:10"), "10.06.2026 08:09:10");
  assert.equal(core.normalizeImportedDate("not a date"), "not a date");
});

test("planned actual amounts prefer plain currency and sum each ticket once", () => {
  const expenses = [
    { amount: 100, currency: "UAH", initialAmount: 10, initialCurrency: "EUR" },
    { amount: 5, currency: "EUR", initialAmount: 50, initialCurrency: "UAH" },
    { amount: 20, currency: "UAH", initialAmount: 2, initialCurrency: "EUR" },
    { amount: 7, currency: "EUR", initialAmount: 7, initialCurrency: "EUR" }
  ];

  assert.equal(core.getCombinedActualAmountForCurrency(expenses, "UAH"), 170);
  assert.equal(core.getCombinedActualAmountForCurrency(expenses, "EUR"), 24);
  assert.equal(core.getCombinedActualAmountForCurrency(expenses, "USD"), null);
});

test("planned remaining prices and closed-state sync stay compatible", () => {
  const plan = { amount1: 200, currency1: "UAH", amount2: 20, currency2: "EUR", closed: false };
  const actuals = [
    { amount: 100, currency: "UAH", initialAmount: 10, initialCurrency: "EUR" },
    { amount: 5, currency: "EUR", initialAmount: 50, initialCurrency: "UAH" },
    { amount: 20, currency: "UAH", initialAmount: 2, initialCurrency: "EUR" }
  ];

  assert.deepEqual(core.getPlannedPrices(plan), [
    { currency: "UAH", amount: 200 },
    { currency: "EUR", amount: 20 }
  ]);
  assert.deepEqual(core.getPlanRemainingPrices(plan, actuals), [
    { currency: "UAH", amount: 30 },
    { currency: "EUR", amount: 3 }
  ]);
  assert.equal(core.syncPlanClosedState(plan, actuals), false);
  assert.equal(plan.closed, false);

  const covered = { amount1: 170, currency1: "UAH", closed: false };
  assert.equal(core.syncPlanClosedState(covered, actuals), true);
  assert.equal(covered.closed, true);
});

test("calculateExpenseSplit mirrors existing proportional split behavior", () => {
  const source = {
    amount: 10,
    currency: "UAH",
    initialAmount: 1,
    initialCurrency: "EUR",
    remainingAmount: 90
  };

  assert.deepEqual(core.calculateExpenseSplit(source, "initial", 0.2), {
    extractedPlain: 2,
    extractedInitial: 0.2,
    remainingPlain: 8,
    remainingInitial: 0.8,
    extractedBalance: 98
  });

  assert.deepEqual(core.calculateExpenseSplit(source, "plain", 2.5), {
    extractedPlain: 2.5,
    extractedInitial: 0.25,
    remainingPlain: 7.5,
    remainingInitial: 0.75,
    extractedBalance: 97.5
  });

  assert.equal(core.calculateExpenseSplit(source, "plain", 10), null);
});
