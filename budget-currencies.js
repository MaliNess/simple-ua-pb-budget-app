(() => {
  "use strict";

  const Core = globalThis.BudgetBoardCore || (typeof require === "function" ? require("./budget-core.js") : null);
  if (!Core) throw new Error("BudgetBoardCore must be loaded before budget-currencies.js.");
  const { normalizeCurrency } = Core;

  function getAvailableCurrencies(state, defaultCurrencies) {
    const codes = new Set(defaultCurrencies);
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

    const extras = [...codes].filter(code => !defaultCurrencies.includes(code)).sort((a, b) => a.localeCompare(b));
    return [...defaultCurrencies, ...extras];
  }

  function createCurrencyController(deps) {
    const {
      getState,
      defaultCurrencies,
      addCurrencyValue,
      queryCurrencyControls,
      escapeHtml,
      promptCurrency,
      persistState,
      showToast,
      goalCurrencyElement,
      updateGoalPreview,
      isSelectElement
    } = deps;

    function refreshCurrencySelects() {
      const state = getState();
      const controls = [...queryCurrencyControls()];
      const selectedByControl = new Map(controls.map(control => [
        control,
        control.value && control.value !== addCurrencyValue
          ? normalizeCurrency(control.value)
          : normalizeCurrency(control.dataset.defaultCurrency) || "UAH"
      ]));
      const currencies = getAvailableCurrencies(state, defaultCurrencies);
      state.currencies = [...currencies];

      controls.forEach(control => {
        const preferred = selectedByControl.get(control);
        control.innerHTML = [
          ...currencies.map(currency => `<option value="${escapeHtml(currency)}">${escapeHtml(currency)}</option>`),
          `<option value="${addCurrencyValue}">＋ Add currency…</option>`
        ].join("");
        control.value = currencies.includes(preferred)
          ? preferred
          : (normalizeCurrency(control.dataset.defaultCurrency) || currencies[0] || "UAH");
        control.dataset.previousCurrency = control.value;
      });
    }

    function handleCurrencySelectChange(event) {
      const state = getState();
      const select = event.currentTarget;
      if (!isSelectElement(select)) return;

      if (select.value !== addCurrencyValue) {
        select.dataset.previousCurrency = select.value;
        if (select === goalCurrencyElement) updateGoalPreview();
        return;
      }

      const previous = normalizeCurrency(select.dataset.previousCurrency) || normalizeCurrency(select.dataset.defaultCurrency) || "UAH";
      const entered = promptCurrency("Enter a currency code, for example GBP, PLN or CZK:", "");
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

      if (!Array.isArray(state.currencies)) state.currencies = [...defaultCurrencies];
      if (!state.currencies.includes(code)) state.currencies.push(code);
      refreshCurrencySelects();
      select.value = code;
      select.dataset.previousCurrency = code;
      persistState();
      if (select === goalCurrencyElement) updateGoalPreview();
      showToast(`${code} added to currency lists.`, "success");
    }

    return Object.freeze({
      refreshCurrencySelects,
      handleCurrencySelectChange
    });
  }

  const api = Object.freeze({
    createCurrencyController,
    getAvailableCurrencies
  });

  if (typeof window !== "undefined") window.BudgetBoardCurrencies = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
