(() => {
  "use strict";

  function parseMoney(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (value === null || value === undefined) return null;
    let text = String(value).trim();
    if (!text) return null;

    text = text.replace(/[\s\u00a0\u202f']/g, "").replace(/[^0-9,.-]/g, "");
    if (!text || text === "-" || text === "." || text === ",") return null;

    const lastComma = text.lastIndexOf(",");
    const lastDot = text.lastIndexOf(".");
    if (lastComma >= 0 && lastDot >= 0) {
      if (lastComma > lastDot) text = text.replace(/\./g, "").replace(",", ".");
      else text = text.replace(/,/g, "");
    } else if (lastComma >= 0) {
      const decimalDigits = text.length - lastComma - 1;
      text = decimalDigits <= 2 ? text.replace(",", ".") : text.replace(/,/g, "");
    } else if (lastDot >= 0) {
      const decimalDigits = text.length - lastDot - 1;
      if (decimalDigits > 2) text = text.replace(/\./g, "");
    }

    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  function parseOptionalMoney(value) {
    if (value === "" || value === null || value === undefined) return null;
    return parseMoney(value);
  }

  function normalizeImportedDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return formatDate(value);
    if (typeof value === "number" && value > 1) {
      const spreadsheetDate = excelSerialDate(value);
      if (spreadsheetDate) return formatDate(spreadsheetDate);
    }

    const text = cellText(value);
    if (!text) return "";

    const dmy = text.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:[ T]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (dmy) {
      return normalizeDateParts(
        Number(dmy[3]), Number(dmy[2]), Number(dmy[1]),
        Number(dmy[4] || 0), Number(dmy[5] || 0), Number(dmy[6] || 0),
        text
      );
    }

    const ymd = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (ymd) {
      return normalizeDateParts(
        Number(ymd[1]), Number(ymd[2]), Number(ymd[3]),
        Number(ymd[4] || 0), Number(ymd[5] || 0), Number(ymd[6] || 0),
        text
      );
    }

    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? text : formatDate(date);
  }

  function excelSerialDate(serial) {
    if (!Number.isFinite(serial)) return null;
    const utcValue = Date.UTC(1899, 11, 30) + Math.round(serial * 86400000);
    const utcDate = new Date(utcValue);
    if (Number.isNaN(utcDate.getTime())) return null;
    return new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      utcDate.getUTCHours(),
      utcDate.getUTCMinutes(),
      utcDate.getUTCSeconds(),
      utcDate.getUTCMilliseconds()
    );
  }

  function normalizeDateParts(year, month, day, hour, minute, second, fallback) {
    const date = new Date(year, month - 1, day, hour, minute, second);
    const valid = date.getFullYear() === year
      && date.getMonth() === month - 1
      && date.getDate() === day
      && date.getHours() === hour
      && date.getMinutes() === minute
      && date.getSeconds() === second;
    return valid ? formatDate(date) : fallback;
  }

  function parseDateForSort(value) {
    const text = cellText(value);
    const match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (match) {
      return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0)).getTime();
    }
    const parsed = Date.parse(text);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function formatDate(date) {
    return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
  }

  function formatPercent(value) {
    return new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value || 0);
  }

  function toEditableNumber(value) {
    return String(Number(value)).replace(".", ",");
  }

  function cellText(value) {
    if (value === null || value === undefined) return "";
    if (value instanceof Date && !Number.isNaN(value.getTime())) return formatDate(value);
    return String(value).trim();
  }

  function normalizeCurrency(value) {
    return cellText(value).toUpperCase();
  }

  function nullableNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function isoDate(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function isHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "").trim());
  }

  function roundSplitMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function calculateExpenseSplit(source, basis, enteredAmount) {
    if (!source || !isFiniteNumber(source.amount) || source.amount <= 0) return null;
    if (!isFiniteNumber(enteredAmount) || enteredAmount <= 0) return null;

    const plainTotal = roundSplitMoney(source.amount);
    const hasInitial = isFiniteNumber(source.initialAmount) && source.initialAmount > 0;
    const initialTotal = hasInitial ? roundSplitMoney(source.initialAmount) : null;
    let extractedPlain;
    let extractedInitial = null;

    if (basis === "initial") {
      if (!hasInitial || enteredAmount >= initialTotal) return null;
      extractedInitial = roundSplitMoney(enteredAmount);
      extractedPlain = roundSplitMoney(extractedInitial * plainTotal / initialTotal);
    } else {
      if (enteredAmount >= plainTotal) return null;
      extractedPlain = roundSplitMoney(enteredAmount);
      if (hasInitial) extractedInitial = roundSplitMoney(extractedPlain * initialTotal / plainTotal);
    }

    const remainingPlain = roundSplitMoney(plainTotal - extractedPlain);
    const remainingInitial = hasInitial ? roundSplitMoney(initialTotal - extractedInitial) : null;
    if (extractedPlain <= 0 || remainingPlain <= 0) return null;
    if (hasInitial && (extractedInitial < 0 || remainingInitial < 0)) return null;

    const extractedBalance = isFiniteNumber(source.remainingAmount)
      ? roundSplitMoney(source.remainingAmount + remainingPlain)
      : null;

    return {
      extractedPlain,
      extractedInitial,
      remainingPlain,
      remainingInitial,
      extractedBalance
    };
  }

  function getMatchedExpenseIds(plan) {
    const rawIds = Array.isArray(plan?.matchedExpenseIds)
      ? plan.matchedExpenseIds
      : (typeof plan?.matchedExpenseId === "string" && plan.matchedExpenseId ? [plan.matchedExpenseId] : []);
    return [...new Set(rawIds.filter(id => typeof id === "string" && id))];
  }

  function isPlanMatched(plan) {
    return getMatchedExpenseIds(plan).length > 0;
  }

  function planHasExpense(plan, expenseId) {
    return Boolean(expenseId) && getMatchedExpenseIds(plan).includes(expenseId);
  }

  function setMatchedExpenseIds(plan, expenseIds) {
    plan.matchedExpenseIds = [...new Set(expenseIds.filter(id => typeof id === "string" && id))];
    delete plan.matchedExpenseId;
  }

  function getPlannedPrices(plan) {
    const prices = new Map();
    if (isFiniteNumber(plan?.amount1)) {
      const currency = normalizeCurrency(plan.currency1) || "\u2014";
      prices.set(currency, (prices.get(currency) || 0) + plan.amount1);
    }
    if (isFiniteNumber(plan?.amount2)) {
      const currency = normalizeCurrency(plan.currency2) || "\u2014";
      prices.set(currency, (prices.get(currency) || 0) + plan.amount2);
    }
    return [...prices.entries()].map(([currency, amount]) => ({ currency, amount }));
  }

  function getPlanRemainingPrices(plan, actuals = []) {
    if (plan?.closed === true) return [];
    return getPlannedPrices(plan)
      .map(price => {
        const actualAmount = getCombinedActualAmountForCurrency(actuals, price.currency);
        const remaining = Math.max(price.amount - (isFiniteNumber(actualAmount) ? actualAmount : 0), 0);
        return { currency: price.currency, amount: remaining };
      })
      .filter(item => item.amount > 0);
  }

  function getCombinedActualAmountForCurrency(expenses, currency) {
    const values = expenses
      .map(expense => getActualAmountForCurrency(expense, currency))
      .filter(isFiniteNumber);
    return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  }

  function getActualAmountForCurrency(expense, currency) {
    const normalized = normalizeCurrency(currency);
    const plainCurrency = normalizeCurrency(expense?.currency);
    const initialCurrency = normalizeCurrency(expense?.initialCurrency);

    if (plainCurrency === normalized && isFiniteNumber(expense?.amount)) return expense.amount;
    if (initialCurrency === normalized && isFiniteNumber(expense?.initialAmount)) return expense.initialAmount;
    return null;
  }

  function isPlanPrimaryCovered(plan, actuals = []) {
    if (!isFiniteNumber(plan?.amount1)) return false;
    const primaryCurrency = normalizeCurrency(plan.currency1) || "\u2014";
    const actualAmount = getCombinedActualAmountForCurrency(actuals, primaryCurrency);
    return isFiniteNumber(actualAmount) && actualAmount >= plan.amount1;
  }

  function syncPlanClosedState(plan, actuals = []) {
    if (!plan) return false;
    if (typeof plan.closed !== "boolean") plan.closed = false;
    if (!plan.closed && isPlanPrimaryCovered(plan, actuals)) {
      plan.closed = true;
      return true;
    }
    return false;
  }

  const api = Object.freeze({
    calculateExpenseSplit,
    cellText,
    excelSerialDate,
    formatDate,
    formatMoney,
    formatPercent,
    getActualAmountForCurrency,
    getCombinedActualAmountForCurrency,
    getMatchedExpenseIds,
    getPlanRemainingPrices,
    getPlannedPrices,
    isFiniteNumber,
    isHexColor,
    isPlanMatched,
    isPlanPrimaryCovered,
    isoDate,
    normalizeCurrency,
    normalizeImportedDate,
    nullableNumber,
    parseDateForSort,
    parseMoney,
    parseOptionalMoney,
    planHasExpense,
    roundSplitMoney,
    setMatchedExpenseIds,
    syncPlanClosedState,
    toEditableNumber
  });

  if (typeof window !== "undefined") window.BudgetBoardCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
