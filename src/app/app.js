(() => {
  "use strict";

  const Config = globalThis.BudgetBoardConfig;
  if (!Config) throw new Error("BudgetBoardConfig must be loaded before app.js.");
  const Dom = globalThis.BudgetBoardDom;
  if (!Dom) throw new Error("BudgetBoardDom must be loaded before app.js.");
  const {
    ADD_CURRENCY_VALUE,
    CATEGORY_CHART_COLORS,
    DEFAULT_CURRENCIES,
    DEFAULT_SORT_MODE,
    LABELS,
    LABEL_TITLES,
    PALETTE,
    SORT_MODES,
    STATE_VERSION,
    STORAGE_KEY
  } = Config;
  const Core = globalThis.BudgetBoardCore;
  if (!Core) throw new Error("BudgetBoardCore must be loaded before app.js.");
  const StateTools = globalThis.BudgetBoardState;
  if (!StateTools) throw new Error("BudgetBoardState must be loaded before app.js.");
  const ImportExport = globalThis.BudgetBoardImportExport;
  if (!ImportExport) throw new Error("BudgetBoardImportExport must be loaded before app.js.");
  const FileActions = globalThis.BudgetBoardFileActions;
  if (!FileActions) throw new Error("BudgetBoardFileActions must be loaded before app.js.");
  const ColumnActions = globalThis.BudgetBoardColumns;
  if (!ColumnActions) throw new Error("BudgetBoardColumns must be loaded before app.js.");
  const ColumnDialogs = globalThis.BudgetBoardColumnDialogs;
  if (!ColumnDialogs) throw new Error("BudgetBoardColumnDialogs must be loaded before app.js.");
  const IconTools = globalThis.BudgetBoardIcons;
  if (!IconTools) throw new Error("BudgetBoardIcons must be loaded before app.js.");
  const TicketActions = globalThis.BudgetBoardTickets;
  if (!TicketActions) throw new Error("BudgetBoardTickets must be loaded before app.js.");
  const ExpenseDialogs = globalThis.BudgetBoardExpenseDialogs;
  if (!ExpenseDialogs) throw new Error("BudgetBoardExpenseDialogs must be loaded before app.js.");
  const BulkLabelDialogs = globalThis.BudgetBoardBulkLabelDialogs;
  if (!BulkLabelDialogs) throw new Error("BudgetBoardBulkLabelDialogs must be loaded before app.js.");
  const CurrencyTools = globalThis.BudgetBoardCurrencies;
  if (!CurrencyTools) throw new Error("BudgetBoardCurrencies must be loaded before app.js.");
  const Planning = globalThis.BudgetBoardPlanning;
  if (!Planning) throw new Error("BudgetBoardPlanning must be loaded before app.js.");
  const PlanningRender = globalThis.BudgetBoardPlanningRender;
  if (!PlanningRender) throw new Error("BudgetBoardPlanningRender must be loaded before app.js.");
  const PlanningDialogs = globalThis.BudgetBoardPlanningDialogs;
  if (!PlanningDialogs) throw new Error("BudgetBoardPlanningDialogs must be loaded before app.js.");
  const Summary = globalThis.BudgetBoardSummary;
  if (!Summary) throw new Error("BudgetBoardSummary must be loaded before app.js.");
  const SummaryDialogs = globalThis.BudgetBoardSummaryDialogs;
  if (!SummaryDialogs) throw new Error("BudgetBoardSummaryDialogs must be loaded before app.js.");
  const MaskActions = globalThis.BudgetBoardMaskActions;
  if (!MaskActions) throw new Error("BudgetBoardMaskActions must be loaded before app.js.");
  const Ui = globalThis.BudgetBoardUi;
  if (!Ui) throw new Error("BudgetBoardUi must be loaded before app.js.");
  const SplitDialogs = globalThis.BudgetBoardSplitDialogs;
  if (!SplitDialogs) throw new Error("BudgetBoardSplitDialogs must be loaded before app.js.");
  const BoardRender = globalThis.BudgetBoardBoardRender;
  if (!BoardRender) throw new Error("BudgetBoardBoardRender must be loaded before app.js.");
  const BoardController = globalThis.BudgetBoardController;
  if (!BoardController) throw new Error("BudgetBoardController must be loaded before app.js.");
  const Bootstrap = globalThis.BudgetBoardBootstrap;
  if (!Bootstrap) throw new Error("BudgetBoardBootstrap must be loaded before app.js.");
  const {
    capitalize,
    clearInvalidFields,
    cssEscape,
    downloadBlob,
    escapeHtml,
    openDialog,
    pluralize,
    renderActionIcon,
    renderDeleteIcon,
    renderTicketMetaIcon
  } = Ui;
  const {
    calculateExpenseSplit,
    cellText,
    formatDate,
    formatMoney,
    formatPercent,
    getCombinedActualAmountForCurrency,
    getMatchedExpenseIds,
    getPlannedPrices,
    isFiniteNumber,
    isHexColor,
    isPlanMatched,
    isoDate,
    normalizeCurrency,
    parseDateForSort,
    parseMoney,
    parseOptionalMoney,
    planHasExpense,
    setMatchedExpenseIds,
    toEditableNumber,
    getPlanRemainingPrices: getPlanRemainingPricesCore,
    syncPlanClosedState: syncPlanClosedStateCore
  } = Core;
  const TICKET_ACTION_OPTIONS = {
    labels: LABELS,
    sortModes: SORT_MODES,
    defaultSortMode: DEFAULT_SORT_MODE
  };
  const boardRenderer = BoardRender.createBoardRenderer({
    labels: LABELS,
    sortModes: SORT_MODES,
    escapeHtml,
    pluralize,
    formatMoney,
    formatPercent,
    cellText,
    isFiniteNumber,
    planHasExpense,
    renderActionIcon,
    renderDeleteIcon,
    renderTicketMetaIcon,
    renderColumnIcon,
    getSortedColumnExpenses,
    getColumnSortMode,
    getCollapsedLabels,
    normalizeLabel,
    labelTitle,
    getColumnGoal,
    hasActiveGoal,
    getColumnRemainingPlannedSums,
    groupCurrency,
    buildLabelStats,
    getCurrencyTotal,
    getAmountForCurrency,
    goalStatusClass
  });

  const DEFAULT_STATE = {
    version: STATE_VERSION,
    currencies: [...DEFAULT_CURRENCIES],
    columns: [
      { id: "unassigned", title: "Unassigned", color: "#64748b", icon: "inbox", folded: false, locked: true, sortMode: DEFAULT_SORT_MODE, collapsedLabels: [], goal: { currency: "UAH", sharePercent: null, amountLimit: null } },
      { id: "food-dining", title: "Food & Dining", color: "#ff6b1a", icon: "utensils", folded: false, sortMode: DEFAULT_SORT_MODE, collapsedLabels: [], goal: { currency: "UAH", sharePercent: null, amountLimit: null } },
      { id: "transport", title: "Transport", color: "#3b82f6", icon: "car", folded: false, sortMode: DEFAULT_SORT_MODE, collapsedLabels: [], goal: { currency: "UAH", sharePercent: null, amountLimit: null } },
      { id: "shopping", title: "Shopping", color: "#8b5cf6", icon: "shopping", folded: false, sortMode: DEFAULT_SORT_MODE, collapsedLabels: [], goal: { currency: "UAH", sharePercent: null, amountLimit: null } },
      { id: "bills-utilities", title: "Bills & Utilities", color: "#ec4899", icon: "invoice", folded: false, sortMode: DEFAULT_SORT_MODE, collapsedLabels: [], goal: { currency: "UAH", sharePercent: null, amountLimit: null } }
    ],
    expenses: [],
    plannedExpenses: []
  };

  const els = Dom.getElements(document);

  const STATE_OPTIONS = {
    stateVersion: STATE_VERSION,
    defaultCurrencies: DEFAULT_CURRENCIES,
    defaultSortMode: DEFAULT_SORT_MODE,
    sortModes: SORT_MODES,
    labels: LABELS,
    defaultColumnIcon,
    normalizeColumnIcon
  };

  let state = loadState();
  const planningController = PlanningDialogs.createPlanningDialogController({
    els,
    getState: () => state,
    Planning,
    PlanningRender,
    isPlanMatched,
    getMatchedExpenseIds,
    setMatchedExpenseIds,
    formatPercent,
    openDialog,
    escapeHtml,
    formatMoney,
    isFiniteNumber,
    normalizeCurrency,
    getCombinedActualAmountForCurrency,
    pluralize,
    renderDeleteIcon,
    getPlannedPrices,
    planHasExpense,
    toEditableNumber,
    inferGoalCurrency,
    clearInvalidFields,
    parseMoney,
    parseOptionalMoney,
    uid,
    persistState,
    commit,
    renderBoard,
    showToast,
    parseDateForSort,
    windowConfirm: message => window.confirm(message),
    syncPlanClosedStateCore,
    getPlanRemainingPricesCore,
    navigateToExpense: (...args) => boardController.navigateToExpense(...args)
  });
  const summaryController = SummaryDialogs.createSummaryDialogController({
    els,
    getState: () => state,
    Summary,
    categoryChartColors: CATEGORY_CHART_COLORS,
    labels: LABELS,
    groupCurrency,
    normalizeLabel,
    getMatchedExpenseIds,
    formatPercent,
    escapeHtml,
    normalizeCurrency,
    formatMoney,
    openDialog,
    openGoalDialog,
    getColumnGoal,
    hasActiveGoal,
    labelTitle,
    pluralize,
    getAmountForCurrency,
    isFiniteNumber,
    goalStatusClass
  });
  const maskController = MaskActions.createMaskMoveController({
    els,
    getState: () => state,
    escapeHtml,
    clearInvalidFields,
    openDialog,
    showToast,
    pluralize,
    getMatchedPlanForExpense,
    clearPlanMatchForExpense,
    nextOrder,
    normalizeOrders,
    commit,
    windowConfirm: message => window.confirm(message)
  });
  const currencyController = CurrencyTools.createCurrencyController({
    getState: () => state,
    defaultCurrencies: DEFAULT_CURRENCIES,
    addCurrencyValue: ADD_CURRENCY_VALUE,
    queryCurrencyControls: () => document.querySelectorAll(".currency-select"),
    escapeHtml,
    promptCurrency: (message, defaultValue) => window.prompt(message, defaultValue),
    persistState,
    showToast,
    goalCurrencyElement: els.goalCurrency,
    updateGoalPreview,
    isSelectElement: value => value instanceof HTMLSelectElement
  });
  const fileController = FileActions.createFileActionsController({
    getState: () => state,
    setState: nextState => { state = nextState; },
    stateVersion: STATE_VERSION,
    ImportExport,
    parseXlsx: window.BudgetXlsx?.parse ? (buffer, options) => window.BudgetXlsx.parse(buffer, options) : null,
    nextOrder,
    uid,
    commit,
    showToast,
    pluralize,
    sanitizeState,
    windowConfirm: message => window.confirm(message),
    downloadBlob,
    isoDate
  });
  const expenseController = ExpenseDialogs.createExpenseController({
    els,
    getState: () => state,
    setStateExpenses: expenses => { state.expenses = expenses; },
    labels: LABELS,
    TicketActions,
    clearInvalidFields,
    formatDate,
    toEditableNumber,
    isFiniteNumber,
    openDialog,
    parseMoney,
    parseOptionalMoney,
    normalizeCurrency,
    showToast,
    uid,
    nextOrder,
    normalizeLabel,
    getColumnPlans: columnId => planningController.getColumnPlans(columnId),
    planHasExpense,
    getPlannedPrices,
    formatMoney,
    getMatchedExpenseIds,
    setMatchedExpenseIds,
    reconcilePlanClosedAfterDeletion,
    syncPlanClosedState,
    confirmAndUnmatchExpenseForColumnMove,
    getMatchedPlanForExpense,
    clearPlanMatchForExpense,
    normalizeOrders,
    commit,
    escapeHtml,
    pluralize,
    windowConfirm: message => window.confirm(message)
  });
  const splitController = SplitDialogs.createSplitExpenseController({
    els,
    getState: () => state,
    clearInvalidFields,
    openDialog,
    showToast,
    escapeHtml,
    formatMoney,
    isFiniteNumber,
    parseMoney,
    calculateExpenseSplit,
    toEditableNumber,
    normalizeOrders,
    uid,
    normalizeLabel,
    planHasExpense,
    setMatchedExpenseIds,
    getMatchedExpenseIds,
    commit,
    getMatchedPlanForExpense,
    pluralize,
    reconcilePlanClosedAfterDeletion
  });
  const bulkLabelController = BulkLabelDialogs.createBulkLabelController({
    els,
    getState: () => state,
    labels: LABELS,
    TicketActions,
    normalizeLabel,
    openDialog,
    showToast,
    pluralize,
    commit
  });
  const columnController = ColumnActions.createColumnController({
    getColumns: () => state.columns,
    commit,
    showToast,
    boardElement: els.board,
    cssEscape,
    requestAnimationFrameFn: callback => requestAnimationFrame(callback)
  });
  const columnDialogController = ColumnDialogs.createColumnDialogController({
    els,
    getState: () => state,
    setColumns: columns => { state.columns = columns; },
    palette: PALETTE,
    defaultSortMode: DEFAULT_SORT_MODE,
    sortModes: SORT_MODES,
    ColumnActions,
    TicketActions,
    clearInvalidFields,
    openDialog,
    isHexColor,
    normalizeColumnIcon,
    uid,
    emptyGoal,
    showToast,
    commit,
    normalizeOrders,
    getColumnSortMode,
    getColumnGoal,
    inferGoalCurrency,
    isFiniteNumber,
    toEditableNumber,
    parseOptionalMoney,
    sanitizeGoal,
    hasActiveGoal,
    getAmountForCurrency,
    groupCurrency,
    getCurrencyTotal,
    formatMoney,
    escapeHtml,
    formatPercent,
    goalStatusClass,
    updateColumnIconPreview,
    windowConfirm: message => window.confirm(message)
  });
  const boardController = BoardController.createBoardController({
    els,
    getState: () => state,
    labels: LABELS,
    columnController,
    columnDialogController,
    expenseController,
    maskController,
    planningController,
    splitController,
    openBulkLabelDialog: bulkLabelController.openBulkLabelDialog,
    confirmAndUnmatchExpenseForColumnMove,
    nextOrder,
    normalizeOrders,
    commit,
    showToast,
    labelTitle,
    documentRef: document,
    windowRef: window
  });
  const bootstrap = Bootstrap.createAppBootstrap({
    els,
    documentRef: document,
    windowRef: window,
    renderPalette,
    renderColumnIconOptions,
    currencyController,
    syncAllPlanClosedStates,
    renderBoard,
    persistState,
    openDialog,
    columnDialogController,
    summaryController,
    planningController,
    expenseController,
    fileController,
    splitController,
    isHexColor,
    updateColumnIconPreview,
    maskController,
    applyBulkLabelFromForm: bulkLabelController.applyBulkLabelFromForm,
    boardController,
    renderActionIcon
  });

  bootstrap.init();

  function renderBoard() {
    const rendered = boardRenderer.renderBoard(state);
    els.boardMeta.textContent = rendered.metaText;
    els.deleteAllBtn.disabled = rendered.deleteAllDisabled;
    els.board.innerHTML = rendered.html;
  }
  function getSortedColumnExpenses(column, expenses) {
    return TicketActions.getSortedColumnExpenses(column, expenses, TICKET_ACTION_OPTIONS);
  }

  function getColumnSortMode(column) {
    return TicketActions.getColumnSortMode(column, SORT_MODES, DEFAULT_SORT_MODE);
  }

  function getCollapsedLabels(column) {
    return TicketActions.getCollapsedLabels(column, LABELS);
  }

  function normalizeLabel(label) {
    return TicketActions.normalizeLabel(label, LABELS);
  }

  function getPlanRemainingPrices(plan, actuals) {
    return planningController.getPlanRemainingPrices(plan, actuals);
  }

  function getColumnRemainingPlannedSums(columnId) {
    return planningController.getColumnRemainingPlannedSums(columnId);
  }

  function getMatchedExpenses(plan) {
    return planningController.getMatchedExpenses(plan);
  }

  function syncPlanClosedState(plan, actuals) {
    return planningController.syncPlanClosedState(plan, actuals);
  }

  function syncAllPlanClosedStates() {
    planningController.syncAllPlanClosedStates();
  }

  function clearPlanMatchForExpense(expenseId) {
    planningController.clearPlanMatchForExpense(expenseId);
  }

  function reconcilePlanClosedAfterDeletion(plan) {
    planningController.reconcilePlanClosedAfterDeletion(plan);
  }

  function getMatchedPlanForExpense(expenseId) {
    return planningController.getMatchedPlanForExpense(expenseId);
  }

  function confirmAndUnmatchExpenseForColumnMove(expense, targetColumnId) {
    return planningController.confirmAndUnmatchExpenseForColumnMove(expense, targetColumnId);
  }

  function openGoalDialog(columnId) {
    columnDialogController.openGoalDialog(columnId);
  }

  function updateGoalPreview() {
    columnDialogController.updateGoalPreview();
  }

  function defaultColumnIcon(id, title = "") {
    return IconTools.defaultColumnIcon(id, title);
  }

  function normalizeColumnIcon(value) {
    return IconTools.normalizeColumnIcon(value);
  }

  function renderColumnIcon(value, className = "") {
    return IconTools.renderColumnIcon(value, className, escapeHtml);
  }

  function renderColumnIconOptions() {
    els.columnIcon.innerHTML = IconTools.renderColumnIconOptions(escapeHtml);
    els.columnIcon.value = "wallet";
    updateColumnIconPreview();
  }

  function updateColumnIconPreview() {
    if (!els.columnIconPreview) return;
    els.columnIconPreview.innerHTML = renderColumnIcon(els.columnIcon?.value);
  }
  function renderPalette() {
    els.colorPalette.innerHTML = PALETTE.map(color => `<button type="button" class="palette-btn" data-color="${color}" style="background:${color}" title="${color}"></button>`).join("");
    els.colorPalette.addEventListener("click", event => {
      const button = event.target.closest("[data-color]");
      if (!button) return;
      els.columnColor.value = button.dataset.color;
      els.columnColorText.value = button.dataset.color;
    });
  }

  function loadState() {
    return StateTools.loadState(localStorage, STORAGE_KEY, DEFAULT_STATE, STATE_OPTIONS);
  }

  function sanitizeState(candidate) {
    return StateTools.sanitizeState(candidate, STATE_OPTIONS);
  }

  function commit() {
    currencyController.refreshCurrencySelects();
    persistState();
    renderBoard();
  }

  function persistState() {
    try {
      syncAllPlanClosedStates();
      StateTools.persistState(localStorage, STORAGE_KEY, state);
    } catch (error) {
      console.warn("Could not save board", error);
      showToast("The board could not be saved in browser storage. Export a backup to keep your changes.", "error");
    }
  }

  function nextOrder(columnId) {
    return StateTools.nextOrder(state.expenses, columnId);
  }

  function normalizeOrders(columnId) {
    StateTools.normalizeOrdersFor(state.expenses, columnId);
  }

  function emptyGoal(currency = "UAH") {
    return StateTools.emptyGoal(currency);
  }

  function sanitizeGoal(raw) {
    return StateTools.sanitizeGoal(raw);
  }

  function getColumnGoal(column) {
    return sanitizeGoal(column?.goal);
  }

  function hasActiveGoal(goal) {
    return StateTools.hasActiveGoal(goal);
  }

  function inferGoalCurrency(columnId) {
    const columnTotals = groupCurrency(state.expenses.filter(expense => expense.columnId === columnId), "amount", "currency")
      .sort((a, b) => b.amount - a.amount);
    if (columnTotals[0]?.currency && columnTotals[0].currency !== "—") return columnTotals[0].currency;
    const boardTotals = groupCurrency(state.expenses, "amount", "currency").sort((a, b) => b.amount - a.amount);
    return boardTotals[0]?.currency && boardTotals[0].currency !== "—" ? boardTotals[0].currency : "UAH";
  }

  function getAmountForCurrency(expenses, currency) {
    return Summary.getAmountForCurrency(expenses, currency);
  }

  function getCurrencyTotal(groupedTotals, currency) {
    return Summary.getCurrencyTotal(groupedTotals, currency);
  }

  function goalStatusClass(current, limit) {
    if (!isFiniteNumber(limit)) return "goal-neutral";
    if (current > limit) return "goal-over";
    if (limit > 0 && current / limit >= 0.8) return "goal-warning";
    return "goal-good";
  }

  function groupCurrency(expenses, amountKey, currencyKey) {
    return TicketActions.groupCurrency(expenses, amountKey, currencyKey);
  }

  function buildLabelStats(expenses, transactionSums) {
    return TicketActions.buildLabelStats(expenses, transactionSums, LABELS);
  }

  function uid() {
    return StateTools.uid();
  }

  function labelTitle(label) {
    return LABEL_TITLES[normalizeLabel(label)] || capitalize(String(label || ""));
  }

  function showToast(message, type = "") {
    Ui.showToast(els.toastRegion, message, type);
  }
})();
