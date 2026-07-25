(() => {
  "use strict";

  const Core = globalThis.BudgetBoardCore || (typeof require === "function" ? require("../core/budget-core.js") : null);
  if (!Core) throw new Error("BudgetBoardCore must be loaded before budget-splits.js.");
  const {
    isFiniteNumber,
    normalizeCurrency,
    roundSplitMoney
  } = Core;

  function getExtractedChildren(expenses, parentId) {
    return expenses
      .filter(expense => expense.splitFromExpenseId === parentId)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }

  function recalculateExtractedExpenseBalances(parent, expenses) {
    if (!parent || parent.splitFromExpenseId || !isFiniteNumber(parent.amount) || !isFiniteNumber(parent.remainingAmount)) {
      return false;
    }

    const plainCurrency = normalizeCurrency(parent.currency) || "";
    const children = getExtractedChildren(expenses, parent.id);
    const canRecalculate = Boolean(plainCurrency) && children.every(child =>
      isFiniteNumber(child.amount) && (normalizeCurrency(child.currency) || "") === plainCurrency
    );
    if (!canRecalculate) return false;

    let amountAfterCurrentChild = roundSplitMoney(parent.amount);
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      child.remainingAmount = roundSplitMoney(parent.remainingAmount + amountAfterCurrentChild);
      child.remainingCurrency = plainCurrency;
      amountAfterCurrentChild = roundSplitMoney(amountAfterCurrentChild + child.amount);
    }
    return true;
  }

  function calculateMergeResult(parent, children, allChildren = children) {
    if (!parent || !children.length || !isFiniteNumber(parent.amount)) return { error: "Select at least one extracted expense." };

    const plainCurrency = normalizeCurrency(parent.currency) || "";
    if (children.some(child => (normalizeCurrency(child.currency) || "") !== plainCurrency || !isFiniteNumber(child.amount))) {
      return { error: "Selected expenses do not use the same plain transaction currency as the parent." };
    }

    const mergedPlain = roundSplitMoney(parent.amount + children.reduce((sum, child) => sum + child.amount, 0));
    const initialEntries = [];
    if (isFiniteNumber(parent.initialAmount)) {
      initialEntries.push({ amount: parent.initialAmount, currency: normalizeCurrency(parent.initialCurrency) || "" });
    }
    children.forEach(child => {
      if (isFiniteNumber(child.initialAmount)) {
        initialEntries.push({ amount: child.initialAmount, currency: normalizeCurrency(child.initialCurrency) || "" });
      }
    });

    let initialCurrency = normalizeCurrency(parent.initialCurrency) || initialEntries.find(entry => entry.currency)?.currency || "";
    if (initialEntries.some(entry => entry.currency !== initialCurrency)) {
      return { error: "Selected expenses use different initial transaction currencies and cannot be merged automatically." };
    }
    const mergedInitial = initialEntries.length
      ? roundSplitMoney(initialEntries.reduce((sum, entry) => sum + entry.amount, 0))
      : null;

    let mergedBalance = isFiniteNumber(parent.remainingAmount) ? roundSplitMoney(parent.remainingAmount) : null;
    if (mergedBalance === null) {
      const latestBalancedChild = [...allChildren]
        .filter(child => isFiniteNumber(child.remainingAmount) && (normalizeCurrency(child.remainingCurrency) || plainCurrency) === plainCurrency)
        .sort((a, b) => (Number(b.order) || 0) - (Number(a.order) || 0))[0];
      if (latestBalancedChild) mergedBalance = roundSplitMoney(latestBalancedChild.remainingAmount - parent.amount);
    }

    return {
      mergedPlain,
      plainCurrency,
      mergedInitial,
      initialCurrency: mergedInitial === null ? "" : initialCurrency,
      mergedBalance,
      balanceCurrency: mergedBalance === null ? "" : plainCurrency
    };
  }

  const api = Object.freeze({
    calculateMergeResult,
    getExtractedChildren,
    recalculateExtractedExpenseBalances
  });

  if (typeof window !== "undefined") window.BudgetBoardSplits = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
