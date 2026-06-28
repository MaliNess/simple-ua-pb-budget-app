(() => {
  "use strict";

  const STORAGE_KEY = "budgetBoardState.v1";
  const STATE_VERSION = 11;
  const DEFAULT_CURRENCIES = ["UAH", "EUR", "USD"];
  const ADD_CURRENCY_VALUE = "__add_currency__";
  const LABELS = ["none", "blue", "green", "yellow", "red"];
  const LABEL_TITLES = { none: "Unlabelled", blue: "Service", green: "Green", yellow: "Yellow", red: "Red" };
  const SORT_MODES = {
    "unlabelled-first": { label: "Unlabelled first", order: ["none", "blue", "green", "yellow", "red"] },
    "green-first": { label: "Green first", order: ["green", "yellow", "red", "blue", "none"] },
    "red-first": { label: "Red first", order: ["red", "yellow", "green", "blue", "none"] }
  };
  const DEFAULT_SORT_MODE = "green-first";
  const PALETTE = ["#64748b", "#ff6b1a", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444"];
  const CATEGORY_CHART_COLORS = ["#4f46e5", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];

  const COLUMN_ICONS = {
    wallet: { label: "Wallet", width: 512, height: 512, path: "M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L80 128c-8.8 0-16-7.2-16-16s7.2-16 16-16l368 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L64 32zM416 272a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" },
    inbox: { label: "Inbox", width: 512, height: 512, path: "M121 32C91.6 32 66 52 58.9 80.5L1.9 308.4C.6 313.5 0 318.7 0 323.9L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-92.1c0-5.2-.6-10.4-1.9-15.5l-57-227.9C446 52 420.4 32 391 32L121 32zm0 64l270 0 48 192-51.2 0c-12.1 0-23.2 6.8-28.6 17.7l-14.3 28.6c-5.4 10.8-16.5 17.7-28.6 17.7l-120.4 0c-12.1 0-23.2-6.8-28.6-17.7l-14.3-28.6c-5.4-10.8-16.5-17.7-28.6-17.7L73 288 121 96z" },
    utensils: { label: "Food & dining", width: 448, height: 512, path: "M416 0C400 0 288 32 288 176l0 112c0 35.3 28.7 64 64 64l32 0 0 128c0 17.7 14.3 32 32 32s32-14.3 32-32l0-128 0-112 0-208c0-17.7-14.3-32-32-32zM64 16C64 7.8 57.9 1 49.7 .1S34.2 4.6 32.4 12.5L2.1 148.8C.7 155.1 0 161.5 0 167.9c0 45.9 35.1 83.6 80 87.7L80 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-224.4c44.9-4.1 80-41.8 80-87.7c0-6.4-.7-12.8-2.1-19.1L191.6 12.5c-1.8-8-9.3-13.3-17.4-12.4S160 7.8 160 16l0 134.2c0 5.4-4.4 9.8-9.8 9.8c-5.1 0-9.3-3.9-9.8-9L127.9 14.6C127.2 6.3 120.3 0 112 0s-15.2 6.3-15.9 14.6L83.7 151c-.5 5.1-4.7 9-9.8 9c-5.4 0-9.8-4.4-9.8-9.8L64 16zm48.3 152l-.3 0-.3 0 .3-.7 .3 .7z" },
    car: { label: "Transport", width: 512, height: 512, path: "M135.2 117.4L109.1 192l293.8 0-26.1-74.6C372.3 104.6 360.2 96 346.6 96L165.4 96c-13.6 0-25.7 8.6-30.2 21.4zM39.6 196.8L74.8 96.3C88.3 57.8 124.6 32 165.4 32l181.2 0c40.8 0 77.1 25.8 90.6 64.3l35.2 100.5c23.2 9.6 39.6 32.5 39.6 59.2l0 144 0 48c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-48L96 400l0 48c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-48L0 256c0-26.7 16.4-49.6 39.6-59.2zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm288 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64z" },
    shopping: { label: "Shopping", width: 448, height: 512, path: "M160 112c0-35.3 28.7-64 64-64s64 28.7 64 64l0 48-128 0 0-48zm-48 48l-64 0c-26.5 0-48 21.5-48 48L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-208c0-26.5-21.5-48-48-48l-64 0 0-48C336 50.1 285.9 0 224 0S112 50.1 112 112l0 48zm24 48a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm152 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" },
    invoice: { label: "Bills & invoices", width: 384, height: 512, path: "M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM64 80c0-8.8 7.2-16 16-16l64 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L80 96c-8.8 0-16-7.2-16-16zm0 64c0-8.8 7.2-16 16-16l64 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-64 0c-8.8 0-16-7.2-16-16zm128 72c8.8 0 16 7.2 16 16l0 17.3c8.5 1.2 16.7 3.1 24.1 5.1c8.5 2.3 13.6 11 11.3 19.6s-11 13.6-19.6 11.3c-11.1-3-22-5.2-32.1-5.3c-8.4-.1-17.4 1.8-23.6 5.5c-5.7 3.4-8.1 7.3-8.1 12.8c0 3.7 1.3 6.5 7.3 10.1c6.9 4.1 16.6 7.1 29.2 10.9l.5 .1c11.3 3.4 25.3 7.6 36.3 14.6c12.1 7.6 22.4 19.7 22.7 38.2c.3 19.3-9.6 33.3-22.9 41.6c-7.7 4.8-16.4 7.6-25.1 9.1l0 17.1c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-17.8c-11.2-2.1-21.7-5.7-30.9-8.9c-2.1-.7-4.2-1.4-6.2-2.1c-8.4-2.8-12.9-11.9-10.1-20.2s11.9-12.9 20.2-10.1c2.5 .8 4.8 1.6 7.1 2.4c13.6 4.6 24.6 8.4 36.3 8.7c9.1 .3 17.9-1.7 23.7-5.3c5.1-3.2 7.9-7.3 7.8-14c-.1-4.6-1.8-7.8-7.7-11.6c-6.8-4.3-16.5-7.4-29-11.2l-1.6-.5c-11-3.3-24.3-7.3-34.8-13.7c-12-7.2-22.6-18.9-22.7-37.3c-.1-19.4 10.8-32.8 23.8-40.5c7.5-4.4 15.8-7.2 24.1-8.7l0-17.3c0-8.8 7.2-16 16-16z" },
    house: { label: "Home", width: 576, height: 512, path: "M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z" },
    heart: { label: "Health", width: 512, height: 512, path: "M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z" },
    plane: { label: "Travel", width: 576, height: 512, path: "M482.3 192c34.2 0 93.7 29 93.7 64c0 36-59.5 64-93.7 64l-116.6 0L265.2 495.9c-5.7 10-16.3 16.1-27.8 16.1l-56.2 0c-10.6 0-18.3-10.2-15.4-20.4l49-171.6L112 320 68.8 377.6c-3 4-7.8 6.4-12.8 6.4l-42 0c-7.8 0-14-6.3-14-14c0-1.3 .2-2.6 .5-3.9L32 256 .5 145.9c-.4-1.3-.5-2.6-.5-3.9c0-7.8 6.3-14 14-14l42 0c5 0 9.8 2.4 12.8 6.4L112 192l102.9 0-49-171.6C162.9 10.2 170.6 0 181.2 0l56.2 0c11.5 0 22.1 6.2 27.8 16.1L365.7 192l116.6 0z" },
    gift: { label: "Gifts", width: 512, height: 512, path: "M190.5 68.8L225.3 128l-1.3 0-72 0c-22.1 0-40-17.9-40-40s17.9-40 40-40l2.2 0c14.9 0 28.8 7.9 36.3 20.8zM64 88c0 14.4 3.5 28 9.6 40L32 128c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32l448 0c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l-41.6 0c6.1-12 9.6-25.6 9.6-40c0-48.6-39.4-88-88-88l-2.2 0c-31.9 0-61.5 16.9-77.7 44.4L256 85.5l-24.1-41C215.7 16.9 186.1 0 154.2 0L152 0C103.4 0 64 39.4 64 88zm336 0c0 22.1-17.9 40-40 40l-72 0-1.3 0 34.8-59.2C329.1 55.9 342.9 48 357.8 48l2.2 0c22.1 0 40 17.9 40 40zM32 288l0 176c0 26.5 21.5 48 48 48l144 0 0-224L32 288zM288 512l144 0c26.5 0 48-21.5 48-48l0-176-192 0 0 224z" },
    briefcase: { label: "Work", width: 512, height: 512, path: "M184 48l144 0c4.4 0 8 3.6 8 8l0 40L176 96l0-40c0-4.4 3.6-8 8-8zm-56 8l0 40L64 96C28.7 96 0 124.7 0 160l0 96 192 0 128 0 192 0 0-96c0-35.3-28.7-64-64-64l-64 0 0-40c0-30.9-25.1-56-56-56L184 0c-30.9 0-56 25.1-56 56zM512 288l-192 0 0 32c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-32L0 288 0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-128z" },
    gamepad: { label: "Entertainment", width: 640, height: 512, path: "M192 64C86 64 0 150 0 256S86 448 192 448l256 0c106 0 192-86 192-192s-86-192-192-192L192 64zM496 168a40 40 0 1 1 0 80 40 40 0 1 1 0-80zM392 304a40 40 0 1 1 80 0 40 40 0 1 1 -80 0zM168 200c0-13.3 10.7-24 24-24s24 10.7 24 24l0 32 32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0 0 32c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32-32 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l32 0 0-32z" },
    paw: { label: "Pets", width: 512, height: 512, path: "M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5l0 1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3l0-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z" },
    tools: { label: "Services & repairs", width: 512, height: 512, path: "M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4l54.1 0 109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109 0-54.1c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.1-20.7-3.2-30.5c-2.4-11.2-16.1-14.1-24.2-6l-63.9 63.9c-3 3-7.1 4.7-11.3 4.7L352 176c-8.8 0-16-7.2-16-16l0-57.4c0-4.2 1.7-8.3 4.7-11.3l63.9-63.9c8.1-8.1 5.2-21.8-6-24.2C388.7 1.1 378.5 0 368 0C288.5 0 224 64.5 224 144l0 .8 85.3 85.3c36-9.1 75.8 .5 104 28.7L429 274.5c49-23 83-72.8 83-130.5zM56 432a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" }
  };

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

  const els = {
    board: document.getElementById("board"),
    boardMeta: document.getElementById("boardMeta"),
    deleteAllBtn: document.getElementById("deleteAllBtn"),
    importXlsxBtn: document.getElementById("importXlsxBtn"),
    summaryBtn: document.getElementById("summaryBtn"),
    allPlannedBtn: document.getElementById("allPlannedBtn"),
    restoreBtn: document.getElementById("restoreBtn"),
    exportBtn: document.getElementById("exportBtn"),
    addColumnBtn: document.getElementById("addColumnBtn"),
    xlsxInput: document.getElementById("xlsxInput"),
    backupInput: document.getElementById("backupInput"),
    expenseDialog: document.getElementById("expenseDialog"),
    expenseForm: document.getElementById("expenseForm"),
    expenseDialogTitle: document.getElementById("expenseDialogTitle"),
    expenseId: document.getElementById("expenseId"),
    expenseDate: document.getElementById("expenseDate"),
    expenseCard: document.getElementById("expenseCard"),
    expenseDescription: document.getElementById("expenseDescription"),
    expenseNote: document.getElementById("expenseNote"),
    expenseOriginalCategory: document.getElementById("expenseOriginalCategory"),
    expenseColumn: document.getElementById("expenseColumn"),
    expensePlannedMatch: document.getElementById("expensePlannedMatch"),
    expenseAmount: document.getElementById("expenseAmount"),
    expenseCurrency: document.getElementById("expenseCurrency"),
    expenseInitialAmount: document.getElementById("expenseInitialAmount"),
    expenseInitialCurrency: document.getElementById("expenseInitialCurrency"),
    expenseRemainingAmount: document.getElementById("expenseRemainingAmount"),
    expenseRemainingCurrency: document.getElementById("expenseRemainingCurrency"),
    splitExpenseDialog: document.getElementById("splitExpenseDialog"),
    splitExpenseForm: document.getElementById("splitExpenseForm"),
    splitSourceExpenseId: document.getElementById("splitSourceExpenseId"),
    splitSourceSummary: document.getElementById("splitSourceSummary"),
    splitDescription: document.getElementById("splitDescription"),
    splitInitialBasisOption: document.getElementById("splitInitialBasisOption"),
    splitPlainCurrency: document.getElementById("splitPlainCurrency"),
    splitInitialCurrency: document.getElementById("splitInitialCurrency"),
    splitPlainAmount: document.getElementById("splitPlainAmount"),
    splitInitialAmount: document.getElementById("splitInitialAmount"),
    splitAmountHelp: document.getElementById("splitAmountHelp"),
    splitPreview: document.getElementById("splitPreview"),
    mergeExpenseDialog: document.getElementById("mergeExpenseDialog"),
    mergeExpenseForm: document.getElementById("mergeExpenseForm"),
    mergeParentExpenseId: document.getElementById("mergeParentExpenseId"),
    mergeParentSummary: document.getElementById("mergeParentSummary"),
    mergeChildList: document.getElementById("mergeChildList"),
    mergeSelectAllBtn: document.getElementById("mergeSelectAllBtn"),
    mergeClearSelectionBtn: document.getElementById("mergeClearSelectionBtn"),
    mergePlannedMatch: document.getElementById("mergePlannedMatch"),
    mergePreview: document.getElementById("mergePreview"),
    columnDialog: document.getElementById("columnDialog"),
    columnForm: document.getElementById("columnForm"),
    columnDialogTitle: document.getElementById("columnDialogTitle"),
    columnId: document.getElementById("columnId"),
    columnTitle: document.getElementById("columnTitle"),
    columnColor: document.getElementById("columnColor"),
    columnColorText: document.getElementById("columnColorText"),
    columnIcon: document.getElementById("columnIcon"),
    columnIconPreview: document.getElementById("columnIconPreview"),
    colorPalette: document.getElementById("colorPalette"),
    sortDialog: document.getElementById("sortDialog"),
    sortForm: document.getElementById("sortForm"),
    sortColumnId: document.getElementById("sortColumnId"),
    maskDialog: document.getElementById("maskDialog"),
    maskForm: document.getElementById("maskForm"),
    maskPattern: document.getElementById("maskPattern"),
    maskTargetColumn: document.getElementById("maskTargetColumn"),
    maskPreview: document.getElementById("maskPreview"),
    bulkLabelDialog: document.getElementById("bulkLabelDialog"),
    bulkLabelForm: document.getElementById("bulkLabelForm"),
    bulkLabelColumnId: document.getElementById("bulkLabelColumnId"),
    bulkLabelDescription: document.getElementById("bulkLabelDescription"),
    goalDialog: document.getElementById("goalDialog"),
    goalForm: document.getElementById("goalForm"),
    goalDialogTitle: document.getElementById("goalDialogTitle"),
    goalColumnId: document.getElementById("goalColumnId"),
    goalCurrency: document.getElementById("goalCurrency"),
    goalSharePercent: document.getElementById("goalSharePercent"),
    goalAmountLimit: document.getElementById("goalAmountLimit"),
    goalPreview: document.getElementById("goalPreview"),
    clearGoalBtn: document.getElementById("clearGoalBtn"),
    summaryDialog: document.getElementById("summaryDialog"),
    summaryContent: document.getElementById("summaryContent"),
    allPlannedDialog: document.getElementById("allPlannedDialog"),
    allPlannedContent: document.getElementById("allPlannedContent"),
    plannedDialog: document.getElementById("plannedDialog"),
    plannedDialogTitle: document.getElementById("plannedDialogTitle"),
    plannedColumnId: document.getElementById("plannedColumnId"),
    plannedOverview: document.getElementById("plannedOverview"),
    plannedList: document.getElementById("plannedList"),
    addPlannedBtn: document.getElementById("addPlannedBtn"),
    plannedEditDialog: document.getElementById("plannedEditDialog"),
    plannedForm: document.getElementById("plannedForm"),
    plannedEditTitle: document.getElementById("plannedEditTitle"),
    plannedId: document.getElementById("plannedId"),
    plannedEditColumnId: document.getElementById("plannedEditColumnId"),
    plannedSourceExpenseId: document.getElementById("plannedSourceExpenseId"),
    plannedDescription: document.getElementById("plannedDescription"),
    plannedTitleHelp: document.getElementById("plannedTitleHelp"),
    plannedSourceInfo: document.getElementById("plannedSourceInfo"),
    plannedAmount1: document.getElementById("plannedAmount1"),
    plannedCurrency1: document.getElementById("plannedCurrency1"),
    plannedAmount2: document.getElementById("plannedAmount2"),
    plannedCurrency2: document.getElementById("plannedCurrency2"),
    plannedClosed: document.getElementById("plannedClosed"),
    plannedMatchDialog: document.getElementById("plannedMatchDialog"),
    plannedMatchForm: document.getElementById("plannedMatchForm"),
    plannedMatchTitle: document.getElementById("plannedMatchTitle"),
    plannedMatchId: document.getElementById("plannedMatchId"),
    plannedMatchExpense: document.getElementById("plannedMatchExpense"),
    plannedMatchPreview: document.getElementById("plannedMatchPreview"),
    unmatchPlannedBtn: document.getElementById("unmatchPlannedBtn"),
    importDialog: document.getElementById("importDialog"),
    chooseXlsxBtn: document.getElementById("chooseXlsxBtn"),
    toastRegion: document.getElementById("toastRegion")
  };

  let state = loadState();
  let draggedExpenseId = null;
  let draggedColumnId = null;
  let columnDropPosition = "before";
  let returnToPlannedColumnId = null;
  let returnToAllPlanned = false;

  init();

  function init() {
    renderPalette();
    renderColumnIconOptions();
    refreshCurrencySelects();
    bindEvents();
    syncAllPlanClosedStates();
    renderBoard();
  }

  function bindEvents() {
    els.addColumnBtn.addEventListener("click", () => openColumnDialog());
    els.importXlsxBtn.addEventListener("click", () => openDialog(els.importDialog));
    els.summaryBtn.addEventListener("click", openSummaryDialog);
    els.allPlannedBtn.addEventListener("click", openAllPlannedDialog);
    els.chooseXlsxBtn.addEventListener("click", () => {
      els.importDialog.close();
      els.xlsxInput.value = "";
      els.xlsxInput.click();
    });
    els.restoreBtn.addEventListener("click", () => {
      els.backupInput.value = "";
      els.backupInput.click();
    });
    els.exportBtn.addEventListener("click", exportBoard);
    els.deleteAllBtn.addEventListener("click", deleteAllExpenses);
    els.xlsxInput.addEventListener("change", importXlsx);
    els.backupInput.addEventListener("change", restoreBoard);
    els.expenseForm.addEventListener("submit", saveExpenseFromForm);
    els.splitExpenseForm.addEventListener("submit", saveSplitExpenseFromForm);
    els.splitExpenseForm.addEventListener("change", event => {
      if (event.target.matches('input[name="splitBasis"]')) updateSplitBasis();
    });
    els.splitPlainAmount.addEventListener("input", updateSplitPreview);
    els.splitInitialAmount.addEventListener("input", updateSplitPreview);
    els.mergeExpenseForm.addEventListener("submit", saveMergeExpenseFromForm);
    els.mergeChildList.addEventListener("change", updateMergePreview);
    els.mergePlannedMatch.addEventListener("change", () => {
      els.mergePlannedMatch.dataset.userSelected = "true";
      updateMergePreview();
    });
    els.mergeSelectAllBtn.addEventListener("click", () => {
      els.mergeChildList.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = true; });
      updateMergePreview();
    });
    els.mergeClearSelectionBtn.addEventListener("click", () => {
      els.mergeChildList.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = false; });
      updateMergePreview();
    });
    els.expenseColumn.addEventListener("change", () => {
      fillExpensePlannedSelect(els.expenseColumn.value, els.expenseId.value, els.expensePlannedMatch.value);
    });
    els.columnForm.addEventListener("submit", saveColumnFromForm);
    els.sortForm.addEventListener("submit", saveSortFromForm);
    els.maskForm.addEventListener("submit", moveByMaskFromForm);
    els.bulkLabelForm.addEventListener("submit", applyBulkLabelFromForm);
    els.goalForm.addEventListener("submit", saveGoalFromForm);
    els.clearGoalBtn.addEventListener("click", clearCurrentColumnGoals);
    [els.goalCurrency, els.goalSharePercent, els.goalAmountLimit].forEach(input => input.addEventListener("input", updateGoalPreview));
    els.summaryContent.addEventListener("click", handleSummaryClick);
    els.allPlannedContent.addEventListener("click", handleAllPlannedClick);
    els.allPlannedContent.addEventListener("change", handleAllPlannedChange);
    els.addPlannedBtn.addEventListener("click", () => openPlannedEditDialog(null, els.plannedColumnId.value));
    els.plannedList.addEventListener("click", handlePlannedListClick);
    els.plannedList.addEventListener("change", handlePlannedListChange);
    els.plannedForm.addEventListener("submit", savePlannedFromForm);
    els.plannedMatchForm.addEventListener("submit", savePlannedMatchFromForm);
    els.plannedMatchExpense.addEventListener("change", updatePlannedMatchPreview);
    els.unmatchPlannedBtn.addEventListener("click", unmatchCurrentPlanned);
    [els.plannedEditDialog, els.plannedMatchDialog].forEach(dialog => dialog.addEventListener("close", () => {
      if (returnToAllPlanned) {
        returnToAllPlanned = false;
        openAllPlannedDialog();
        return;
      }
      if (!returnToPlannedColumnId) return;
      const columnId = returnToPlannedColumnId;
      returnToPlannedColumnId = null;
      if (state.columns.some(column => column.id === columnId)) openPlannedDialog(columnId);
    }));
    els.maskPattern.addEventListener("input", updateMaskPreview);
    els.maskTargetColumn.addEventListener("change", updateMaskPreview);

    document.querySelectorAll("[data-dialog-close]").forEach(button => {
      button.addEventListener("click", () => {
        const dialog = button.closest("dialog");
        if (dialog?.open) dialog.close("cancel");
      });
    });

    els.columnColor.addEventListener("input", () => {
      els.columnColorText.value = els.columnColor.value.toLowerCase();
    });
    els.columnIcon.addEventListener("change", updateColumnIconPreview);
    els.columnColorText.addEventListener("input", () => {
      if (isHexColor(els.columnColorText.value)) {
        els.columnColor.value = els.columnColorText.value;
      }
    });

    document.querySelectorAll(".currency-select").forEach(select => {
      select.addEventListener("focus", () => { select.dataset.previousCurrency = select.value; });
      select.addEventListener("pointerdown", () => { select.dataset.previousCurrency = select.value; });
      select.addEventListener("change", handleCurrencySelectChange);
    });

    els.board.addEventListener("click", handleBoardClick);
    els.board.addEventListener("keydown", handleBoardKeydown);
    els.board.addEventListener("dragstart", handleDragStart);
    els.board.addEventListener("dragend", handleDragEnd);
    els.board.addEventListener("dragover", handleDragOver);
    els.board.addEventListener("dragleave", handleDragLeave);
    els.board.addEventListener("drop", handleDrop);

    window.addEventListener("beforeunload", persistState);
  }

  function renderBoard() {
    const categoryCount = state.columns.filter(column => !column.locked).length;
    const boardTransactionSums = groupCurrency(state.expenses, "amount", "currency");
    els.boardMeta.textContent = `${state.expenses.length} ${pluralize(state.expenses.length, "expense", "expenses")} · ${state.plannedExpenses.length} planned · ${categoryCount} ${pluralize(categoryCount, "column", "columns")}`;
    els.deleteAllBtn.disabled = state.expenses.length === 0;

    els.board.innerHTML = state.columns.map(column => {
      const expenses = getSortedColumnExpenses(column, state.expenses.filter(expense => expense.columnId === column.id));
      const sortMode = getColumnSortMode(column);
      const goal = getColumnGoal(column);
      const goalTitle = hasActiveGoal(goal) ? "Edit column goals" : "Add column goals";
      const columnPlans = state.plannedExpenses.filter(plan => plan.columnId === column.id);
      const openPlanCount = columnPlans.filter(plan => plan.closed !== true).length;

      if (column.folded === true) {
        return `
          <article class="column column-folded" data-column-id="${escapeHtml(column.id)}" style="--column-color:${escapeHtml(column.color)}" aria-label="Folded column ${escapeHtml(column.title)}">
            <header class="folded-column-header">
              <button class="folded-column-icon" type="button" data-action="toggle-column-fold" data-column-id="${escapeHtml(column.id)}" title="${escapeHtml(column.title)} · Click to expand" aria-label="Expand ${escapeHtml(column.title)} column">
                ${renderColumnIcon(column.icon)}
              </button>
              <span class="folded-column-count" title="${expenses.length} ${pluralize(expenses.length, "expense", "expenses")}"><strong>${expenses.length}</strong><small>expenses</small></span>
              <button class="folded-column-count folded-planned-count ${openPlanCount ? "has-unmatched" : ""}" type="button" data-action="open-planned-list" data-column-id="${escapeHtml(column.id)}" title="${columnPlans.length} planned expenses · ${openPlanCount} open">
                <strong>${columnPlans.length}</strong><small>planned</small>
              </button>
            </header>
            <div class="folded-column-drop-zone" data-column-id="${escapeHtml(column.id)}" title="Drop expenses into ${escapeHtml(column.title)}"></div>
          </article>
        `;
      }

      return `
        <article class="column" data-column-id="${escapeHtml(column.id)}" style="--column-color:${escapeHtml(column.color)}">
          <header class="column-header">
            <div class="column-title-row">
              ${column.locked ? "" : `<span class="column-drag-handle" draggable="true" tabindex="0" role="button" data-column-id="${escapeHtml(column.id)}" aria-label="Reorder ${escapeHtml(column.title)} column. Drag, or use the left and right arrow keys." title="Drag to reorder · Arrow keys move left/right">⠿</span>`}
              <span class="column-dot" aria-hidden="true"></span>
              <h2 class="column-title" title="${escapeHtml(column.title)}">${escapeHtml(column.title)}</h2>
              <span class="count-badge">${expenses.length}</span>
            </div>
            <div class="column-actions-row">
              <button class="planned-count-btn ${openPlanCount ? "has-unmatched" : ""}" type="button" data-action="open-planned-list" data-column-id="${escapeHtml(column.id)}" title="Open planned expenses · ${openPlanCount} remaining (not closed)">
                <span aria-hidden="true">◷</span><strong>${openPlanCount}</strong><small>remaining</small>
              </button>
              <div class="column-actions">
                <button class="icon-btn" type="button" data-action="toggle-column-fold" data-column-id="${escapeHtml(column.id)}" title="Fold column horizontally" aria-label="Fold ${escapeHtml(column.title)} column">⇤</button>
                <button class="icon-btn ${hasActiveGoal(goal) ? "has-goal" : ""}" type="button" data-action="open-goal" data-column-id="${escapeHtml(column.id)}" title="${goalTitle}">◎</button>
                <button class="icon-btn" type="button" data-action="open-sort" data-column-id="${escapeHtml(column.id)}" title="Sort groups: ${escapeHtml(SORT_MODES[sortMode].label)}">⇅</button>
                ${column.locked ? "" : `<button class="icon-btn mask-move-btn" type="button" data-action="open-mask-move" data-column-id="${escapeHtml(column.id)}" title="Move matching Unassigned tickets here">⇥</button>`}
                <button class="icon-btn" type="button" data-action="add-expense" data-column-id="${escapeHtml(column.id)}" title="Add expense">＋</button>
                ${column.locked ? "" : `<button class="icon-btn" type="button" data-action="edit-column" data-column-id="${escapeHtml(column.id)}" title="Edit column">✎</button>`}
                ${column.locked ? "" : `<button class="icon-btn danger" type="button" data-action="delete-column" data-column-id="${escapeHtml(column.id)}" title="Delete column">⌫</button>`}
              </div>
            </div>
            ${renderSummary(column, expenses, boardTransactionSums)}
          </header>
          <div class="ticket-list" data-column-id="${escapeHtml(column.id)}">
            ${expenses.length ? renderTicketGroups(column, expenses) : `<div class="empty-column">${column.locked ? "No unassigned expenses" : "Drop expenses here"}</div>`}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderTicketGroups(column, expenses) {
    const collapsedLabels = getCollapsedLabels(column);
    const labelOrder = SORT_MODES[getColumnSortMode(column)].order;
    const groups = new Map(LABELS.map(label => [label, []]));
    expenses.forEach(expense => groups.get(normalizeLabel(expense.label)).push(expense));

    return labelOrder
      .filter(label => groups.get(label).length)
      .map(label => {
        const items = groups.get(label);
        const collapsed = collapsedLabels.includes(label);
        const title = labelTitle(label);
        const totals = groupCurrency(items, "amount", "currency")
          .map(item => `${formatMoney(item.amount)} ${escapeHtml(item.currency)}`)
          .join(" · ");

        return `
          <section class="ticket-group ${collapsed ? "collapsed" : ""}" data-label="${label}">
            <div class="ticket-group-header-row">
              <button class="ticket-group-header" type="button" data-action="toggle-label-group" data-column-id="${escapeHtml(column.id)}" data-label="${label}" aria-expanded="${collapsed ? "false" : "true"}" title="${collapsed ? "Expand" : "Collapse"} ${escapeHtml(title)} tickets">
                <span class="ticket-group-name"><span class="label-dot ${label}"></span><strong>${escapeHtml(title)}</strong><span class="ticket-group-count">${items.length}</span></span>
                <span class="ticket-group-total">${totals}</span>
                <span class="ticket-group-chevron" aria-hidden="true">⌄</span>
              </button>
              ${label === "none" ? `<button class="bulk-label-btn" type="button" data-action="open-bulk-label" data-column-id="${escapeHtml(column.id)}" title="Apply one label to all unlabelled expenses in this column">Label all</button>` : ""}
            </div>
            <div class="ticket-group-body">${items.map(renderTicket).join("")}</div>
          </section>
        `;
      }).join("");
  }

  function getSortedColumnExpenses(column, expenses) {
    const labelOrder = SORT_MODES[getColumnSortMode(column)].order;
    const orderIndex = new Map(labelOrder.map((label, index) => [label, index]));
    return [...expenses].sort((a, b) => {
      const byLabel = orderIndex.get(normalizeLabel(a.label)) - orderIndex.get(normalizeLabel(b.label));
      if (byLabel !== 0) return byLabel;
      const dateDiff = parseDateForSort(b.date) - parseDateForSort(a.date);
      if (dateDiff !== 0) return dateDiff;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }

  function getColumnSortMode(column) {
    return SORT_MODES[column?.sortMode] ? column.sortMode : DEFAULT_SORT_MODE;
  }

  function getCollapsedLabels(column) {
    return Array.isArray(column?.collapsedLabels) ? column.collapsedLabels.filter(label => LABELS.includes(label)) : [];
  }

  function normalizeLabel(label) {
    return LABELS.includes(label) ? label : "none";
  }

  function renderSummary(column, expenses, boardTransactionSums) {
    const goal = getColumnGoal(column);
    const openPlanCount = state.plannedExpenses.filter(plan => plan.columnId === column.id && plan.closed !== true).length;
    const remainingPlannedSums = getColumnRemainingPlannedSums(column.id);
    if (!expenses.length && !hasActiveGoal(goal) && !remainingPlannedSums.length && !openPlanCount) return "";

    const transactionSums = groupCurrency(expenses, "amount", "currency");
    const initialSums = groupCurrency(expenses, "initialAmount", "initialCurrency");
    const labelStats = buildLabelStats(expenses, transactionSums);

    const remainingPlannedRows = remainingPlannedSums.map(item => `
      <div class="summary-row planned-unmatched-row">
        <span class="summary-label"><span>${escapeHtml(item.currency)}</span></span>
        <span class="summary-value">${formatMoney(item.amount)}</span>
      </div>
    `).join("");

    const transactionRows = transactionSums.map(item => `
      <div class="summary-row">
        <span class="summary-label"><span>${escapeHtml(item.currency)}</span></span>
        <span class="summary-value">${formatMoney(item.amount)}</span>
      </div>
    `).join("");

    const overallShareRows = transactionSums.map(item => {
      const boardTotal = getCurrencyTotal(boardTransactionSums, item.currency);
      const percentage = boardTotal ? item.amount / boardTotal * 100 : 0;
      return `
        <div class="summary-row overall-share-row">
          <span class="summary-label"><span>${escapeHtml(item.currency)}</span></span>
          <span class="summary-value">${formatPercent(percentage)}%</span>
        </div>
      `;
    }).join("");

    const initialRows = initialSums.map(item => `
      <div class="summary-row">
        <span class="summary-label"><span>${escapeHtml(item.currency)} (initial)</span></span>
        <span class="summary-value">${formatMoney(item.amount)}</span>
      </div>
    `).join("");

    const labelRows = labelStats.map(item => `
      <div class="summary-row">
        <span class="summary-label"><span class="label-dot ${item.label}"></span><span>${escapeHtml(item.currency)}</span></span>
        <span class="summary-value">${formatMoney(item.amount)} (${formatPercent(item.percentage)}%)</span>
      </div>
    `).join("");

    const goalCurrency = goal.currency || "UAH";
    const currentGoalAmount = getAmountForCurrency(expenses, goalCurrency);
    const boardGoalTotal = getCurrencyTotal(boardTransactionSums, goalCurrency);
    const currentGoalShare = boardGoalTotal ? currentGoalAmount / boardGoalTotal * 100 : 0;
    const goalRows = [
      isFiniteNumber(goal.sharePercent) ? `
        <div class="summary-row goal-summary-row">
          <span class="summary-label"><span class="goal-status-dot ${goalStatusClass(currentGoalShare, goal.sharePercent)}"></span><span>Share ${escapeHtml(goalCurrency)}</span></span>
          <span class="summary-value ${goalStatusClass(currentGoalShare, goal.sharePercent)}">${formatPercent(currentGoalShare)}% / ≤${formatPercent(goal.sharePercent)}%</span>
        </div>
      ` : "",
      isFiniteNumber(goal.amountLimit) ? `
        <div class="summary-row goal-summary-row">
          <span class="summary-label"><span class="goal-status-dot ${goalStatusClass(currentGoalAmount, goal.amountLimit)}"></span><span>Limit ${escapeHtml(goalCurrency)}</span></span>
          <span class="summary-value ${goalStatusClass(currentGoalAmount, goal.amountLimit)}">${formatMoney(currentGoalAmount)} / ${formatMoney(goal.amountLimit)}</span>
        </div>
      ` : ""
    ].join("");

    return `
      <div class="summary">
        ${openPlanCount ? `<div class="summary-section planned-summary-section"><div class="summary-row"><span class="summary-key">Planned remaining (${openPlanCount})</span><span></span></div>${remainingPlannedRows || `<div class="summary-row planned-unmatched-row"><span class="summary-label"><span>No amount remaining</span></span><span class="summary-value">0</span></div>`}</div>` : ""}
        ${transactionRows ? `<div class="summary-section"><div class="summary-row"><span class="summary-key">Transactions</span><span></span></div>${transactionRows}</div>` : ""}
        ${overallShareRows ? `<div class="summary-section overall-share-section"><div class="summary-row"><span class="summary-key">Overall share</span><span></span></div>${overallShareRows}</div>` : ""}
        ${initialRows ? `<div class="summary-section"><div class="summary-row"><span class="summary-key">Initial</span><span></span></div>${initialRows}</div>` : ""}
        ${labelRows ? `<div class="summary-section"><div class="summary-row"><span class="summary-key">Labels</span><span></span></div>${labelRows}</div>` : ""}
        ${goalRows ? `<div class="summary-section goal-summary-section"><div class="summary-row"><span class="summary-key">Goals</span><span></span></div>${goalRows}</div>` : ""}
      </div>
    `;
  }

  function renderTicket(expense) {
    const labelClass = expense.label && expense.label !== "none" ? `label-${expense.label}` : "";
    const displayDate = expense.date || "Date not specified";
    const card = expense.card || "Card not specified";
    const originalCategory = expense.originalCategory || "Category not specified";
    const note = cellText(expense.note);
    const matchedPlan = state.plannedExpenses.find(plan => planHasExpense(plan, expense.id)) || null;
    const splitSource = expense.splitFromExpenseId
      ? state.expenses.find(item => item.id === expense.splitFromExpenseId) || null
      : null;
    const extractedExpenses = state.expenses
      .filter(item => item.splitFromExpenseId === expense.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const footerParts = [];

    if (isFiniteNumber(expense.initialAmount)) {
      footerParts.push(`Initial: <strong>${formatMoney(expense.initialAmount)} ${escapeHtml(expense.initialCurrency || "")}</strong>`);
    }
    if (isFiniteNumber(expense.remainingAmount)) {
      footerParts.push(`Balance: <strong>${formatMoney(expense.remainingAmount)} ${escapeHtml(expense.remainingCurrency || "")}</strong>`);
    }

    const splitRelationMarkup = `
      ${splitSource ? `
        <div class="split-source-link">
          <span>Extracted from</span>
          <button type="button" data-action="navigate-expense" data-expense-id="${escapeHtml(splitSource.id)}" title="Go to original expense">${escapeHtml(splitSource.description)}</button>
        </div>
      ` : ""}
      ${extractedExpenses.length ? `
        <details class="split-children">
          <summary>Extracted expenses <span>${extractedExpenses.length}</span></summary>
          <div class="split-children-list">
            ${extractedExpenses.map(child => `
              <button type="button" data-action="navigate-expense" data-expense-id="${escapeHtml(child.id)}" title="Go to extracted expense">
                <span>${escapeHtml(child.description)}</span>
                <strong>${formatMoney(child.amount)} ${escapeHtml(child.currency || "")}</strong>
              </button>
            `).join("")}
          </div>
          <div class="split-children-actions">
            <button class="btn btn-compact" type="button" data-action="merge-extracted" data-expense-id="${escapeHtml(expense.id)}">↶ Merge extracted</button>
          </div>
        </details>
      ` : ""}
    `;

    return `
      <article class="ticket ${labelClass}" draggable="true" data-expense-id="${escapeHtml(expense.id)}">
        <div class="ticket-top">
          <div class="ticket-amount">
            <strong>${formatMoney(expense.amount)}</strong><span>${escapeHtml(expense.currency || "")}</span>
          </div>
          <div class="ticket-tools">
            <div class="traffic-lights" aria-label="Ticket label">
              ${["blue", "green", "yellow", "red"].map(label => `<button class="traffic-btn ${label} ${expense.label === label ? "active" : ""}" type="button" data-action="set-label" data-expense-id="${escapeHtml(expense.id)}" data-label="${label}" title="${escapeHtml(labelTitle(label))} label"></button>`).join("")}
            </div>
            ${splitSource ? "" : `<button class="icon-btn split-expense-btn" type="button" data-action="split-expense" data-expense-id="${escapeHtml(expense.id)}" title="Split this expense" aria-label="Split expense">✂</button>`}
            ${extractedExpenses.length ? `<button class="icon-btn merge-expense-btn" type="button" data-action="merge-extracted" data-expense-id="${escapeHtml(expense.id)}" title="Merge extracted expenses back" aria-label="Merge extracted expenses">↶</button>` : ""}
            <button class="icon-btn plan-from-ticket-btn ${matchedPlan ? "has-matched-plan" : ""}" type="button" data-action="create-matched-plan-from-expense" data-expense-id="${escapeHtml(expense.id)}" title="${matchedPlan ? "Edit the matched planned expense" : "Create a matched planned expense from this ticket"}" aria-label="${matchedPlan ? "Edit matched planned expense" : "Create matched planned expense"}">◷</button>
            <button class="icon-btn" type="button" data-action="edit-expense" data-expense-id="${escapeHtml(expense.id)}" title="Edit expense">✎</button>
            <button class="icon-btn danger" type="button" data-action="delete-expense" data-expense-id="${escapeHtml(expense.id)}" title="Delete expense">×</button>
          </div>
        </div>
        <div class="ticket-description" title="${escapeHtml(expense.description)}">${escapeHtml(expense.description)}</div>
        <div class="ticket-meta">
          <div class="meta-row"><span class="meta-icon" aria-hidden="true">▣</span><span class="meta-text">${escapeHtml(displayDate)}</span></div>
          <div class="meta-row"><span class="meta-icon" aria-hidden="true">▭</span><span class="meta-text">${escapeHtml(card)}</span></div>
          <div class="meta-row"><span class="meta-icon" aria-hidden="true">◇</span><span class="meta-text">${escapeHtml(originalCategory)}</span></div>
        </div>
        ${note ? `<div class="ticket-note" title="${escapeHtml(note)}"><span class="ticket-note-icon" aria-hidden="true">✎</span><span>${escapeHtml(note)}</span></div>` : ""}
        ${splitRelationMarkup}
        ${footerParts.length ? `<div class="ticket-footer">${footerParts.map(part => `<span>${part}</span>`).join("")}</div>` : ""}
      </article>
    `;
  }

  function handleBoardClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    if (action === "add-expense") openExpenseDialog(null, button.dataset.columnId);
    if (action === "edit-column") openColumnDialog(button.dataset.columnId);
    if (action === "delete-column") deleteColumn(button.dataset.columnId);
    if (action === "open-goal") openGoalDialog(button.dataset.columnId);
    if (action === "open-sort") openSortDialog(button.dataset.columnId);
    if (action === "open-mask-move") openMaskDialog(button.dataset.columnId);
    if (action === "open-bulk-label") openBulkLabelDialog(button.dataset.columnId);
    if (action === "open-planned-list") openPlannedDialog(button.dataset.columnId);
    if (action === "toggle-column-fold") toggleColumnFold(button.dataset.columnId);
    if (action === "toggle-label-group") toggleLabelGroup(button.dataset.columnId, button.dataset.label);
    if (action === "create-matched-plan-from-expense") openMatchedPlannedFromExpense(button.dataset.expenseId);
    if (action === "split-expense") openSplitExpenseDialog(button.dataset.expenseId);
    if (action === "merge-extracted") openMergeExpenseDialog(button.dataset.expenseId);
    if (action === "navigate-expense") navigateToExpense(button.dataset.expenseId, { openEditor: true });
    if (action === "edit-expense") openExpenseDialog(button.dataset.expenseId);
    if (action === "delete-expense") deleteExpense(button.dataset.expenseId);
    if (action === "set-label") setExpenseLabel(button.dataset.expenseId, button.dataset.label);
  }

  function navigateToExpense(expenseId, options = {}) {
    const expense = state.expenses.find(item => item.id === expenseId);
    if (!expense) {
      showToast("The selected expense no longer exists.", "error");
      return;
    }

    if (options.closeDialog?.open) options.closeDialog.close();

    const revealAndHighlight = () => {
      const ticket = [...els.board.querySelectorAll(".ticket")]
        .find(item => item.dataset.expenseId === expenseId);
      if (!ticket) return;

      const collapsedGroup = ticket.closest(".ticket-group.collapsed");
      if (collapsedGroup) {
        collapsedGroup.classList.remove("collapsed");
        const groupButton = collapsedGroup.querySelector('[data-action="toggle-label-group"]');
        if (groupButton) {
          groupButton.setAttribute("aria-expanded", "true");
          groupButton.title = `Collapse ${labelTitle(collapsedGroup.dataset.label)} tickets`;
        }
      }

      document.querySelectorAll(".ticket.ticket-navigation-highlight").forEach(item => {
        item.classList.remove("ticket-navigation-highlight");
      });

      ticket.classList.remove("ticket-navigation-highlight");
      void ticket.offsetWidth;
      ticket.classList.add("ticket-navigation-highlight");
      ticket.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

      window.setTimeout(() => {
        ticket.classList.remove("ticket-navigation-highlight");
      }, 4200);

      if (options.openEditor) {
        window.setTimeout(() => openExpenseDialog(expenseId), 850);
      }
    };

    window.setTimeout(revealAndHighlight, options.closeDialog ? 80 : 0);
  }

  function handleBoardKeydown(event) {
    const handle = event.target.closest(".column-drag-handle");
    if (!handle) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveColumnByOffset(handle.dataset.columnId, -1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveColumnByOffset(handle.dataset.columnId, 1);
    }
  }

  function moveColumnByOffset(columnId, offset) {
    const index = state.columns.findIndex(column => column.id === columnId);
    if (index < 1) return;
    const targetIndex = Math.max(1, Math.min(state.columns.length - 1, index + offset));
    if (targetIndex === index) return;

    const [column] = state.columns.splice(index, 1);
    state.columns.splice(targetIndex, 0, column);
    commit();
    showToast(`Moved “${column.title}” ${offset < 0 ? "left" : "right"}.`, "success");
    requestAnimationFrame(() => {
      els.board.querySelector(`.column-drag-handle[data-column-id="${cssEscape(columnId)}"]`)?.focus();
    });
  }

  function reorderColumn(sourceColumnId, targetColumnId, position = "before") {
    const sourceIndex = state.columns.findIndex(column => column.id === sourceColumnId);
    if (sourceIndex < 1) return false;
    if (sourceColumnId === targetColumnId) return false;

    const [column] = state.columns.splice(sourceIndex, 1);
    let targetIndex = state.columns.findIndex(item => item.id === targetColumnId);
    if (targetIndex < 0) {
      state.columns.splice(sourceIndex, 0, column);
      return false;
    }

    let insertIndex;
    if (targetColumnId === "unassigned") {
      insertIndex = 1;
    } else {
      insertIndex = targetIndex + (position === "after" ? 1 : 0);
      insertIndex = Math.max(1, Math.min(state.columns.length, insertIndex));
    }

    state.columns.splice(insertIndex, 0, column);
    commit();
    showToast(`Moved “${column.title}”.`, "success");
    return true;
  }

  function openBulkLabelDialog(columnId) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column) return;

    const count = state.expenses.filter(expense => expense.columnId === columnId && normalizeLabel(expense.label) === "none").length;
    if (!count) {
      showToast(`“${column.title}” has no unlabelled expenses.`, "success");
      return;
    }

    els.bulkLabelColumnId.value = columnId;
    els.bulkLabelDescription.textContent = `Choose a label for all ${count} currently unlabelled ${pluralize(count, "expense", "expenses")} in “${column.title}”. Existing labelled expenses will not be changed.`;
    const green = els.bulkLabelForm.querySelector('input[name="bulkTicketLabel"][value="green"]');
    if (green) green.checked = true;
    openDialog(els.bulkLabelDialog);
  }

  function applyBulkLabelFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }

    const columnId = els.bulkLabelColumnId.value;
    const label = els.bulkLabelForm.querySelector('input[name="bulkTicketLabel"]:checked')?.value;
    if (!state.columns.some(column => column.id === columnId) || !LABELS.includes(label) || label === "none") {
      showToast("Could not apply the label.", "error");
      return;
    }

    let changed = 0;
    state.expenses.forEach(expense => {
      if (expense.columnId === columnId && normalizeLabel(expense.label) === "none") {
        expense.label = label;
        changed += 1;
      }
    });

    if (!changed) {
      els.bulkLabelDialog.close();
      showToast("There are no unlabelled expenses left in this column.", "success");
      return;
    }

    commit();
    els.bulkLabelDialog.close();
    showToast(`Applied the ${label} label to ${changed} ${pluralize(changed, "expense", "expenses")}.`, "success");
  }

  function getColumnPlans(columnId) {
    return state.plannedExpenses
      .filter(plan => plan.columnId === columnId)
      .sort((a, b) => {
        const byMatch = Number(isPlanMatched(a)) - Number(isPlanMatched(b));
        if (byMatch !== 0) return byMatch;
        return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
      });
  }

  function openPlannedDialog(columnId) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column) return;
    els.plannedColumnId.value = column.id;
    els.plannedDialogTitle.textContent = `Planned expenses · ${column.title}`;
    renderPlannedDialogContent();
    openDialog(els.plannedDialog);
  }

  function renderPlannedDialogContent() {
    const columnId = els.plannedColumnId.value;
    const column = state.columns.find(item => item.id === columnId);
    if (!column) return;
    const plans = getColumnPlans(columnId);
    const matched = plans.filter(isPlanMatched).length;
    const unmatched = plans.length - matched;
    const closed = plans.filter(plan => plan.closed === true).length;
    const open = plans.length - closed;
    const linkedActuals = plans.reduce((total, plan) => total + getMatchedExpenseIds(plan).length, 0);
    const matchRate = plans.length ? matched / plans.length * 100 : 0;

    els.plannedOverview.innerHTML = `
      <span><strong>${plans.length}</strong> total</span>
      <span class="planned-overview-unmatched"><strong>${unmatched}</strong> unmatched</span>
      <span><strong>${matched}</strong> matched</span>
      <span><strong>${open}</strong> open</span>
      <span><strong>${closed}</strong> closed</span>
      <span><strong>${linkedActuals}</strong> linked tickets</span>
      <span><strong>${formatPercent(matchRate)}%</strong> match rate</span>
    `;

    els.plannedList.innerHTML = plans.length
      ? plans.map(renderPlannedCard).join("")
      : `<div class="summary-empty planned-empty"><strong>No planned expenses in this column.</strong><br>Add an expected future cost without affecting any budget calculations.</div>`;
  }

  function openAllPlannedDialog() {
    renderAllPlannedContent();
    openDialog(els.allPlannedDialog);
  }

  function renderAllPlannedContent() {
    const plans = [...state.plannedExpenses].sort((a, b) => {
      const openCompare = Number(a.closed === true) - Number(b.closed === true);
      if (openCompare) return openCompare;
      const columnCompare = state.columns.findIndex(column => column.id === a.columnId) - state.columns.findIndex(column => column.id === b.columnId);
      if (columnCompare) return columnCompare;
      return String(a.description).localeCompare(String(b.description));
    });
    const openCount = plans.filter(plan => plan.closed !== true).length;
    const closedCount = plans.length - openCount;
    const matchedCount = plans.filter(isPlanMatched).length;
    const linkedActualCount = plans.reduce((sum, plan) => sum + getMatchedExpenseIds(plan).length, 0);
    const currencyTotals = buildAllPlannedCurrencyTotals(plans);

    const overview = [
      { label: "Planned", value: plans.length, note: `${openCount} open · ${closedCount} closed` },
      { label: "Matched plans", value: matchedCount, note: `${plans.length ? formatPercent(matchedCount / plans.length * 100) : "0"}% of plans` },
      { label: "Linked actuals", value: linkedActualCount, note: `${Math.max(state.expenses.length - linkedActualCount, 0)} actuals not linked` },
      { label: "Columns", value: new Set(plans.map(plan => plan.columnId)).size, note: `${state.columns.length} board columns` }
    ].map(item => `
      <article class="stat-card">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(String(item.value))}</strong>
        <small>${escapeHtml(item.note)}</small>
      </article>
    `).join("");

    const currencyMarkup = currencyTotals.length ? `
      <section class="summary-panel all-planned-totals-panel">
        <div class="summary-panel-heading"><div><h3>Overall planned sums</h3><p>Expected, matched actual, and still remaining amounts are kept separate by currency.</p></div></div>
        <div class="table-scroll"><table class="stats-table"><thead><tr><th>Currency</th><th class="numeric">Expected</th><th class="numeric">Matched actual</th><th class="numeric">Open remaining</th><th class="numeric">Plans</th></tr></thead><tbody>
          ${currencyTotals.map(item => `<tr><td><strong>${escapeHtml(item.currency)}</strong></td><td class="numeric">${formatMoney(item.expected)}</td><td class="numeric">${formatMoney(item.actual)}</td><td class="numeric">${formatMoney(item.remaining)}</td><td class="numeric">${item.planCount}</td></tr>`).join("")}
        </tbody></table></div>
      </section>
    ` : "";

    els.allPlannedContent.innerHTML = `
      <div class="stats-grid">${overview}</div>
      ${currencyMarkup}
      <section class="all-planned-list-section">
        <div class="all-planned-section-heading"><div><h3>Planned expense list</h3><p>Edit a plan, change its matches, or close/reopen it directly here.</p></div></div>
        <div class="all-planned-list">
          ${plans.length ? plans.map(renderAllPlannedRow).join("") : `<div class="summary-empty"><strong>No planned expenses yet.</strong><br>Add one from a column header.</div>`}
        </div>
      </section>
    `;
  }

  function buildAllPlannedCurrencyTotals(plans) {
    const totals = new Map();
    plans.forEach(plan => {
      const actuals = getMatchedExpenses(plan);
      getPlannedPrices(plan).forEach(price => {
        const current = totals.get(price.currency) || { currency: price.currency, expected: 0, actual: 0, remaining: 0, planIds: new Set() };
        const actualAmount = getCombinedActualAmountForCurrency(actuals, price.currency);
        current.expected += price.amount;
        current.actual += isFiniteNumber(actualAmount) ? actualAmount : 0;
        if (plan.closed !== true) current.remaining += Math.max(price.amount - (isFiniteNumber(actualAmount) ? actualAmount : 0), 0);
        current.planIds.add(plan.id);
        totals.set(price.currency, current);
      });
    });
    return [...totals.values()].map(item => ({
      currency: item.currency,
      expected: item.expected,
      actual: item.actual,
      remaining: item.remaining,
      planCount: item.planIds.size
    })).sort((a, b) => a.currency.localeCompare(b.currency));
  }

  function renderAllPlannedRow(plan) {
    const column = state.columns.find(item => item.id === plan.columnId) || state.columns[0];
    const actuals = getMatchedExpenses(plan);
    const linkedCount = actuals.length;
    const prices = [
      isFiniteNumber(plan.amount1) ? { name: "Price 1", amount: plan.amount1, currency: normalizeCurrency(plan.currency1) || "—" } : null,
      isFiniteNumber(plan.amount2) ? { name: "Price 2", amount: plan.amount2, currency: normalizeCurrency(plan.currency2) || "—" } : null
    ].filter(Boolean);
    const priceCards = prices.map(price => {
      const actualAmount = getCombinedActualAmountForCurrency(actuals, price.currency);
      const matchedAmount = isFiniteNumber(actualAmount) ? actualAmount : 0;
      const percentage = price.amount > 0 ? matchedAmount / price.amount * 100 : (matchedAmount > 0 ? 100 : 0);
      const remaining = plan.closed === true ? 0 : Math.max(price.amount - matchedAmount, 0);
      return `
        <div class="all-planned-price">
          <div class="all-planned-price-heading"><strong>${escapeHtml(price.name)} · ${escapeHtml(price.currency)}</strong><span>${formatPercent(percentage)}% matched</span></div>
          <div class="all-planned-price-values"><span>Planned <strong>${formatMoney(price.amount)}</strong></span><span>Actual <strong>${formatMoney(matchedAmount)}</strong></span><span>Remaining <strong>${formatMoney(remaining)}</strong></span></div>
          <div class="all-planned-progress"><span style="width:${Math.min(Math.max(percentage, 0), 100)}%"></span></div>
        </div>
      `;
    }).join("");
    const primaryCurrency = normalizeCurrency(plan.currency1) || "—";
    const primaryActual = getCombinedActualAmountForCurrency(actuals, primaryCurrency) || 0;
    const primaryPercentage = isFiniteNumber(plan.amount1) && plan.amount1 > 0 ? primaryActual / plan.amount1 * 100 : 0;

    return `
      <article class="all-planned-row ${plan.closed ? "is-closed" : "is-open"}" data-planned-id="${escapeHtml(plan.id)}" style="--planned-column-color:${escapeHtml(column?.color || "#64748b")}">
        <div class="all-planned-row-heading">
          <div class="all-planned-row-title">
            <span class="all-planned-column"><span class="summary-column-dot" style="--summary-column-color:${escapeHtml(column?.color || "#64748b")}"></span>${escapeHtml(column?.title || "Unassigned")}</span>
            <h3>${escapeHtml(plan.description)}</h3>
            <span class="all-planned-row-meta">${linkedCount} linked actual ${pluralize(linkedCount, "expense", "expenses")} · ${formatPercent(primaryPercentage)}% of price 1 matched · ${plan.closed ? "Closed" : "Open"}</span>
          </div>
          <div class="all-planned-row-actions">
            <label class="planned-card-closed-check" title="Closed plans are excluded from remaining planned totals">
              <input type="checkbox" data-all-planned-action="toggle-closed" data-planned-id="${escapeHtml(plan.id)}" ${plan.closed ? "checked" : ""}>
              <span>Closed</span>
            </label>
            <button class="btn btn-compact" type="button" data-all-planned-action="edit" data-planned-id="${escapeHtml(plan.id)}">Edit</button>
            <button class="btn btn-compact ${linkedCount ? "" : "btn-primary"}" type="button" data-all-planned-action="match" data-planned-id="${escapeHtml(plan.id)}">${linkedCount ? "Edit matches" : "Match actuals"}</button>
            <button class="icon-btn danger" type="button" data-all-planned-action="delete" data-planned-id="${escapeHtml(plan.id)}" title="Delete planned expense">×</button>
          </div>
        </div>
        <div class="all-planned-price-grid">${priceCards}</div>
      </article>
    `;
  }

  function handleAllPlannedClick(event) {
    const button = event.target.closest("[data-all-planned-action]");
    if (!button) return;
    const planId = button.dataset.plannedId;
    const action = button.dataset.allPlannedAction;
    const plan = state.plannedExpenses.find(item => item.id === planId);
    if (!plan) return;

    if (action === "edit") {
      openPlannedEditDialog(plan.id, plan.columnId, { returnToAllList: true });
    }
    if (action === "match") {
      openPlannedMatchDialog(plan.id, { returnToAllList: true });
    }
    if (action === "delete") {
      deletePlannedExpense(plan.id);
    }
  }

  function handleAllPlannedChange(event) {
    const input = event.target.closest('input[data-all-planned-action="toggle-closed"]');
    if (!input) return;
    setPlannedClosed(input.dataset.plannedId, input.checked);
  }

  function renderPlannedCard(plan) {
    const actuals = getMatchedExpenses(plan);
    const matched = actuals.length > 0;
    const prices = getPlannedPrices(plan);
    const expectedMarkup = prices.map(price => `<span>${formatMoney(price.amount)} ${escapeHtml(price.currency)}</span>`).join("");
    const comparisons = matched ? renderPlanComparisons(plan, actuals) : "";
    const actualMarkup = actuals.map(actual => `
      <button class="planned-actual-item" type="button" data-planned-action="open-actual" data-expense-id="${escapeHtml(actual.id)}" title="Open this actual expense">
        <strong>${escapeHtml(actual.description)}</strong>
        <small>${escapeHtml(actual.date || "No date")} · ${formatMoney(actual.amount)} ${escapeHtml(actual.currency || "")}</small>
      </button>
    `).join("");

    return `
      <article class="planned-card ${matched ? "is-matched" : "is-unmatched"} ${plan.closed ? "is-closed" : "is-open"}" data-planned-id="${escapeHtml(plan.id)}">
        <div class="planned-card-heading">
          <div class="planned-card-title-wrap">
            <div class="planned-status-row">
              <span class="planned-status ${matched ? "matched" : "unmatched"}">${matched ? `Matched · ${actuals.length}` : "Unmatched"}</span>
              <span class="planned-status ${plan.closed ? "closed" : "open"}">${plan.closed ? "Closed" : "Open"}</span>
            </div>
            <h3>${escapeHtml(plan.description)}</h3>
          </div>
          <div class="planned-card-actions">
            <label class="planned-card-closed-check" title="Closed plans are excluded from the remaining planned total">
              <input type="checkbox" data-planned-action="toggle-closed" data-planned-id="${escapeHtml(plan.id)}" ${plan.closed ? "checked" : ""}>
              <span>Closed</span>
            </label>
            <button class="btn btn-compact" type="button" data-planned-action="edit" data-planned-id="${escapeHtml(plan.id)}">Edit</button>
            <button class="btn btn-compact ${matched ? "" : "btn-primary"}" type="button" data-planned-action="match" data-planned-id="${escapeHtml(plan.id)}">${matched ? "Edit matches" : "Match actuals"}</button>
            <button class="icon-btn danger" type="button" data-planned-action="delete" data-planned-id="${escapeHtml(plan.id)}" title="Delete planned expense">×</button>
          </div>
        </div>
        <div class="planned-expected"><span>Expected</span><div>${expectedMarkup}</div></div>
        ${matched ? `
          <div class="planned-actual-group">
            <span class="planned-actual-group-label">Actual expenses (${actuals.length})</span>
            <div class="planned-actual-list">${actualMarkup}</div>
          </div>
          <div class="planned-comparisons">${comparisons}</div>
        ` : `<div class="planned-awaiting">Waiting for one or more actual expenses to be matched.</div>`}
      </article>
    `;
  }

  function handlePlannedListClick(event) {
    const button = event.target.closest("[data-planned-action]");
    if (!button) return;
    const planId = button.dataset.plannedId;
    const action = button.dataset.plannedAction;
    if (action === "open-actual") {
      const expenseId = button.dataset.expenseId;
      if (!state.expenses.some(expense => expense.id === expenseId)) return;
      navigateToExpense(expenseId, { closeDialog: els.plannedDialog, openEditor: true });
      return;
    }
    if (action === "edit") openPlannedEditDialog(planId);
    if (action === "match") openPlannedMatchDialog(planId);
    if (action === "delete") deletePlannedExpense(planId);
  }

  function handlePlannedListChange(event) {
    const input = event.target.closest('input[data-planned-action="toggle-closed"]');
    if (!input) return;
    setPlannedClosed(input.dataset.plannedId, input.checked);
  }

  function setPlannedClosed(planId, requestedClosed) {
    const plan = state.plannedExpenses.find(item => item.id === planId);
    if (!plan) return;

    plan.closed = Boolean(requestedClosed);
    const automaticallyClosed = syncPlanClosedState(plan);
    plan.updatedAt = new Date().toISOString();
    persistState();
    renderBoard();
    if (els.plannedDialog.open) renderPlannedDialogContent();
    if (els.allPlannedDialog.open) renderAllPlannedContent();

    if (automaticallyClosed && !requestedClosed) {
      showToast("This plan remains closed because matched actual expenses have reached price 1.", "success");
    } else {
      showToast(plan.closed ? "Planned expense closed." : "Planned expense reopened.", "success");
    }
  }

  function openMatchedPlannedFromExpense(expenseId) {
    const expense = state.expenses.find(item => item.id === expenseId);
    if (!expense) return;

    const existingPlan = state.plannedExpenses.find(plan => planHasExpense(plan, expense.id));
    if (existingPlan) {
      openPlannedEditDialog(existingPlan.id, expense.columnId, { returnToList: false });
      return;
    }

    openPlannedEditDialog(null, expense.columnId, {
      sourceExpenseId: expense.id,
      returnToList: false
    });
  }

  function openPlannedEditDialog(planId = null, defaultColumnId = "unassigned", options = {}) {
    const plan = planId ? state.plannedExpenses.find(item => item.id === planId) : null;
    const sourceExpense = options.sourceExpenseId
      ? state.expenses.find(item => item.id === options.sourceExpenseId)
      : null;
    const columnId = plan?.columnId || sourceExpense?.columnId || defaultColumnId;
    if (!state.columns.some(column => column.id === columnId)) return;

    const sourcePrimaryCurrency = normalizeCurrency(sourceExpense?.currency) || "UAH";
    const sourceInitialCurrency = normalizeCurrency(sourceExpense?.initialCurrency);
    const hasDistinctInitialPrice = Boolean(
      sourceExpense &&
      isFiniteNumber(sourceExpense.initialAmount) &&
      sourceInitialCurrency &&
      sourceInitialCurrency !== sourcePrimaryCurrency
    );

    els.plannedEditTitle.textContent = plan
      ? "Edit planned expense"
      : sourceExpense
        ? "Create matched planned expense"
        : "Add planned expense";
    els.plannedId.value = plan?.id || "";
    els.plannedEditColumnId.value = columnId;
    els.plannedSourceExpenseId.value = sourceExpense?.id || "";
    els.plannedDescription.value = plan?.description || "";
    els.plannedDescription.placeholder = sourceExpense
      ? "Enter a reusable title for this planned expense"
      : "For example, annual insurance renewal";
    els.plannedTitleHelp.textContent = sourceExpense
      ? "The title is intentionally left blank. Enter the name you want to use for this planned expense."
      : "Enter a title that will help you recognise this expected expense later.";
    els.plannedAmount1.value = sourceExpense
      ? toEditableNumber(sourceExpense.amount)
      : isFiniteNumber(plan?.amount1) ? toEditableNumber(plan.amount1) : "";
    els.plannedCurrency1.value = sourceExpense
      ? sourcePrimaryCurrency
      : plan?.currency1 || inferGoalCurrency(columnId) || "UAH";
    els.plannedAmount2.value = sourceExpense
      ? hasDistinctInitialPrice ? toEditableNumber(sourceExpense.initialAmount) : ""
      : isFiniteNumber(plan?.amount2) ? toEditableNumber(plan.amount2) : "";
    els.plannedCurrency2.value = sourceExpense
      ? hasDistinctInitialPrice ? sourceInitialCurrency : (sourcePrimaryCurrency === "EUR" ? "UAH" : "EUR")
      : plan?.currency2 || (els.plannedCurrency1.value === "EUR" ? "UAH" : "EUR");
    els.plannedClosed.checked = plan?.closed === true;

    if (sourceExpense) {
      const initialText = isFiniteNumber(sourceExpense.initialAmount) && sourceInitialCurrency
        ? `${formatMoney(sourceExpense.initialAmount)} ${escapeHtml(sourceInitialCurrency)}`
        : "not available";
      const sameCurrencyNote = isFiniteNumber(sourceExpense.initialAmount) && sourceInitialCurrency === sourcePrimaryCurrency
        ? `<small>The initial transaction uses the same currency, so it is not duplicated as a second planned price.</small>`
        : "";
      els.plannedSourceInfo.innerHTML = `
        <strong>Matched automatically to this actual expense</strong>
        <span>${escapeHtml(sourceExpense.description)}</span>
        <span>Transaction: ${formatMoney(sourceExpense.amount)} ${escapeHtml(sourcePrimaryCurrency)} · Initial: ${initialText}</span>
        ${sameCurrencyNote}
      `;
      els.plannedSourceInfo.hidden = false;
    } else {
      els.plannedSourceInfo.innerHTML = "";
      els.plannedSourceInfo.hidden = true;
    }

    clearInvalidFields(els.plannedForm);

    const shouldReturnToAll = options.returnToAllList === true || els.allPlannedDialog.open;
    if (els.plannedDialog.open) els.plannedDialog.close();
    if (els.allPlannedDialog.open) els.allPlannedDialog.close();
    returnToAllPlanned = shouldReturnToAll;
    returnToPlannedColumnId = shouldReturnToAll || options.returnToList === false ? null : columnId;
    openDialog(els.plannedEditDialog);
    setTimeout(() => els.plannedDescription.focus(), 0);
  }

  function savePlannedFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    clearInvalidFields(els.plannedForm);

    const description = els.plannedDescription.value.trim();
    const amount1 = parseMoney(els.plannedAmount1.value);
    const amount2 = parseOptionalMoney(els.plannedAmount2.value);
    let valid = true;

    if (!description) {
      els.plannedDescription.classList.add("invalid");
      valid = false;
    }
    if (!isFiniteNumber(amount1) || amount1 < 0) {
      els.plannedAmount1.classList.add("invalid");
      valid = false;
    }
    if (amount2 !== null && (!isFiniteNumber(amount2) || amount2 < 0)) {
      els.plannedAmount2.classList.add("invalid");
      valid = false;
    }
    if (!valid) {
      showToast("Enter a title and at least one valid approximate price.", "error");
      return;
    }

    const id = els.plannedId.value;
    const existing = id ? state.plannedExpenses.find(item => item.id === id) : null;
    const sourceExpenseId = els.plannedSourceExpenseId.value;
    const sourceExpense = sourceExpenseId ? state.expenses.find(item => item.id === sourceExpenseId) : null;

    if (sourceExpenseId && !sourceExpense) {
      showToast("The source expense no longer exists. Close the dialog and try again.", "error");
      return;
    }

    if (!existing && sourceExpense) {
      const alreadyMatchedPlan = state.plannedExpenses.find(item => planHasExpense(item, sourceExpense.id));
      if (alreadyMatchedPlan) {
        showToast("This actual expense already has a matched planned expense.", "error");
        return;
      }
    }

    const now = new Date().toISOString();
    const selectedColumnId = state.columns.some(column => column.id === els.plannedEditColumnId.value)
      ? els.plannedEditColumnId.value
      : "unassigned";
    const plan = {
      id: existing?.id || uid(),
      columnId: sourceExpense?.columnId || selectedColumnId,
      description,
      amount1: Math.abs(amount1),
      currency1: normalizeCurrency(els.plannedCurrency1.value) || "UAH",
      amount2: isFiniteNumber(amount2) ? Math.abs(amount2) : null,
      currency2: isFiniteNumber(amount2) ? (normalizeCurrency(els.plannedCurrency2.value) || "EUR") : "",
      matchedExpenseIds: existing ? getMatchedExpenseIds(existing) : (sourceExpense ? [sourceExpense.id] : []),
      closed: els.plannedClosed.checked,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    if (existing) {
      Object.assign(existing, plan);
      delete existing.matchedExpenseId;
    } else {
      state.plannedExpenses.push(plan);
    }

    syncPlanClosedState(existing || plan);
    persistState();
    renderBoard();
    const message = existing
      ? "Planned expense updated."
      : sourceExpense
        ? "Matched planned expense created from the actual ticket."
        : "Planned expense added.";
    showToast(message, "success");
    els.plannedEditDialog.close();
  }

  function deletePlannedExpense(planId) {
    const plan = state.plannedExpenses.find(item => item.id === planId);
    if (!plan) return;
    if (!window.confirm(`Delete planned expense “${plan.description}”?`)) return;
    state.plannedExpenses = state.plannedExpenses.filter(item => item.id !== planId);
    commit();
    if (els.plannedDialog.open) renderPlannedDialogContent();
    if (els.allPlannedDialog.open) renderAllPlannedContent();
    showToast("Planned expense deleted.", "success");
  }

  function openPlannedMatchDialog(planId, options = {}) {
    const plan = state.plannedExpenses.find(item => item.id === planId);
    if (!plan) return;
    const column = state.columns.find(item => item.id === plan.columnId);
    if (!column) return;

    const currentIds = new Set(getMatchedExpenseIds(plan));
    const usedByOthers = new Set(state.plannedExpenses
      .filter(item => item.id !== plan.id)
      .flatMap(item => getMatchedExpenseIds(item)));
    const candidates = state.expenses
      .filter(expense => expense.columnId === plan.columnId && (!usedByOthers.has(expense.id) || currentIds.has(expense.id)))
      .sort((a, b) => parseDateForSort(b.date) - parseDateForSort(a.date));

    els.plannedMatchId.value = plan.id;
    els.plannedMatchTitle.textContent = `Match actual expenses · ${plan.description}`;
    els.plannedMatchExpense.innerHTML = candidates.length
      ? candidates.map(expense => `<option value="${escapeHtml(expense.id)}" ${currentIds.has(expense.id) ? "selected" : ""}>${escapeHtml(formatExpenseOption(expense))}</option>`).join("")
      : `<option value="">No available actual expenses in this column</option>`;
    els.plannedMatchExpense.disabled = !candidates.length;
    els.unmatchPlannedBtn.disabled = !currentIds.size;
    updatePlannedMatchPreview();

    const shouldReturnToAll = options.returnToAllList === true || els.allPlannedDialog.open;
    if (els.plannedDialog.open) els.plannedDialog.close();
    if (els.allPlannedDialog.open) els.allPlannedDialog.close();
    returnToAllPlanned = shouldReturnToAll;
    returnToPlannedColumnId = shouldReturnToAll ? null : plan.columnId;
    openDialog(els.plannedMatchDialog);
  }

  function formatExpenseOption(expense) {
    return `${expense.date || "No date"} · ${formatMoney(expense.amount)} ${expense.currency || ""} · ${expense.description}`;
  }

  function getSelectedPlannedMatchIds() {
    return [...els.plannedMatchExpense.selectedOptions]
      .map(option => option.value)
      .filter(Boolean);
  }

  function updatePlannedMatchPreview() {
    const plan = state.plannedExpenses.find(item => item.id === els.plannedMatchId.value);
    const selectedIds = new Set(getSelectedPlannedMatchIds());
    const actuals = state.expenses.filter(item => selectedIds.has(item.id));
    if (!plan || !actuals.length) {
      els.plannedMatchPreview.innerHTML = `<div class="summary-empty">Select one or more actual expenses from this column.</div>`;
      return;
    }
    const selectedMarkup = actuals.map(actual => `
      <div class="planned-match-selected">
        <strong>${escapeHtml(actual.description)}</strong>
        <span>${escapeHtml(actual.date || "No date")} · ${formatMoney(actual.amount)} ${escapeHtml(actual.currency || "")}</span>
      </div>
    `).join("");
    els.plannedMatchPreview.innerHTML = `
      <div class="planned-match-selected-list">${selectedMarkup}</div>
      <div class="planned-comparisons">${renderPlanComparisons(plan, actuals)}</div>
    `;
  }

  function savePlannedMatchFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    const plan = state.plannedExpenses.find(item => item.id === els.plannedMatchId.value);
    const selectedIds = getSelectedPlannedMatchIds();
    const actuals = state.expenses.filter(item => selectedIds.includes(item.id));
    if (!plan || !selectedIds.length || actuals.length !== selectedIds.length || actuals.some(actual => actual.columnId !== plan.columnId)) {
      showToast("Choose at least one valid actual expense from this column.", "error");
      return;
    }
    const used = state.plannedExpenses.find(item => item.id !== plan.id && selectedIds.some(id => planHasExpense(item, id)));
    if (used) {
      showToast("One of the selected expenses is already matched to another planned expense.", "error");
      return;
    }
    setMatchedExpenseIds(plan, selectedIds);
    plan.updatedAt = new Date().toISOString();
    persistState();
    renderBoard();
    showToast(`Planned expense matched to ${selectedIds.length} actual ${pluralize(selectedIds.length, "transaction", "transactions")}.`, "success");
    els.plannedMatchDialog.close();
  }

  function unmatchCurrentPlanned() {
    const plan = state.plannedExpenses.find(item => item.id === els.plannedMatchId.value);
    if (!plan || !isPlanMatched(plan)) return;
    setMatchedExpenseIds(plan, []);
    plan.updatedAt = new Date().toISOString();
    persistState();
    renderBoard();
    showToast("All matches removed. The planned expense is unmatched again.", "success");
    els.plannedMatchDialog.close();
  }

  function getPlannedPrices(plan) {
    const prices = new Map();
    if (isFiniteNumber(plan?.amount1)) {
      const currency = normalizeCurrency(plan.currency1) || "—";
      prices.set(currency, (prices.get(currency) || 0) + plan.amount1);
    }
    if (isFiniteNumber(plan?.amount2)) {
      const currency = normalizeCurrency(plan.currency2) || "—";
      prices.set(currency, (prices.get(currency) || 0) + plan.amount2);
    }
    return [...prices.entries()].map(([currency, amount]) => ({ currency, amount }));
  }

  function getPlanRemainingPrices(plan, actuals = getMatchedExpenses(plan)) {
    if (plan?.closed === true) return [];
    return getPlannedPrices(plan)
      .map(price => {
        const actualAmount = getCombinedActualAmountForCurrency(actuals, price.currency);
        const remaining = Math.max(price.amount - (isFiniteNumber(actualAmount) ? actualAmount : 0), 0);
        return { currency: price.currency, amount: remaining };
      })
      .filter(item => item.amount > 0);
  }

  function getColumnRemainingPlannedSums(columnId) {
    const totals = new Map();
    state.plannedExpenses
      .filter(plan => plan.columnId === columnId && plan.closed !== true)
      .forEach(plan => {
        getPlanRemainingPrices(plan).forEach(price => {
          totals.set(price.currency, (totals.get(price.currency) || 0) + price.amount);
        });
      });
    return [...totals.entries()]
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
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

  function getMatchedExpenses(plan) {
    const ids = new Set(getMatchedExpenseIds(plan));
    return state.expenses.filter(expense => ids.has(expense.id));
  }

  function setMatchedExpenseIds(plan, expenseIds) {
    plan.matchedExpenseIds = [...new Set(expenseIds.filter(id => typeof id === "string" && id))];
    delete plan.matchedExpenseId;
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

    // Each actual expense contributes at most one value to a planned currency.
    // The plain transaction is preferred when plain and initial use the same currency.
    if (plainCurrency === normalized && isFiniteNumber(expense?.amount)) return expense.amount;
    if (initialCurrency === normalized && isFiniteNumber(expense?.initialAmount)) return expense.initialAmount;
    return null;
  }

  function isPlanPrimaryCovered(plan, actuals = getMatchedExpenses(plan)) {
    if (!isFiniteNumber(plan?.amount1)) return false;
    const primaryCurrency = normalizeCurrency(plan.currency1) || "—";
    const actualAmount = getCombinedActualAmountForCurrency(actuals, primaryCurrency);
    return isFiniteNumber(actualAmount) && actualAmount >= plan.amount1;
  }

  function syncPlanClosedState(plan, actuals = getMatchedExpenses(plan)) {
    if (!plan) return false;
    if (typeof plan.closed !== "boolean") plan.closed = false;
    if (!plan.closed && isPlanPrimaryCovered(plan, actuals)) {
      plan.closed = true;
      return true;
    }
    return false;
  }

  function syncAllPlanClosedStates() {
    if (!state || !Array.isArray(state.plannedExpenses)) return;
    state.plannedExpenses.forEach(plan => syncPlanClosedState(plan));
  }

  function renderPlanComparisons(plan, actuals) {
    const matchedActuals = Array.isArray(actuals) ? actuals : (actuals ? [actuals] : []);
    return getPlannedPrices(plan).map(price => {
      const actualAmount = getCombinedActualAmountForCurrency(matchedActuals, price.currency);
      if (!isFiniteNumber(actualAmount)) {
        return `<div class="planned-comparison unavailable"><span>${escapeHtml(price.currency)}</span><strong>Expected ${formatMoney(price.amount)}</strong><small>No actual value in this currency</small></div>`;
      }
      const difference = actualAmount - price.amount;
      const percentage = price.amount ? difference / price.amount * 100 : 0;
      const status = difference > 0 ? "over" : difference < 0 ? "under" : "exact";
      const sign = difference > 0 ? "+" : "";
      const percentSign = percentage > 0 ? "+" : "";
      return `<div class="planned-comparison ${status}"><span>${escapeHtml(price.currency)}</span><strong>${formatMoney(actualAmount)} of ${formatMoney(price.amount)}</strong><small>${sign}${formatMoney(difference)} · ${percentSign}${formatPercent(percentage)}%</small></div>`;
    }).join("");
  }

  function clearPlanMatchForExpense(expenseId) {
    state.plannedExpenses.forEach(plan => {
      if (!planHasExpense(plan, expenseId)) return;
      setMatchedExpenseIds(plan, getMatchedExpenseIds(plan).filter(id => id !== expenseId));
      reconcilePlanClosedAfterDeletion(plan);
      plan.updatedAt = new Date().toISOString();
    });
  }

  function reconcilePlanClosedAfterDeletion(plan) {
    if (!plan) return;
    plan.closed = isPlanPrimaryCovered(plan, getMatchedExpenses(plan));
  }

  function getMatchedPlanForExpense(expenseId) {
    return state.plannedExpenses.find(plan => planHasExpense(plan, expenseId)) || null;
  }

  function confirmAndUnmatchExpenseForColumnMove(expense, targetColumnId) {
    if (!expense || expense.columnId === targetColumnId) return true;
    const plan = getMatchedPlanForExpense(expense.id);
    if (!plan) return true;

    const targetColumn = state.columns.find(column => column.id === targetColumnId);
    const confirmed = window.confirm(
      `“${expense.description}” is matched to planned expense “${plan.description}”. ` +
      `Moving it to “${targetColumn?.title || "another column"}” will unmatch it and recalculate the planned expense. Continue?`
    );
    if (!confirmed) return false;

    clearPlanMatchForExpense(expense.id);
    return true;
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

  function openSplitExpenseDialog(expenseId) {
    const source = state.expenses.find(item => item.id === expenseId);
    if (!source) return;
    if (source.splitFromExpenseId) {
      showToast("Split the original expense instead of an extracted part.", "error");
      return;
    }
    if (!isFiniteNumber(source.amount) || source.amount <= 0.01) {
      showToast("This expense is too small to split.", "error");
      return;
    }

    const hasInitial = isFiniteNumber(source.initialAmount) && source.initialAmount > 0;
    els.splitSourceExpenseId.value = source.id;
    els.splitDescription.value = "";
    els.splitPlainAmount.value = "";
    els.splitInitialAmount.value = "";
    els.splitPlainCurrency.textContent = source.currency || "—";
    els.splitInitialCurrency.textContent = hasInitial ? (source.initialCurrency || "—") : "Not available";
    els.splitInitialBasisOption.classList.toggle("is-disabled", !hasInitial);
    const initialRadio = els.splitExpenseForm.querySelector('input[name="splitBasis"][value="initial"]');
    const plainRadio = els.splitExpenseForm.querySelector('input[name="splitBasis"][value="plain"]');
    initialRadio.disabled = !hasInitial;
    plainRadio.checked = true;

    els.splitSourceSummary.innerHTML = `
      <strong>${escapeHtml(source.description)}</strong>
      <span>${formatMoney(source.amount)} ${escapeHtml(source.currency || "")}${hasInitial ? ` · ${formatMoney(source.initialAmount)} ${escapeHtml(source.initialCurrency || "")}` : ""}</span>
      ${isFiniteNumber(source.remainingAmount) ? `<small>Current balance: ${formatMoney(source.remainingAmount)} ${escapeHtml(source.remainingCurrency || source.currency || "")}</small>` : ""}
    `;
    clearInvalidFields(els.splitExpenseForm);
    updateSplitBasis(false);
    openDialog(els.splitExpenseDialog);
    setTimeout(() => els.splitDescription.focus(), 0);
  }

  function updateSplitBasis(focusInput = true) {
    const basis = els.splitExpenseForm.querySelector('input[name="splitBasis"]:checked')?.value || "plain";
    const plainActive = basis === "plain";
    els.splitPlainAmount.readOnly = !plainActive;
    els.splitInitialAmount.readOnly = plainActive;
    els.splitPlainAmount.classList.toggle("calculated-field", !plainActive);
    els.splitInitialAmount.classList.toggle("calculated-field", plainActive);
    els.splitAmountHelp.textContent = plainActive
      ? "Enter the plain transaction amount. The initial amount is calculated proportionally to two decimal places."
      : "Enter the initial transaction amount. The plain amount is calculated proportionally to two decimal places.";
    updateSplitPreview();
    if (focusInput) setTimeout(() => (plainActive ? els.splitPlainAmount : els.splitInitialAmount).focus(), 0);
  }

  function updateSplitPreview() {
    const source = state.expenses.find(item => item.id === els.splitSourceExpenseId.value);
    if (!source) return;
    els.splitPlainAmount.classList.remove("invalid");
    els.splitInitialAmount.classList.remove("invalid");
    const basis = els.splitExpenseForm.querySelector('input[name="splitBasis"]:checked')?.value || "plain";
    const entered = parseMoney(basis === "plain" ? els.splitPlainAmount.value : els.splitInitialAmount.value);
    const calculation = calculateExpenseSplit(source, basis, entered);

    if (!isFiniteNumber(entered) || entered <= 0) {
      if (basis === "plain") els.splitInitialAmount.value = "";
      else els.splitPlainAmount.value = "";
      els.splitPreview.innerHTML = "Enter an amount to preview the split.";
      els.splitPreview.classList.remove("has-error");
      return;
    }

    if (!calculation) {
      if (basis === "plain") els.splitInitialAmount.value = "";
      else els.splitPlainAmount.value = "";
      els.splitPreview.innerHTML = `<strong>Amount cannot be extracted.</strong><span>It must leave a positive plain transaction amount in the original expense.</span>`;
      els.splitPreview.classList.add("has-error");
      return;
    }

    if (basis === "plain") {
      els.splitInitialAmount.value = isFiniteNumber(calculation.extractedInitial) ? toEditableNumber(calculation.extractedInitial) : "";
    } else {
      els.splitPlainAmount.value = toEditableNumber(calculation.extractedPlain);
    }

    const hasInitial = isFiniteNumber(source.initialAmount) && source.initialAmount > 0;
    els.splitPreview.classList.remove("has-error");
    els.splitPreview.innerHTML = `
      <div><span>Extracted expense</span><strong>${formatMoney(calculation.extractedPlain)} ${escapeHtml(source.currency || "")}${hasInitial ? ` · ${formatMoney(calculation.extractedInitial)} ${escapeHtml(source.initialCurrency || "")}` : ""}</strong></div>
      <div><span>Original expense after split</span><strong>${formatMoney(calculation.remainingPlain)} ${escapeHtml(source.currency || "")}${hasInitial ? ` · ${formatMoney(calculation.remainingInitial)} ${escapeHtml(source.initialCurrency || "")}` : ""}</strong></div>
      <div><span>Extracted expense balance</span><strong>${isFiniteNumber(calculation.extractedBalance) ? `${formatMoney(calculation.extractedBalance)} ${escapeHtml(source.currency || "")}` : "Not available"}</strong></div>
    `;
  }

  function saveSplitExpenseFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    clearInvalidFields(els.splitExpenseForm);

    const source = state.expenses.find(item => item.id === els.splitSourceExpenseId.value);
    if (!source || source.splitFromExpenseId) {
      showToast("The source expense is no longer available for splitting.", "error");
      return;
    }

    const description = els.splitDescription.value.trim();
    const basis = els.splitExpenseForm.querySelector('input[name="splitBasis"]:checked')?.value || "plain";
    const entered = parseMoney(basis === "plain" ? els.splitPlainAmount.value : els.splitInitialAmount.value);
    const calculation = calculateExpenseSplit(source, basis, entered);
    let valid = true;

    if (!description) {
      els.splitDescription.classList.add("invalid");
      valid = false;
    }
    if (!calculation) {
      (basis === "plain" ? els.splitPlainAmount : els.splitInitialAmount).classList.add("invalid");
      valid = false;
    }
    if (!valid) {
      showToast("Enter a title and an amount smaller than the source expense.", "error");
      return;
    }

    normalizeOrders(source.columnId);
    const sourceOrder = Number(source.order) || 0;
    state.expenses
      .filter(item => item.columnId === source.columnId && item.id !== source.id && (Number(item.order) || 0) >= sourceOrder)
      .forEach(item => { item.order = (Number(item.order) || 0) + 1; });
    source.order = sourceOrder + 1;

    const extracted = {
      id: uid(),
      columnId: source.columnId,
      order: sourceOrder,
      date: source.date,
      card: source.card,
      description,
      note: source.note,
      originalCategory: source.originalCategory,
      amount: calculation.extractedPlain,
      currency: source.currency,
      initialAmount: isFiniteNumber(source.initialAmount) && source.initialAmount > 0 ? calculation.extractedInitial : null,
      initialCurrency: isFiniteNumber(source.initialAmount) && source.initialAmount > 0 ? source.initialCurrency : "",
      remainingAmount: calculation.extractedBalance,
      remainingCurrency: isFiniteNumber(calculation.extractedBalance) ? source.currency : "",
      label: normalizeLabel(source.label),
      splitFromExpenseId: source.id
    };

    source.amount = calculation.remainingPlain;
    if (isFiniteNumber(source.initialAmount) && source.initialAmount > 0) source.initialAmount = calculation.remainingInitial;
    state.expenses.push(extracted);

    const matchedPlan = state.plannedExpenses.find(plan => planHasExpense(plan, source.id));
    if (matchedPlan) {
      setMatchedExpenseIds(matchedPlan, [...getMatchedExpenseIds(matchedPlan), extracted.id]);
      matchedPlan.updatedAt = new Date().toISOString();
    }

    commit();
    els.splitExpenseDialog.close();
    showToast(`Created “${description}” and reduced the original expense.`, "success");
  }

  function getExtractedChildren(parentId) {
    return state.expenses
      .filter(expense => expense.splitFromExpenseId === parentId)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }

  function getSelectedMergeChildren() {
    const parentId = els.mergeParentExpenseId.value;
    const selectedIds = new Set(
      [...els.mergeChildList.querySelectorAll('input[type="checkbox"]:checked')]
        .map(input => input.value)
    );
    return getExtractedChildren(parentId).filter(child => selectedIds.has(child.id));
  }

  function recalculateExtractedExpenseBalances(parent) {
    if (!parent || parent.splitFromExpenseId || !isFiniteNumber(parent.amount) || !isFiniteNumber(parent.remainingAmount)) {
      return false;
    }

    const plainCurrency = normalizeCurrency(parent.currency) || "";
    const children = getExtractedChildren(parent.id);
    const canRecalculate = Boolean(plainCurrency) && children.every(child =>
      isFiniteNumber(child.amount) && (normalizeCurrency(child.currency) || "") === plainCurrency
    );
    if (!canRecalculate) return false;

    // Extracted expenses are ordered before the remaining parent transaction.
    // Each child's balance must therefore equal the final parent balance plus
    // every transaction amount that still follows that child.
    let amountAfterCurrentChild = roundSplitMoney(parent.amount);
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      child.remainingAmount = roundSplitMoney(parent.remainingAmount + amountAfterCurrentChild);
      child.remainingCurrency = plainCurrency;
      amountAfterCurrentChild = roundSplitMoney(amountAfterCurrentChild + child.amount);
    }
    return true;
  }

  function calculateMergeResult(parent, children) {
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

    // A split changes transaction amounts but preserves the parent's final post-transaction balance.
    // If the parent balance is missing, the latest extracted ticket can restore it because its
    // synthetic balance equals the final balance plus the current parent plain amount.
    let mergedBalance = isFiniteNumber(parent.remainingAmount) ? roundSplitMoney(parent.remainingAmount) : null;
    if (mergedBalance === null) {
      const latestBalancedChild = getExtractedChildren(parent.id)
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

  function getDefaultMergePlanId(parent, children) {
    const parentPlan = getMatchedPlanForExpense(parent.id);
    if (parentPlan) return parentPlan.id;
    const childPlanIds = [...new Set(children
      .map(child => getMatchedPlanForExpense(child.id)?.id)
      .filter(Boolean))];
    return childPlanIds.length === 1 ? childPlanIds[0] : "";
  }

  function openMergeExpenseDialog(parentId) {
    const parent = state.expenses.find(expense => expense.id === parentId);
    const children = getExtractedChildren(parentId);
    if (!parent || parent.splitFromExpenseId) {
      showToast("Only an original expense can receive extracted expenses back.", "error");
      return;
    }
    if (!children.length) {
      showToast("This expense has no extracted expenses to merge.", "error");
      return;
    }

    els.mergeParentExpenseId.value = parent.id;
    els.mergeParentSummary.innerHTML = `
      <strong>${escapeHtml(parent.description)}</strong>
      <span>${formatMoney(parent.amount)} ${escapeHtml(parent.currency || "")}${isFiniteNumber(parent.initialAmount) ? ` · ${formatMoney(parent.initialAmount)} ${escapeHtml(parent.initialCurrency || "")}` : ""}</span>
      <small>Current parent balance: ${isFiniteNumber(parent.remainingAmount) ? `${formatMoney(parent.remainingAmount)} ${escapeHtml(parent.remainingCurrency || parent.currency || "")}` : "Not available"}</small>
    `;

    els.mergeChildList.innerHTML = children.map(child => {
      const plan = getMatchedPlanForExpense(child.id);
      return `
        <label class="merge-child-option">
          <input type="checkbox" value="${escapeHtml(child.id)}" checked>
          <span class="merge-child-main">
            <strong>${escapeHtml(child.description)}</strong>
            <small>${formatMoney(child.amount)} ${escapeHtml(child.currency || "")}${isFiniteNumber(child.initialAmount) ? ` · ${formatMoney(child.initialAmount)} ${escapeHtml(child.initialCurrency || "")}` : ""}</small>
          </span>
          <span class="merge-child-plan">${plan ? escapeHtml(plan.description) : "Not matched"}</span>
        </label>
      `;
    }).join("");

    const plans = state.plannedExpenses.filter(plan => plan.columnId === parent.columnId);
    els.mergePlannedMatch.innerHTML = [
      `<option value="">Not matched</option>`,
      ...plans.map(plan => `<option value="${escapeHtml(plan.id)}">${escapeHtml(plan.description)}</option>`)
    ].join("");
    els.mergePlannedMatch.dataset.userSelected = "false";
    els.mergePlannedMatch.value = getDefaultMergePlanId(parent, children);
    updateMergePreview();
    openDialog(els.mergeExpenseDialog);
  }

  function updateMergePreview() {
    const parent = state.expenses.find(expense => expense.id === els.mergeParentExpenseId.value);
    if (!parent) return;
    const children = getSelectedMergeChildren();
    const result = calculateMergeResult(parent, children);
    els.mergePreview.classList.toggle("has-error", Boolean(result.error));

    if (result.error) {
      els.mergePreview.innerHTML = `<strong>${escapeHtml(result.error)}</strong>`;
      return;
    }

    if (els.mergePlannedMatch.dataset.userSelected !== "true") {
      const suggestedPlanId = getDefaultMergePlanId(parent, children);
      if ([...els.mergePlannedMatch.options].some(option => option.value === suggestedPlanId)) {
        els.mergePlannedMatch.value = suggestedPlanId;
      }
    }
    const targetPlan = state.plannedExpenses.find(plan => plan.id === els.mergePlannedMatch.value);
    const affectedPlanNames = [...new Set([parent, ...children]
      .map(expense => getMatchedPlanForExpense(expense.id)?.description)
      .filter(Boolean))];
    const remainingChildCount = Math.max(getExtractedChildren(parent.id).length - children.length, 0);
    els.mergePreview.innerHTML = `
      <div><span>Selected expenses</span><strong>${children.length}</strong></div>
      <div><span>Parent after merge</span><strong>${formatMoney(result.mergedPlain)} ${escapeHtml(result.plainCurrency)}${isFiniteNumber(result.mergedInitial) ? ` · ${formatMoney(result.mergedInitial)} ${escapeHtml(result.initialCurrency)}` : ""}</strong></div>
      <div><span>Parent balance</span><strong>${isFiniteNumber(result.mergedBalance) ? `${formatMoney(result.mergedBalance)} ${escapeHtml(result.balanceCurrency)}` : "Not available"}</strong></div>
      <div><span>Planned match after merge</span><strong>${targetPlan ? escapeHtml(targetPlan.description) : "Not matched"}</strong></div>
      ${remainingChildCount ? `<small>${remainingChildCount} remaining extracted ${pluralize(remainingChildCount, "expense balance", "expense balances")} will be recalculated to preserve the transaction sequence.</small>` : ""}
      ${affectedPlanNames.length > 1 ? `<small class="merge-warning">Selected tickets currently affect several plans. Those plans will all be recalculated.</small>` : ""}
    `;
  }

  function saveMergeExpenseFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }

    const parent = state.expenses.find(expense => expense.id === els.mergeParentExpenseId.value);
    const children = getSelectedMergeChildren();
    const result = calculateMergeResult(parent, children);
    if (!parent || result.error) {
      updateMergePreview();
      showToast(result.error || "The parent expense is no longer available.", "error");
      return;
    }

    const targetPlan = state.plannedExpenses.find(plan => plan.id === els.mergePlannedMatch.value && plan.columnId === parent.columnId) || null;
    const childIds = new Set(children.map(child => child.id));
    const affectedPlans = new Set();

    state.plannedExpenses.forEach(plan => {
      const currentIds = getMatchedExpenseIds(plan);
      const touchesMerge = currentIds.includes(parent.id) || currentIds.some(id => childIds.has(id));
      if (!touchesMerge) return;
      affectedPlans.add(plan);
      setMatchedExpenseIds(plan, currentIds.filter(id => id !== parent.id && !childIds.has(id)));
    });

    if (targetPlan) {
      setMatchedExpenseIds(targetPlan, [...getMatchedExpenseIds(targetPlan), parent.id]);
      affectedPlans.add(targetPlan);
    }

    parent.amount = result.mergedPlain;
    parent.currency = result.plainCurrency;
    parent.initialAmount = result.mergedInitial;
    parent.initialCurrency = result.initialCurrency;
    parent.remainingAmount = result.mergedBalance;
    parent.remainingCurrency = result.balanceCurrency;

    state.expenses = state.expenses.filter(expense => !childIds.has(expense.id));
    normalizeOrders(parent.columnId);
    recalculateExtractedExpenseBalances(parent);
    affectedPlans.forEach(plan => {
      reconcilePlanClosedAfterDeletion(plan);
      plan.updatedAt = new Date().toISOString();
    });
    commit();
    els.mergeExpenseDialog.close();
    showToast(`Merged ${children.length} extracted ${pluralize(children.length, "expense", "expenses")} back into “${parent.description}”.`, "success");
  }

  function openExpenseDialog(expenseId = null, defaultColumnId = "unassigned") {
    const expense = expenseId ? state.expenses.find(item => item.id === expenseId) : null;
    fillColumnSelect(expense?.columnId || defaultColumnId);
    clearInvalidFields(els.expenseForm);

    els.expenseDialogTitle.textContent = expense ? "Edit Expense" : "Add Expense";
    els.expenseId.value = expense?.id || "";
    els.expenseDate.value = expense?.date || formatDate(new Date());
    els.expenseCard.value = expense?.card || "";
    els.expenseDescription.value = expense?.description || "";
    els.expenseNote.value = expense?.note || "";
    els.expenseOriginalCategory.value = expense?.originalCategory || "";
    els.expenseAmount.value = expense ? toEditableNumber(expense.amount) : "";
    els.expenseCurrency.value = expense?.currency || "UAH";
    els.expenseInitialAmount.value = isFiniteNumber(expense?.initialAmount) ? toEditableNumber(expense.initialAmount) : "";
    els.expenseInitialCurrency.value = expense?.initialCurrency || expense?.currency || "UAH";
    els.expenseRemainingAmount.value = isFiniteNumber(expense?.remainingAmount) ? toEditableNumber(expense.remainingAmount) : "";
    els.expenseRemainingCurrency.value = expense?.remainingCurrency || expense?.currency || "UAH";
    fillExpensePlannedSelect(expense?.columnId || defaultColumnId, expense?.id || "");

    const labelValue = expense?.label || "none";
    const labelInput = els.expenseForm.querySelector(`input[name="ticketLabel"][value="${labelValue}"]`);
    if (labelInput) labelInput.checked = true;

    openDialog(els.expenseDialog);
    setTimeout(() => els.expenseDescription.focus(), 0);
  }

  function saveExpenseFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    clearInvalidFields(els.expenseForm);

    const description = els.expenseDescription.value.trim();
    const amount = parseMoney(els.expenseAmount.value);
    let valid = true;

    if (!description) {
      els.expenseDescription.classList.add("invalid");
      valid = false;
    }
    if (!isFiniteNumber(amount)) {
      els.expenseAmount.classList.add("invalid");
      valid = false;
    }
    if (!valid) {
      showToast("Please fill in the description and a valid transaction amount.", "error");
      return;
    }

    const id = els.expenseId.value;
    const columnId = state.columns.some(column => column.id === els.expenseColumn.value) ? els.expenseColumn.value : "unassigned";
    const label = els.expenseForm.querySelector('input[name="ticketLabel"]:checked')?.value || "none";
    const existing = id ? state.expenses.find(item => item.id === id) : null;
    const previousColumnId = existing?.columnId || null;
    const matchedPlanBeforeMove = existing ? getMatchedPlanForExpense(existing.id) : null;
    const isMovingColumns = Boolean(existing && previousColumnId !== columnId);

    if (isMovingColumns && matchedPlanBeforeMove && !confirmAndUnmatchExpenseForColumnMove(existing, columnId)) {
      return;
    }

    const expense = {
      id: existing?.id || uid(),
      columnId,
      order: existing && existing.columnId === columnId ? existing.order : nextOrder(columnId),
      date: els.expenseDate.value.trim(),
      card: els.expenseCard.value.trim(),
      description,
      note: els.expenseNote.value.trim(),
      originalCategory: els.expenseOriginalCategory.value.trim(),
      amount: Math.abs(amount),
      currency: normalizeCurrency(els.expenseCurrency.value),
      initialAmount: parseOptionalMoney(els.expenseInitialAmount.value),
      initialCurrency: normalizeCurrency(els.expenseInitialCurrency.value),
      remainingAmount: parseOptionalMoney(els.expenseRemainingAmount.value),
      remainingCurrency: normalizeCurrency(els.expenseRemainingCurrency.value),
      label: LABELS.includes(label) ? label : "none"
    };

    if (existing) {
      Object.assign(existing, expense);
      showToast("Expense updated.", "success");
    } else {
      state.expenses.push(expense);
      showToast("Expense added.", "success");
    }

    const requestedPlanId = isMovingColumns && matchedPlanBeforeMove ? "" : els.expensePlannedMatch.value;
    assignExpenseToPlannedExpense(expense.id, requestedPlanId, columnId);
    commit();
    els.expenseDialog.close();
  }

  function fillColumnSelect(selectedId) {
    els.expenseColumn.innerHTML = state.columns.map(column => `<option value="${escapeHtml(column.id)}" ${column.id === selectedId ? "selected" : ""}>${escapeHtml(column.title)}</option>`).join("");
  }

  function fillExpensePlannedSelect(columnId, expenseId = "", preferredPlanId = null) {
    const currentPlan = expenseId ? state.plannedExpenses.find(plan => planHasExpense(plan, expenseId)) : null;
    const selectedPlanId = preferredPlanId === null ? (currentPlan?.id || "") : preferredPlanId;
    const plans = getColumnPlans(columnId);

    if (!plans.length) {
      els.expensePlannedMatch.innerHTML = `<option value="">No planned expenses in this column</option>`;
      els.expensePlannedMatch.value = "";
      els.expensePlannedMatch.disabled = true;
      return;
    }

    els.expensePlannedMatch.disabled = false;
    els.expensePlannedMatch.innerHTML = [
      `<option value="">Not matched</option>`,
      ...plans.map(plan => {
        const prices = getPlannedPrices(plan).map(price => `${formatMoney(price.amount)} ${price.currency}`).join(" · ");
        const linkedCount = getMatchedExpenseIds(plan).length;
        const suffix = [prices, `${linkedCount} linked`].filter(Boolean).join(" · ");
        return `<option value="${escapeHtml(plan.id)}">${escapeHtml(plan.description)}${suffix ? ` — ${escapeHtml(suffix)}` : ""}</option>`;
      })
    ].join("");
    els.expensePlannedMatch.value = plans.some(plan => plan.id === selectedPlanId) ? selectedPlanId : "";
  }

  function assignExpenseToPlannedExpense(expenseId, targetPlanId, columnId) {
    const now = new Date().toISOString();
    state.plannedExpenses.forEach(plan => {
      const ids = getMatchedExpenseIds(plan);
      if (!ids.includes(expenseId) || plan.id === targetPlanId) return;
      setMatchedExpenseIds(plan, ids.filter(id => id !== expenseId));
      reconcilePlanClosedAfterDeletion(plan);
      plan.updatedAt = now;
    });

    if (!targetPlanId) return;
    const targetPlan = state.plannedExpenses.find(plan => plan.id === targetPlanId && plan.columnId === columnId);
    if (!targetPlan) return;
    const ids = getMatchedExpenseIds(targetPlan);
    if (!ids.includes(expenseId)) {
      setMatchedExpenseIds(targetPlan, [...ids, expenseId]);
      syncPlanClosedState(targetPlan);
      targetPlan.updatedAt = now;
    }
  }

  function openColumnDialog(columnId = null) {
    const column = columnId ? state.columns.find(item => item.id === columnId) : null;
    els.columnDialogTitle.textContent = column ? "Edit Column" : "Add Column";
    els.columnId.value = column?.id || "";
    els.columnTitle.value = column?.title || "";
    els.columnColor.value = column?.color || PALETTE[1];
    els.columnColorText.value = column?.color || PALETTE[1];
    els.columnIcon.value = normalizeColumnIcon(column?.icon);
    updateColumnIconPreview();
    clearInvalidFields(els.columnForm);
    openDialog(els.columnDialog);
    setTimeout(() => els.columnTitle.focus(), 0);
  }

  function saveColumnFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    clearInvalidFields(els.columnForm);

    const title = els.columnTitle.value.trim();
    const color = isHexColor(els.columnColorText.value) ? els.columnColorText.value.toLowerCase() : els.columnColor.value;
    const icon = normalizeColumnIcon(els.columnIcon.value);
    if (!title) {
      els.columnTitle.classList.add("invalid");
      showToast("Please enter a column title.", "error");
      return;
    }

    const id = els.columnId.value;
    if (id) {
      const column = state.columns.find(item => item.id === id && !item.locked);
      if (column) {
        column.title = title;
        column.color = color;
        column.icon = icon;
        showToast("Column updated.", "success");
      }
    } else {
      state.columns.push({ id: uid(), title, color, icon, folded: false, sortMode: DEFAULT_SORT_MODE, collapsedLabels: [], goal: emptyGoal() });
      showToast("Column added.", "success");
    }

    commit();
    els.columnDialog.close();
  }

  function deleteColumn(columnId) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column || column.locked) return;
    const expenseCount = state.expenses.filter(item => item.columnId === columnId).length;
    const plannedCount = state.plannedExpenses.filter(item => item.columnId === columnId).length;
    const movedItems = [
      expenseCount ? `${expenseCount} actual ticket(s)` : "",
      plannedCount ? `${plannedCount} planned expense(s)` : ""
    ].filter(Boolean).join(" and ");
    const message = movedItems
      ? `Delete “${column.title}”? Its ${movedItems} will be moved to Unassigned.`
      : `Delete “${column.title}”?`;
    if (!window.confirm(message)) return;

    state.expenses.forEach(expense => {
      if (expense.columnId === columnId) {
        expense.columnId = "unassigned";
        expense.order = nextOrder("unassigned");
      }
    });
    state.plannedExpenses.forEach(plan => {
      if (plan.columnId === columnId) plan.columnId = "unassigned";
    });
    state.columns = state.columns.filter(item => item.id !== columnId);
    normalizeOrders("unassigned");
    commit();
    showToast("Column deleted.", "success");
  }

  function openSortDialog(columnId) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column) return;
    els.sortColumnId.value = columnId;
    const mode = getColumnSortMode(column);
    const input = els.sortForm.querySelector(`input[name="sortMode"][value="${mode}"]`);
    if (input) input.checked = true;
    openDialog(els.sortDialog);
  }

  function saveSortFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    const columnId = els.sortColumnId.value;
    const mode = els.sortForm.querySelector('input[name="sortMode"]:checked')?.value || DEFAULT_SORT_MODE;
    sortColumn(columnId, mode);
    els.sortDialog.close();
  }

  function sortColumn(columnId, mode) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column || !SORT_MODES[mode]) return;
    column.sortMode = mode;

    const items = getSortedColumnExpenses(column, state.expenses.filter(expense => expense.columnId === columnId));
    items.forEach((expense, index) => { expense.order = index; });
    commit();
    showToast(`Tickets sorted: ${SORT_MODES[mode].label.toLowerCase()}.`, "success");
  }

  function toggleColumnFold(columnId) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column) return;
    column.folded = column.folded !== true;
    commit();
  }

  function toggleLabelGroup(columnId, label) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column || !LABELS.includes(label)) return;
    const collapsed = new Set(getCollapsedLabels(column));
    if (collapsed.has(label)) collapsed.delete(label);
    else collapsed.add(label);
    column.collapsedLabels = [...collapsed];
    commit();
  }

  function openGoalDialog(columnId) {
    const column = state.columns.find(item => item.id === columnId);
    if (!column) return;

    const goal = getColumnGoal(column);
    els.goalColumnId.value = column.id;
    els.goalDialogTitle.textContent = `Goals · ${column.title}`;
    els.goalCurrency.value = goal.currency || inferGoalCurrency(column.id);
    els.goalSharePercent.value = isFiniteNumber(goal.sharePercent) ? toEditableNumber(goal.sharePercent) : "";
    els.goalAmountLimit.value = isFiniteNumber(goal.amountLimit) ? toEditableNumber(goal.amountLimit) : "";
    els.clearGoalBtn.disabled = !hasActiveGoal(goal);
    clearInvalidFields(els.goalForm);
    updateGoalPreview();
    openDialog(els.goalDialog);
    setTimeout(() => els.goalSharePercent.focus(), 0);
  }

  function saveGoalFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }

    clearInvalidFields(els.goalForm);
    const column = state.columns.find(item => item.id === els.goalColumnId.value);
    if (!column) return;

    const currency = normalizeCurrency(els.goalCurrency.value) || "UAH";
    const sharePercent = parseOptionalMoney(els.goalSharePercent.value);
    const amountLimit = parseOptionalMoney(els.goalAmountLimit.value);
    let valid = true;

    if (sharePercent !== null && (!isFiniteNumber(sharePercent) || sharePercent < 0 || sharePercent > 100)) {
      els.goalSharePercent.classList.add("invalid");
      valid = false;
    }
    if (amountLimit !== null && (!isFiniteNumber(amountLimit) || amountLimit < 0)) {
      els.goalAmountLimit.classList.add("invalid");
      valid = false;
    }
    if (!valid) {
      showToast("Use a share from 0 to 100 and a non-negative transaction limit.", "error");
      return;
    }

    column.goal = {
      currency,
      sharePercent,
      amountLimit
    };
    commit();
    els.goalDialog.close();
    showToast(hasActiveGoal(column.goal) ? `Goals saved for “${column.title}”.` : `Goals cleared for “${column.title}”.`, "success");
  }

  function clearCurrentColumnGoals() {
    const column = state.columns.find(item => item.id === els.goalColumnId.value);
    if (!column) return;
    column.goal = emptyGoal(els.goalCurrency.value || inferGoalCurrency(column.id));
    commit();
    els.goalDialog.close();
    showToast(`Goals cleared for “${column.title}”.`, "success");
  }

  function updateGoalPreview() {
    const column = state.columns.find(item => item.id === els.goalColumnId.value);
    if (!column) {
      els.goalPreview.innerHTML = "";
      return;
    }

    const currency = normalizeCurrency(els.goalCurrency.value) || "UAH";
    const shareGoal = parseOptionalMoney(els.goalSharePercent.value);
    const amountGoal = parseOptionalMoney(els.goalAmountLimit.value);
    const expenses = state.expenses.filter(expense => expense.columnId === column.id);
    const currentAmount = getAmountForCurrency(expenses, currency);
    const boardTotal = getAmountForCurrency(state.expenses, currency);
    const currentShare = boardTotal ? currentAmount / boardTotal * 100 : 0;

    const lines = [
      `<div><span>Current transaction sum</span><strong>${formatMoney(currentAmount)} ${escapeHtml(currency)}</strong></div>`,
      `<div><span>Current overall share</span><strong>${formatPercent(currentShare)}%</strong></div>`
    ];
    if (isFiniteNumber(amountGoal) && amountGoal >= 0) {
      lines.push(`<div><span>Amount goal status</span><strong class="${goalStatusClass(currentAmount, amountGoal)}">${currentAmount <= amountGoal ? "Within goal" : "Over goal"}</strong></div>`);
    }
    if (isFiniteNumber(shareGoal) && shareGoal >= 0 && shareGoal <= 100) {
      lines.push(`<div><span>Share goal status</span><strong class="${goalStatusClass(currentShare, shareGoal)}">${currentShare <= shareGoal ? "Within goal" : "Over goal"}</strong></div>`);
    }
    els.goalPreview.innerHTML = lines.join("");
  }

  function handleSummaryClick(event) {
    const button = event.target.closest('[data-summary-action="edit-goal"]');
    if (!button) return;
    const columnId = button.dataset.columnId;
    if (els.summaryDialog.open) els.summaryDialog.close();
    openGoalDialog(columnId);
  }

  function openSummaryDialog() {
    els.summaryContent.innerHTML = renderSummaryModal();
    openDialog(els.summaryDialog);
  }

  function renderSummaryModal() {
    const boardTotals = groupCurrency(state.expenses, "amount", "currency")
      .sort((a, b) => b.amount - a.amount);
    const assignedCount = state.expenses.filter(expense => expense.columnId !== "unassigned").length;
    const assignedPercentage = state.expenses.length ? assignedCount / state.expenses.length * 100 : 0;
    const activeGoalColumns = state.columns.filter(column => hasActiveGoal(getColumnGoal(column)));
    const labelledCount = state.expenses.filter(expense => normalizeLabel(expense.label) !== "none").length;
    const plannedCount = state.plannedExpenses.length;
    const matchedPlannedCount = state.plannedExpenses.filter(isPlanMatched).length;
    const unmatchedPlannedCount = plannedCount - matchedPlannedCount;
    const closedPlannedCount = state.plannedExpenses.filter(plan => plan.closed === true).length;
    const openPlannedCount = plannedCount - closedPlannedCount;
    const plannedMatchRate = plannedCount ? matchedPlannedCount / plannedCount * 100 : 0;
    const matchedActualIds = new Set(
      state.plannedExpenses.flatMap(plan => getMatchedExpenseIds(plan))
        .filter(expenseId => state.expenses.some(expense => expense.id === expenseId))
    );
    const matchedActualCount = matchedActualIds.size;
    const unmatchedActualCount = Math.max(state.expenses.length - matchedActualCount, 0);
    const matchedActualRate = state.expenses.length ? matchedActualCount / state.expenses.length * 100 : 0;
    const unmatchedActualRate = state.expenses.length ? unmatchedActualCount / state.expenses.length * 100 : 0;
    const linkedActualCount = state.plannedExpenses.reduce((total, plan) => total + getMatchedExpenseIds(plan).length, 0);
    const plannedCurrencyStats = buildPlannedCurrencyStats();
    const originalCategoryCharts = renderOriginalCategoryCharts();

    const overviewCards = [
      { label: "Expenses", value: String(state.expenses.length), note: `${assignedCount} assigned` },
      { label: "Categorised", value: `${formatPercent(assignedPercentage)}%`, note: `${state.expenses.length - assignedCount} unassigned` },
      { label: "Matched actual", value: String(matchedActualCount), note: `${formatPercent(matchedActualRate)}% of all actual expenses` },
      { label: "Unmatched actual", value: String(unmatchedActualCount), note: `${formatPercent(unmatchedActualRate)}% of all actual expenses` },
      { label: "Currencies", value: String(boardTotals.length), note: boardTotals.map(item => item.currency).join(" · ") || "No expenses yet" },
      { label: "Planned", value: String(plannedCount), note: `${openPlannedCount} open · ${closedPlannedCount} closed · ${unmatchedPlannedCount} unmatched · ${linkedActualCount} linked tickets` },
      { label: "Active goals", value: String(activeGoalColumns.length), note: `${labelledCount} labelled tickets` }
    ].map(card => `
      <article class="stat-card">
        <span>${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <small>${escapeHtml(card.note)}</small>
      </article>
    `).join("");

    const totalsRows = boardTotals.map(total => {
      const matching = state.expenses.filter(expense => (normalizeCurrency(expense.currency) || "—") === total.currency);
      const largest = matching.reduce((max, expense) => Math.max(max, expense.amount || 0), 0);
      const average = matching.length ? total.amount / matching.length : 0;
      return `
        <tr>
          <td><strong>${escapeHtml(total.currency)}</strong></td>
          <td class="numeric">${formatMoney(total.amount)}</td>
          <td class="numeric">${matching.length}</td>
          <td class="numeric">${formatMoney(average)}</td>
          <td class="numeric">${formatMoney(largest)}</td>
        </tr>
      `;
    }).join("");

    const categoryRows = buildCategoryBreakdown(boardTotals).map(row => `
      <tr>
        <td><span class="summary-column-name"><span class="summary-column-dot" style="--summary-column-color:${escapeHtml(row.column.color)}"></span>${escapeHtml(row.column.title)}</span></td>
        <td><strong>${escapeHtml(row.currency)}</strong></td>
        <td class="numeric">${formatMoney(row.amount)}</td>
        <td class="numeric"><strong>${formatPercent(row.share)}%</strong></td>
        <td class="numeric">${row.count}</td>
      </tr>
    `).join("");

    const goalsMarkup = activeGoalColumns.length
      ? `<div class="goal-cards">${activeGoalColumns.map(renderSummaryGoalCard).join("")}</div>`
      : `<div class="summary-empty">No column goals yet. Use the <strong>◎</strong> button in a column header to add a maximum share or exact transaction limit.</div>`;

    const plannedRows = plannedCurrencyStats.map(item => `
      <tr>
        <td><strong>${escapeHtml(item.currency)}</strong></td>
        <td class="numeric">${formatMoney(item.totalExpected)}</td>
        <td class="numeric">${formatMoney(item.matchedExpected)}</td>
        <td class="numeric">${formatMoney(item.matchedActual)}</td>
        <td class="numeric ${item.difference > 0 ? "planned-over-text" : item.difference < 0 ? "planned-under-text" : ""}">${item.comparableCount ? `${item.difference > 0 ? "+" : ""}${formatMoney(item.difference)}` : "—"}</td>
        <td class="numeric">${item.comparableCount}</td>
      </tr>
    `).join("");

    const labelRows = buildBoardLabelStats(boardTotals).map(item => `
      <tr>
        <td><span class="summary-label-name"><span class="label-dot ${item.label}"></span>${escapeHtml(labelTitle(item.label))}</span></td>
        <td><strong>${escapeHtml(item.currency)}</strong></td>
        <td class="numeric">${formatMoney(item.amount)}</td>
        <td class="numeric">${formatPercent(item.percentage)}%</td>
        <td class="numeric">${item.count}</td>
      </tr>
    `).join("");

    return `
      <div class="stats-grid">${overviewCards}</div>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Board totals</h3><p>Plain transaction sums are kept separate by currency.</p></div></div>
        ${totalsRows ? `<div class="table-scroll"><table class="stats-table"><thead><tr><th>Currency</th><th class="numeric">Total</th><th class="numeric">Tickets</th><th class="numeric">Average</th><th class="numeric">Largest</th></tr></thead><tbody>${totalsRows}</tbody></table></div>` : `<div class="summary-empty">Import or add expenses to see board totals.</div>`}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Planned vs matched</h3><p>Planned amounts are reported separately and never affect actual expense totals, shares, labels, or goals.</p></div></div>
        <div class="summary-inline-stats">
          <span><strong>${matchedActualCount}</strong> matched actual expenses</span>
          <span><strong>${formatPercent(matchedActualRate)}%</strong> matched by count</span>
          <span><strong>${unmatchedActualCount}</strong> unmatched actual expenses</span>
        </div>
        ${plannedRows ? `<div class="table-scroll"><table class="stats-table planned-stats-table"><thead><tr><th>Currency</th><th class="numeric">All planned</th><th class="numeric">Matched expected</th><th class="numeric">Matched actual</th><th class="numeric">Difference</th><th class="numeric">Comparable</th></tr></thead><tbody>${plannedRows}</tbody></table></div>` : `<div class="summary-empty">No planned expenses yet. Open a column's planned counter to add one.</div>`}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Column shares</h3><p>Each percentage is the column's share of all expenses in the same plain currency.</p></div></div>
        ${categoryRows ? `<div class="table-scroll"><table class="stats-table"><thead><tr><th>Column</th><th>Currency</th><th class="numeric">Amount</th><th class="numeric">Overall share</th><th class="numeric">Tickets</th></tr></thead><tbody>${categoryRows}</tbody></table></div>` : `<div class="summary-empty">No column statistics are available yet.</div>`}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Original category distribution</h3><p>Circle charts show each imported or entered Original Category as a percentage of plain transaction sums, separately for every currency.</p></div></div>
        ${originalCategoryCharts || `<div class="summary-empty">Add Original Category values to expenses to see the distribution.</div>`}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Goals</h3><p>Progress against each column's maximum share and exact transaction limit.</p></div></div>
        ${goalsMarkup}
      </section>

      <section class="summary-panel">
        <div class="summary-panel-heading"><div><h3>Label distribution</h3><p>Ticket labels as a share of the board total in each currency.</p></div></div>
        ${labelRows ? `<div class="table-scroll"><table class="stats-table"><thead><tr><th>Label</th><th>Currency</th><th class="numeric">Amount</th><th class="numeric">Share</th><th class="numeric">Tickets</th></tr></thead><tbody>${labelRows}</tbody></table></div>` : `<div class="summary-empty">No label statistics are available yet.</div>`}
      </section>
    `;
  }

  function buildOriginalCategoryStats() {
    const byCurrency = new Map();
    state.expenses.forEach(expense => {
      if (!isFiniteNumber(expense.amount)) return;
      const currency = normalizeCurrency(expense.currency) || "—";
      const category = cellText(expense.originalCategory) || "Uncategorised";
      if (!byCurrency.has(currency)) byCurrency.set(currency, new Map());
      const categoryMap = byCurrency.get(currency);
      categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
    });

    return [...byCurrency.entries()]
      .map(([currency, categoryMap]) => {
        const allItems = [...categoryMap.entries()]
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount);
        const total = allItems.reduce((sum, item) => sum + item.amount, 0);
        const visible = allItems.slice(0, 7);
        if (allItems.length > 7) {
          visible.push({
            category: "Other",
            amount: allItems.slice(7).reduce((sum, item) => sum + item.amount, 0)
          });
        }
        return {
          currency,
          total,
          items: visible.map((item, index) => ({
            ...item,
            percentage: total ? item.amount / total * 100 : 0,
            color: CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]
          }))
        };
      })
      .filter(group => group.total > 0)
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }

  function renderOriginalCategoryCharts() {
    return buildOriginalCategoryStats().map(group => {
      let cursor = 0;
      const gradientStops = group.items.map(item => {
        const start = cursor;
        cursor += item.percentage;
        return `${item.color} ${start.toFixed(4)}% ${cursor.toFixed(4)}%`;
      }).join(", ");
      const legend = group.items.map(item => `
        <div class="category-chart-legend-row">
          <span class="category-chart-swatch" style="--category-chart-color:${item.color}"></span>
          <span class="category-chart-name" title="${escapeHtml(item.category)}">${escapeHtml(item.category)}</span>
          <strong>${formatPercent(item.percentage)}%</strong>
          <small>${formatMoney(item.amount)} ${escapeHtml(group.currency)}</small>
        </div>
      `).join("");

      return `
        <article class="category-chart-card">
          <div class="category-chart-card-header">
            <div><strong>${escapeHtml(group.currency)}</strong><span>${formatMoney(group.total)} total</span></div>
            <span>${group.items.length} ${pluralize(group.items.length, "category", "categories")}</span>
          </div>
          <div class="category-chart-layout">
            <div class="category-donut" style="--category-chart-gradient:conic-gradient(${gradientStops})" role="img" aria-label="Original category distribution for ${escapeHtml(group.currency)}">
              <div class="category-donut-center"><strong>${escapeHtml(group.currency)}</strong><span>100%</span></div>
            </div>
            <div class="category-chart-legend">${legend}</div>
          </div>
        </article>
      `;
    }).join("");
  }

  function buildPlannedCurrencyStats() {
    const grouped = new Map();
    for (const plan of state.plannedExpenses) {
      const actuals = getMatchedExpenses(plan);
      for (const price of getPlannedPrices(plan)) {
        const current = grouped.get(price.currency) || {
          currency: price.currency,
          totalExpected: 0,
          matchedExpected: 0,
          matchedActual: 0,
          comparableExpected: 0,
          comparableCount: 0
        };
        current.totalExpected += price.amount;
        if (actuals.length) {
          current.matchedExpected += price.amount;
          const actualAmount = getCombinedActualAmountForCurrency(actuals, price.currency);
          if (isFiniteNumber(actualAmount)) {
            current.matchedActual += actualAmount;
            current.comparableExpected += price.amount;
            current.comparableCount += 1;
          }
        }
        grouped.set(price.currency, current);
      }
    }
    return [...grouped.values()].map(item => ({
      ...item,
      difference: item.matchedActual - item.comparableExpected
    })).sort((a, b) => a.currency.localeCompare(b.currency));
  }

  function buildCategoryBreakdown(boardTotals) {
    const boardMap = new Map(boardTotals.map(item => [item.currency, item.amount]));
    const boardCurrencies = boardTotals.map(item => item.currency);
    const rows = [];

    state.columns.forEach(column => {
      const expenses = state.expenses.filter(expense => expense.columnId === column.id);
      const sums = groupCurrency(expenses, "amount", "currency");
      const currencies = new Set(sums.map(item => item.currency));
      const goal = getColumnGoal(column);
      if (hasActiveGoal(goal)) currencies.add(goal.currency);
      if (!currencies.size && boardCurrencies.length === 1) currencies.add(boardCurrencies[0]);

      currencies.forEach(currency => {
        const amount = getAmountForCurrency(expenses, currency);
        const boardTotal = boardMap.get(currency) || 0;
        rows.push({
          column,
          currency,
          amount,
          share: boardTotal ? amount / boardTotal * 100 : 0,
          count: expenses.filter(expense => (normalizeCurrency(expense.currency) || "—") === currency).length
        });
      });
    });

    return rows.sort((a, b) => {
      const currencyCompare = a.currency.localeCompare(b.currency);
      if (currencyCompare !== 0) return currencyCompare;
      return b.amount - a.amount;
    });
  }

  function renderSummaryGoalCard(column) {
    const goal = getColumnGoal(column);
    const expenses = state.expenses.filter(expense => expense.columnId === column.id);
    const currentAmount = getAmountForCurrency(expenses, goal.currency);
    const boardTotal = getAmountForCurrency(state.expenses, goal.currency);
    const currentShare = boardTotal ? currentAmount / boardTotal * 100 : 0;
    const metrics = [
      isFiniteNumber(goal.amountLimit)
        ? renderGoalProgress("Transaction limit", currentAmount, goal.amountLimit, goal.currency, false)
        : "",
      isFiniteNumber(goal.sharePercent)
        ? renderGoalProgress("Overall share", currentShare, goal.sharePercent, "%", true)
        : ""
    ].join("");

    return `
      <article class="goal-card" style="--goal-column-color:${escapeHtml(column.color)}">
        <div class="goal-card-heading">
          <div><span class="summary-column-name"><span class="summary-column-dot" style="--summary-column-color:${escapeHtml(column.color)}"></span><strong>${escapeHtml(column.title)}</strong></span><small>${escapeHtml(goal.currency)}</small></div>
          <button class="btn btn-compact" type="button" data-summary-action="edit-goal" data-column-id="${escapeHtml(column.id)}">Edit goal</button>
        </div>
        ${metrics}
      </article>
    `;
  }

  function renderGoalProgress(label, current, limit, unit, isPercentage) {
    const progress = limit > 0 ? current / limit * 100 : current > 0 ? 100 : 0;
    const status = goalStatusClass(current, limit);
    const currentText = isPercentage ? `${formatPercent(current)}%` : `${formatMoney(current)} ${escapeHtml(unit)}`;
    const limitText = isPercentage ? `${formatPercent(limit)}%` : `${formatMoney(limit)} ${escapeHtml(unit)}`;
    return `
      <div class="goal-metric">
        <div class="goal-metric-line"><span>${escapeHtml(label)}</span><strong class="${status}">${currentText} / ${limitText}</strong></div>
        <div class="progress-track"><span class="progress-fill ${status}" style="width:${Math.min(Math.max(progress, 0), 100)}%"></span></div>
        <div class="goal-metric-note">${progress <= 100 ? `${formatPercent(100 - progress)}% remaining` : `${formatPercent(progress - 100)}% over goal`}</div>
      </div>
    `;
  }

  function buildBoardLabelStats(boardTotals) {
    const totals = new Map(boardTotals.map(item => [item.currency, item.amount]));
    const grouped = new Map();
    state.expenses.forEach(expense => {
      const label = normalizeLabel(expense.label);
      const currency = normalizeCurrency(expense.currency) || "—";
      const key = `${label}|${currency}`;
      const current = grouped.get(key) || { label, currency, amount: 0, count: 0 };
      current.amount += expense.amount || 0;
      current.count += 1;
      grouped.set(key, current);
    });

    const order = new Map(LABELS.map((label, index) => [label, index]));
    return [...grouped.values()].map(item => ({
      ...item,
      percentage: totals.get(item.currency) ? item.amount / totals.get(item.currency) * 100 : 0
    })).sort((a, b) => {
      const byCurrency = a.currency.localeCompare(b.currency);
      return byCurrency || order.get(a.label) - order.get(b.label);
    });
  }

  function openMaskDialog(defaultTargetColumnId) {
    const targetColumns = state.columns.filter(column => !column.locked);
    if (!targetColumns.length) {
      showToast("Create a category column before moving tickets by mask.", "error");
      return;
    }

    els.maskTargetColumn.innerHTML = targetColumns.map(column => `<option value="${escapeHtml(column.id)}">${escapeHtml(column.title)}</option>`).join("");
    els.maskTargetColumn.value = targetColumns.some(column => column.id === defaultTargetColumnId)
      ? defaultTargetColumnId
      : targetColumns[0].id;
    els.maskPattern.value = "";
    clearInvalidFields(els.maskForm);
    updateMaskPreview();
    openDialog(els.maskDialog);
    setTimeout(() => els.maskPattern.focus(), 0);
  }

  function updateMaskPreview() {
    const pattern = els.maskPattern.value.trim();
    if (!pattern) {
      els.maskPreview.textContent = "Enter a mask to preview matching Unassigned tickets.";
      els.maskPreview.classList.remove("has-matches");
      return;
    }

    const matches = findUnassignedByMask(pattern);
    const target = state.columns.find(column => column.id === els.maskTargetColumn.value);
    els.maskPreview.textContent = `${matches.length} ${pluralize(matches.length, "ticket matches", "tickets match")}${target ? ` and will move to “${target.title}”.` : "."}`;
    els.maskPreview.classList.toggle("has-matches", matches.length > 0);
  }

  function moveByMaskFromForm(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      event.currentTarget.closest("dialog")?.close("cancel");
      return;
    }
    clearInvalidFields(els.maskForm);
    const pattern = els.maskPattern.value.trim();
    const targetColumnId = els.maskTargetColumn.value;
    const target = state.columns.find(column => column.id === targetColumnId && !column.locked);

    if (!pattern) {
      els.maskPattern.classList.add("invalid");
      showToast("Enter a ticket title mask.", "error");
      return;
    }
    if (!target) {
      showToast("Choose a valid destination column.", "error");
      return;
    }

    const matches = findUnassignedByMask(pattern);
    if (!matches.length) {
      showToast("No Unassigned tickets match this mask.", "error");
      updateMaskPreview();
      return;
    }

    const matchedMatches = matches.filter(expense => getMatchedPlanForExpense(expense.id));
    if (matchedMatches.length) {
      const confirmed = window.confirm(
        `${matchedMatches.length} matched ${pluralize(matchedMatches.length, "expense", "expenses")} will be unmatched and their planned expenses recalculated before moving. Continue?`
      );
      if (!confirmed) return;
      matchedMatches.forEach(expense => clearPlanMatchForExpense(expense.id));
    }

    let order = nextOrder(targetColumnId);
    matches.forEach(expense => {
      expense.columnId = targetColumnId;
      expense.order = order++;
    });
    normalizeOrders("unassigned");
    commit();
    els.maskDialog.close();
    showToast(`Moved ${matches.length} ${pluralize(matches.length, "ticket", "tickets")} to “${target.title}”.`, "success");
  }

  function findUnassignedByMask(pattern) {
    const regex = wildcardToRegExp(pattern);
    return state.expenses.filter(expense => expense.columnId === "unassigned" && regex.test(expense.description || ""));
  }

  function wildcardToRegExp(pattern) {
    const specialCharacters = "\\^$.*+?()[]{}|";
    const source = [...String(pattern)].map(character => {
      if (character === "*") return ".*";
      if (character === "?") return ".";
      return specialCharacters.includes(character) ? `\\${character}` : character;
    }).join("");
    return new RegExp(`^${source}$`, "iu");
  }

  function deleteExpense(expenseId) {
    const expense = state.expenses.find(item => item.id === expenseId);
    if (!expense) return;

    const parent = expense.splitFromExpenseId
      ? state.expenses.find(item => item.id === expense.splitFromExpenseId) || null
      : null;
    const extractedChildren = state.expenses.filter(item => item.splitFromExpenseId === expenseId);

    let message = `Delete “${expense.description}”?`;
    if (parent) {
      message += ` This is an extracted expense linked to “${parent.description}”. It will not be merged back, and the parent amounts and balance will not be recalculated.`;
    } else if (extractedChildren.length) {
      message += ` This is the parent of ${extractedChildren.length} extracted ${pluralize(extractedChildren.length, "expense", "expenses")}. The children will remain as independent tickets and their links to this parent will be removed. No amounts or balances will be recalculated.`;
    }

    if (!window.confirm(message)) return;
    state.expenses = state.expenses.filter(item => item.id !== expenseId);
    state.expenses.forEach(item => {
      if (item.splitFromExpenseId === expenseId) item.splitFromExpenseId = "";
    });
    clearPlanMatchForExpense(expenseId);
    normalizeOrders(expense.columnId);
    commit();
    showToast("Expense deleted.", "success");
  }

  function deleteAllExpenses() {
    if (!state.expenses.length) return;
    if (!window.confirm(`Delete all ${state.expenses.length} expense tickets from the board? Columns will be kept.`)) return;
    state.expenses = [];
    state.plannedExpenses.forEach(plan => {
      plan.matchedExpenseIds = [];
      delete plan.matchedExpenseId;
      reconcilePlanClosedAfterDeletion(plan);
      plan.updatedAt = new Date().toISOString();
    });
    commit();
    showToast("All actual expense tickets were deleted. Planned expenses were kept, reopened where needed, and are now unmatched.", "success");
  }

  function setExpenseLabel(expenseId, label) {
    const expense = state.expenses.find(item => item.id === expenseId);
    if (!expense || !LABELS.includes(label) || label === "none") return;
    expense.label = expense.label === label ? "none" : label;
    commit();
  }

  function handleDragStart(event) {
    const columnHandle = event.target.closest(".column-drag-handle");
    if (columnHandle) {
      draggedColumnId = columnHandle.dataset.columnId;
      draggedExpenseId = null;
      columnDropPosition = "before";
      columnHandle.closest(".column")?.classList.add("column-reordering");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", `column:${draggedColumnId}`);
      return;
    }

    const ticket = event.target.closest(".ticket");
    if (!ticket) return;
    draggedExpenseId = ticket.dataset.expenseId;
    draggedColumnId = null;
    ticket.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedExpenseId);
  }

  function handleDragEnd(event) {
    event.target.closest(".ticket")?.classList.remove("dragging");
    event.target.closest(".column")?.classList.remove("column-reordering");
    clearColumnDragIndicators();
    draggedExpenseId = null;
    draggedColumnId = null;
    columnDropPosition = "before";
  }

  function handleDragOver(event) {
    const column = event.target.closest(".column");
    if (!column) return;

    if (draggedColumnId) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      clearColumnDragIndicators();
      const targetColumnId = column.dataset.columnId;
      if (targetColumnId === draggedColumnId) return;

      if (targetColumnId === "unassigned") {
        columnDropPosition = "after";
      } else {
        const bounds = column.getBoundingClientRect();
        columnDropPosition = event.clientX < bounds.left + bounds.width / 2 ? "before" : "after";
      }
      column.classList.add(columnDropPosition === "before" ? "column-reorder-before" : "column-reorder-after");
      return;
    }

    if (!draggedExpenseId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    document.querySelectorAll(".column.drag-over").forEach(item => {
      if (item !== column) item.classList.remove("drag-over");
    });
    column.classList.add("drag-over");
  }

  function handleDragLeave(event) {
    const column = event.target.closest(".column");
    if (!column) return;
    if (!column.contains(event.relatedTarget)) {
      column.classList.remove("drag-over", "column-reorder-before", "column-reorder-after");
    }
  }

  function handleDrop(event) {
    const column = event.target.closest(".column");
    if (!column) return;
    event.preventDefault();

    if (draggedColumnId) {
      const sourceColumnId = draggedColumnId;
      const targetColumnId = column.dataset.columnId;
      const position = column.classList.contains("column-reorder-after") ? "after" : columnDropPosition;
      draggedColumnId = null;
      clearColumnDragIndicators();
      reorderColumn(sourceColumnId, targetColumnId, position);
      return;
    }

    column.classList.remove("drag-over");
    const expenseId = draggedExpenseId || event.dataTransfer.getData("text/plain");
    const expense = state.expenses.find(item => item.id === expenseId);
    const targetColumnId = column.dataset.columnId;
    if (!expense || !state.columns.some(item => item.id === targetColumnId)) return;

    const oldColumnId = expense.columnId;
    if (oldColumnId !== targetColumnId) {
      if (!confirmAndUnmatchExpenseForColumnMove(expense, targetColumnId)) return;
      expense.columnId = targetColumnId;
      expense.order = nextOrder(targetColumnId);
      normalizeOrders(oldColumnId);
      commit();
    }
  }

  function clearColumnDragIndicators() {
    document.querySelectorAll(".column.drag-over, .column.column-reorder-before, .column.column-reorder-after, .column.column-reordering").forEach(column => {
      column.classList.remove("drag-over", "column-reorder-before", "column-reorder-after", "column-reordering");
    });
  }

  async function importXlsx(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!window.BudgetXlsx?.parse) {
      showToast("The built-in XLSX parser is unavailable.", "error");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      let rows = (await window.BudgetXlsx.parse(buffer, { maxColumns: 10 })).slice(2);
      if (rows.length && looksLikeHeader(rows[0])) rows = rows.slice(1);

      let imported = 0;
      let skipped = 0;
      let order = nextOrder("unassigned");

      for (const row of rows) {
        if (!Array.isArray(row) || row.every(cell => String(cell ?? "").trim() === "")) continue;

        const amount = parseMoney(row[4]);
        const description = cellText(row[3]);
        if (!isFiniteNumber(amount) || !description) {
          skipped += 1;
          continue;
        }

        state.expenses.push({
          id: uid(),
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

      if (!imported) {
        showToast("No valid expense rows were found from row 3 onward.", "error");
        return;
      }

      commit();
      showToast(`Imported ${imported} ${pluralize(imported, "expense", "expenses")}${skipped ? `; skipped ${skipped} invalid row(s)` : ""}.`, "success");
    } catch (error) {
      console.error(error);
      showToast(`Could not import the XLSX file: ${error.message || "unknown error"}`, "error");
    }
  }

  function looksLikeHeader(row) {
    const normalized = row.slice(0, 10).map(cell => cellText(cell).toLowerCase());
    const joined = normalized.join(" ");
    const headerWords = ["date", "дата", "category", "категор", "card", "карт", "description", "опис", "currency", "валют", "amount", "sum", "сума"];
    return headerWords.filter(word => joined.includes(word)).length >= 3;
  }

  function exportBoard() {
    const payload = {
      app: "Budget Board",
      version: STATE_VERSION,
      exportedAt: new Date().toISOString(),
      state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `budget-board-${isoDate(new Date())}.json`);
    showToast("Board backup exported.", "success");
  }

  async function restoreBoard(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const candidate = parsed?.state || parsed;
      const restored = sanitizeState(candidate);
      if (!restored) throw new Error("The file does not contain a valid board state.");
      if (!window.confirm(`Restore ${restored.expenses.length} actual expense ticket(s), ${restored.plannedExpenses.length} planned expense(s), and ${restored.columns.length - 1} category column(s)? This replaces the current board.`)) return;
      state = restored;
      commit();
      showToast("Board restored from backup.", "success");
    } catch (error) {
      console.error(error);
      showToast(`Could not restore the backup: ${error.message || "invalid JSON"}`, "error");
    }
  }

  function getAvailableCurrencies() {
    const codes = new Set(DEFAULT_CURRENCIES);
    const add = value => {
      const code = normalizeCurrency(value);
      if (code) codes.add(code);
    };

    (Array.isArray(state?.currencies) ? state.currencies : []).forEach(add);
    (Array.isArray(state?.columns) ? state.columns : []).forEach(column => add(column?.goal?.currency));
    (Array.isArray(state?.expenses) ? state.expenses : []).forEach(expense => {
      add(expense.currency);
      add(expense.initialCurrency);
      add(expense.remainingCurrency);
    });
    (Array.isArray(state?.plannedExpenses) ? state.plannedExpenses : []).forEach(plan => {
      add(plan.currency1);
      add(plan.currency2);
    });

    const extras = [...codes].filter(code => !DEFAULT_CURRENCIES.includes(code)).sort((a, b) => a.localeCompare(b));
    return [...DEFAULT_CURRENCIES, ...extras];
  }

  function refreshCurrencySelects() {
    const controls = [...document.querySelectorAll(".currency-select")];
    const selectedByControl = new Map(controls.map(control => [
      control,
      control.value && control.value !== ADD_CURRENCY_VALUE
        ? normalizeCurrency(control.value)
        : normalizeCurrency(control.dataset.defaultCurrency) || "UAH"
    ]));
    const currencies = getAvailableCurrencies();
    state.currencies = [...currencies];

    controls.forEach(control => {
      const preferred = selectedByControl.get(control);
      control.innerHTML = [
        ...currencies.map(currency => `<option value="${escapeHtml(currency)}">${escapeHtml(currency)}</option>`),
        `<option value="${ADD_CURRENCY_VALUE}">＋ Add currency…</option>`
      ].join("");
      control.value = currencies.includes(preferred)
        ? preferred
        : (normalizeCurrency(control.dataset.defaultCurrency) || currencies[0] || "UAH");
      control.dataset.previousCurrency = control.value;
    });
  }

  function handleCurrencySelectChange(event) {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;

    if (select.value !== ADD_CURRENCY_VALUE) {
      select.dataset.previousCurrency = select.value;
      if (select === els.goalCurrency) updateGoalPreview();
      return;
    }

    const previous = normalizeCurrency(select.dataset.previousCurrency) || normalizeCurrency(select.dataset.defaultCurrency) || "UAH";
    const entered = window.prompt("Enter a currency code, for example GBP, PLN or CZK:", "");
    if (entered === null) {
      select.value = previous;
      return;
    }

    const code = normalizeCurrency(entered);
    if (!/^[A-Z0-9]{2,8}$/.test(code)) {
      select.value = previous;
      showToast("Use a currency code containing 2–8 Latin letters or digits.", "error");
      return;
    }

    if (!Array.isArray(state.currencies)) state.currencies = [...DEFAULT_CURRENCIES];
    if (!state.currencies.includes(code)) state.currencies.push(code);
    refreshCurrencySelects();
    select.value = code;
    select.dataset.previousCurrency = code;
    persistState();
    if (select === els.goalCurrency) updateGoalPreview();
    showToast(`${code} added to currency lists.`, "success");
  }

  function defaultColumnIcon(id, title = "") {
    const text = `${id || ""} ${title || ""}`.toLowerCase();
    if (id === "unassigned") return "inbox";
    if (text.includes("food") || text.includes("dining") || text.includes("їж") || text.includes("харч")) return "utensils";
    if (text.includes("transport") || text.includes("car") || text.includes("авто") || text.includes("транспорт")) return "car";
    if (text.includes("shop") || text.includes("покуп")) return "shopping";
    if (text.includes("bill") || text.includes("utilit") || text.includes("рахун") || text.includes("комун")) return "invoice";
    return "wallet";
  }

  function normalizeColumnIcon(value) {
    return typeof value === "string" && COLUMN_ICONS[value] ? value : "wallet";
  }

  function renderColumnIcon(value, className = "") {
    const icon = COLUMN_ICONS[normalizeColumnIcon(value)];
    return `<svg class="fa-column-icon ${escapeHtml(className)}" viewBox="0 0 ${icon.width} ${icon.height}" aria-hidden="true" focusable="false"><path fill="currentColor" d="${icon.path}"></path></svg>`;
  }

  function renderColumnIconOptions() {
    els.columnIcon.innerHTML = Object.entries(COLUMN_ICONS)
      .map(([value, icon]) => `<option value="${escapeHtml(value)}">${escapeHtml(icon.label)}</option>`)
      .join("");
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

  function emptyGoal(currency = "UAH") {
    return {
      currency: normalizeCurrency(currency) || "UAH",
      sharePercent: null,
      amountLimit: null
    };
  }

  function sanitizeGoal(raw) {
    const goal = emptyGoal(raw?.currency);
    const sharePercent = nullableNumber(raw?.sharePercent);
    const amountLimit = nullableNumber(raw?.amountLimit);
    goal.sharePercent = isFiniteNumber(sharePercent) && sharePercent >= 0 && sharePercent <= 100 ? sharePercent : null;
    goal.amountLimit = isFiniteNumber(amountLimit) && amountLimit >= 0 ? amountLimit : null;
    return goal;
  }

  function getColumnGoal(column) {
    return sanitizeGoal(column?.goal);
  }

  function hasActiveGoal(goal) {
    return isFiniteNumber(goal?.sharePercent) || isFiniteNumber(goal?.amountLimit);
  }

  function inferGoalCurrency(columnId) {
    const columnTotals = groupCurrency(state.expenses.filter(expense => expense.columnId === columnId), "amount", "currency")
      .sort((a, b) => b.amount - a.amount);
    if (columnTotals[0]?.currency && columnTotals[0].currency !== "—") return columnTotals[0].currency;
    const boardTotals = groupCurrency(state.expenses, "amount", "currency").sort((a, b) => b.amount - a.amount);
    return boardTotals[0]?.currency && boardTotals[0].currency !== "—" ? boardTotals[0].currency : "UAH";
  }

  function getAmountForCurrency(expenses, currency) {
    const normalized = normalizeCurrency(currency) || "—";
    return expenses.reduce((sum, expense) => {
      const expenseCurrency = normalizeCurrency(expense.currency) || "—";
      return expenseCurrency === normalized && isFiniteNumber(expense.amount) ? sum + expense.amount : sum;
    }, 0);
  }

  function getCurrencyTotal(groupedTotals, currency) {
    const normalized = normalizeCurrency(currency) || "—";
    return groupedTotals.find(item => item.currency === normalized)?.amount || 0;
  }

  function goalStatusClass(current, limit) {
    if (!isFiniteNumber(limit)) return "goal-neutral";
    if (current > limit) return "goal-over";
    if (limit > 0 && current / limit >= 0.8) return "goal-warning";
    return "goal-good";
  }

  function groupCurrency(expenses, amountKey, currencyKey) {
    const map = new Map();
    for (const expense of expenses) {
      const amount = expense[amountKey];
      if (!isFiniteNumber(amount)) continue;
      const currency = normalizeCurrency(expense[currencyKey]) || "—";
      map.set(currency, (map.get(currency) || 0) + amount);
    }
    return [...map.entries()].map(([currency, amount]) => ({ currency, amount }));
  }

  function buildLabelStats(expenses, transactionSums) {
    const totals = new Map(transactionSums.map(item => [item.currency, item.amount]));
    const grouped = new Map();

    for (const expense of expenses) {
      if (!LABELS.includes(expense.label) || expense.label === "none" || !isFiniteNumber(expense.amount)) continue;
      const currency = normalizeCurrency(expense.currency) || "—";
      const key = `${expense.label}|${currency}`;
      grouped.set(key, (grouped.get(key) || 0) + expense.amount);
    }

    const result = [];
    for (const label of ["blue", "green", "yellow", "red"]) {
      for (const [key, amount] of grouped.entries()) {
        const [keyLabel, currency] = key.split("|");
        if (keyLabel !== label) continue;
        const total = totals.get(currency) || 0;
        result.push({ label, currency, amount, percentage: total ? amount / total * 100 : 0 });
      }
    }
    return result;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_STATE);
      return sanitizeState(JSON.parse(raw)) || clone(DEFAULT_STATE);
    } catch (error) {
      console.warn("Could not load saved board", error);
      return clone(DEFAULT_STATE);
    }
  }

  function sanitizeState(candidate) {
    if (!candidate || !Array.isArray(candidate.columns) || !Array.isArray(candidate.expenses)) return null;

    const ids = new Set();
    const columns = [];
    let hasUnassigned = false;

    for (const raw of candidate.columns) {
      if (!raw || typeof raw.title !== "string") continue;
      let id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : uid();
      if (ids.has(id)) id = uid();
      ids.add(id);
      const locked = id === "unassigned" || raw.locked === true;
      if (id === "unassigned") hasUnassigned = true;
      columns.push({
        id,
        title: raw.title.trim() || "Untitled",
        color: isHexColor(raw.color) ? raw.color.toLowerCase() : "#64748b",
        icon: normalizeColumnIcon(raw.icon || defaultColumnIcon(id, raw.title)),
        folded: raw.folded === true,
        sortMode: SORT_MODES[raw.sortMode] ? raw.sortMode : DEFAULT_SORT_MODE,
        collapsedLabels: Array.isArray(raw.collapsedLabels) ? [...new Set(raw.collapsedLabels.filter(label => LABELS.includes(label)))] : [],
        goal: sanitizeGoal(raw.goal),
        ...(locked ? { locked: true } : {})
      });
    }

    if (!hasUnassigned) {
      columns.unshift({ id: "unassigned", title: "Unassigned", color: "#64748b", icon: "inbox", folded: false, locked: true, sortMode: DEFAULT_SORT_MODE, collapsedLabels: [], goal: { currency: "UAH", sharePercent: null, amountLimit: null } });
      ids.add("unassigned");
    } else {
      const index = columns.findIndex(column => column.id === "unassigned");
      columns[index].locked = true;
      if (index > 0) columns.unshift(columns.splice(index, 1)[0]);
    }

    const expenses = candidate.expenses.map((raw, index) => {
      const amount = Number(raw?.amount);
      if (!raw || !Number.isFinite(amount) || typeof raw.description !== "string") return null;
      return {
        id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
        columnId: ids.has(raw.columnId) ? raw.columnId : "unassigned",
        order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : index,
        date: cellText(raw.date),
        card: cellText(raw.card),
        description: raw.description.trim() || "Untitled expense",
        note: cellText(raw.note).slice(0, 2000),
        originalCategory: cellText(raw.originalCategory),
        amount: Math.abs(amount),
        currency: normalizeCurrency(raw.currency),
        initialAmount: nullableNumber(raw.initialAmount),
        initialCurrency: normalizeCurrency(raw.initialCurrency),
        remainingAmount: nullableNumber(raw.remainingAmount),
        remainingCurrency: normalizeCurrency(raw.remainingCurrency),
        label: LABELS.includes(raw.label) ? raw.label : "none",
        splitFromExpenseId: typeof raw.splitFromExpenseId === "string" ? raw.splitFromExpenseId : ""
      };
    }).filter(Boolean);

    const expenseIds = new Set(expenses.map(expense => expense.id));
    expenses.forEach(expense => {
      if (!expense.splitFromExpenseId || expense.splitFromExpenseId === expense.id || !expenseIds.has(expense.splitFromExpenseId)) {
        expense.splitFromExpenseId = "";
      }
    });
    const expenseById = new Map(expenses.map(expense => [expense.id, expense]));
    const usedMatches = new Set();
    const planIds = new Set();
    const rawPlans = Array.isArray(candidate.plannedExpenses) ? candidate.plannedExpenses : [];
    const plannedExpenses = rawPlans.map(raw => {
      const amount1 = Number(raw?.amount1);
      if (!raw || !Number.isFinite(amount1) || typeof raw.description !== "string") return null;
      let id = typeof raw.id === "string" && raw.id ? raw.id : uid();
      if (planIds.has(id)) id = uid();
      planIds.add(id);

      const rawMatchIds = Array.isArray(raw.matchedExpenseIds)
        ? raw.matchedExpenseIds
        : (typeof raw.matchedExpenseId === "string" && raw.matchedExpenseId ? [raw.matchedExpenseId] : []);
      const validUniqueMatchIds = [...new Set(rawMatchIds)]
        .filter(matchId => typeof matchId === "string" && expenseIds.has(matchId) && !usedMatches.has(matchId));
      const rawColumnId = ids.has(raw.columnId) ? raw.columnId : "unassigned";
      const matchedColumnId = validUniqueMatchIds.length ? expenseById.get(validUniqueMatchIds[0])?.columnId : null;
      const columnId = matchedColumnId || rawColumnId;
      const matchedExpenseIds = validUniqueMatchIds.filter(matchId => expenseById.get(matchId)?.columnId === columnId);
      matchedExpenseIds.forEach(matchId => usedMatches.add(matchId));
      const amount2 = nullableNumber(raw.amount2);

      return {
        id,
        columnId,
        description: raw.description.trim() || "Untitled planned expense",
        amount1: Math.abs(amount1),
        currency1: normalizeCurrency(raw.currency1) || "UAH",
        amount2: isFiniteNumber(amount2) ? Math.abs(amount2) : null,
        currency2: isFiniteNumber(amount2) ? (normalizeCurrency(raw.currency2) || "EUR") : "",
        matchedExpenseIds,
        closed: raw.closed === true,
        createdAt: cellText(raw.createdAt) || new Date().toISOString(),
        updatedAt: cellText(raw.updatedAt) || cellText(raw.createdAt) || new Date().toISOString()
      };
    }).filter(Boolean);

    const currencySet = new Set(DEFAULT_CURRENCIES);
    const addCurrency = value => {
      const code = normalizeCurrency(value);
      if (code) currencySet.add(code);
    };
    (Array.isArray(candidate.currencies) ? candidate.currencies : []).forEach(addCurrency);
    columns.forEach(column => addCurrency(column.goal?.currency));
    expenses.forEach(expense => {
      addCurrency(expense.currency);
      addCurrency(expense.initialCurrency);
      addCurrency(expense.remainingCurrency);
    });
    plannedExpenses.forEach(plan => {
      addCurrency(plan.currency1);
      addCurrency(plan.currency2);
    });
    const currencies = [
      ...DEFAULT_CURRENCIES,
      ...[...currencySet].filter(code => !DEFAULT_CURRENCIES.includes(code)).sort((a, b) => a.localeCompare(b))
    ];

    for (const column of columns) normalizeOrdersFor(expenses, column.id);
    return { version: STATE_VERSION, currencies, columns, expenses, plannedExpenses };
  }

  function commit() {
    refreshCurrencySelects();
    persistState();
    renderBoard();
  }

  function persistState() {
    try {
      syncAllPlanClosedStates();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Could not save board", error);
      showToast("The board could not be saved in browser storage. Export a backup to keep your changes.", "error");
    }
  }

  function nextOrder(columnId) {
    const orders = state.expenses.filter(item => item.columnId === columnId).map(item => Number(item.order) || 0);
    return orders.length ? Math.max(...orders) + 1 : 0;
  }

  function normalizeOrders(columnId) {
    normalizeOrdersFor(state.expenses, columnId);
  }

  function normalizeOrdersFor(expenses, columnId) {
    expenses
      .filter(item => item.columnId === columnId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((item, index) => { item.order = index; });
  }

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

    // Spreadsheet exports frequently store European dates as text. Parsing
    // "10.06.2026" with new Date(...) is browser-dependent and can treat it
    // as MM.DD.YYYY, turning 10 June into 6 October. Read D.M.Y explicitly.
    const dmy = text.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:[ T]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (dmy) {
      return normalizeDateParts(
        Number(dmy[3]), Number(dmy[2]), Number(dmy[1]),
        Number(dmy[4] || 0), Number(dmy[5] || 0), Number(dmy[6] || 0),
        text
      );
    }

    // Parse ISO-like text locally as well, avoiding UTC timezone shifts.
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

  function uid() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function labelTitle(label) {
    return LABEL_TITLES[normalizeLabel(label)] || capitalize(String(label || ""));
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
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

  function cssEscape(value) {
    if (globalThis.CSS?.escape) return CSS.escape(String(value));
    return String(value).replace(/(["\\])/g, "\\$1");
  }

  function clearInvalidFields(form) {
    form.querySelectorAll(".invalid").forEach(element => element.classList.remove("invalid"));
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showToast(message, type = "") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`.trim();
    toast.textContent = message;
    els.toastRegion.appendChild(toast);
    setTimeout(() => toast.remove(), 3600);
  }
})();
