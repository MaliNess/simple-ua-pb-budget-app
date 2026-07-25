(() => {
  "use strict";

  const Core = globalThis.BudgetBoardCore || (typeof require === "function" ? require("./budget-core.js") : null);
  if (!Core) throw new Error("BudgetBoardCore must be loaded before budget-import-export.js.");
  const {
    cellText,
    isFiniteNumber,
    normalizeCurrency,
    normalizeImportedDate,
    parseMoney,
    parseOptionalMoney
  } = Core;

  function looksLikeHeader(row) {
    const normalized = row.slice(0, 10).map(cell => cellText(cell).toLowerCase());
    const joined = normalized.join(" ");
    const headerWords = ["date", "дата", "category", "категор", "card", "карт", "description", "опис", "currency", "валют", "amount", "sum", "сума"];
    return headerWords.filter(word => joined.includes(word)).length >= 3;
  }

  function statementRowsFromParsedWorkbook(rows) {
    let statementRows = Array.isArray(rows) ? rows.slice(2) : [];
    if (statementRows.length && looksLikeHeader(statementRows[0])) statementRows = statementRows.slice(1);
    return statementRows;
  }

  function importRowsToExpenses(rows, options = {}) {
    const createId = typeof options.createId === "function" ? options.createId : defaultId;
    let order = Number.isFinite(Number(options.startOrder)) ? Number(options.startOrder) : 0;
    let imported = 0;
    let skipped = 0;
    const expenses = [];

    for (const row of Array.isArray(rows) ? rows : []) {
      if (!Array.isArray(row) || row.every(cell => String(cell ?? "").trim() === "")) continue;

      const amount = parseMoney(row[4]);
      const description = cellText(row[3]);
      if (!isFiniteNumber(amount) || !description) {
        skipped += 1;
        continue;
      }

      expenses.push({
        id: createId(),
        columnId: "unassigned",
        order: order++,
        date: normalizeImportedDate(row[0]),
        originalCategory: cellText(row[1]),
        card: cellText(row[2]),
        description,
        note: "",
        amount: Math.abs(amount),
        currency: normalizeCurrency(row[5]),
        initialAmount: parseOptionalMoney(row[6]),
        initialCurrency: normalizeCurrency(row[7]),
        remainingAmount: parseOptionalMoney(row[8]),
        remainingCurrency: normalizeCurrency(row[9]),
        label: "none"
      });
      imported += 1;
    }

    return { expenses, imported, skipped, nextOrder: order };
  }

  function createBackupPayload(state, version, exportedAt = new Date().toISOString()) {
    return {
      app: "Budget Board",
      version,
      exportedAt,
      state
    };
  }

  function getRestoreCandidate(parsed) {
    return parsed?.state || parsed;
  }

  function defaultId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const api = Object.freeze({
    createBackupPayload,
    getRestoreCandidate,
    importRowsToExpenses,
    looksLikeHeader,
    statementRowsFromParsedWorkbook
  });

  if (typeof window !== "undefined") window.BudgetBoardImportExport = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
