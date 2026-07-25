(() => {
  "use strict";

  const Splits = globalThis.BudgetBoardSplits || (typeof require === "function" ? require("./budget-splits.js") : null);
  if (!Splits) throw new Error("BudgetBoardSplits must be loaded before budget-split-dialogs.js.");

  function createSplitExpenseController(deps) {
    const {
      els,
      getState,
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
    } = deps;

    function openSplitExpenseDialog(expenseId) {
      const state = getState();
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
      const state = getState();
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
      const state = getState();
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
      showToast(`Created "${description}" and reduced the original expense.`, "success");
    }

    function getExtractedChildren(parentId) {
      return Splits.getExtractedChildren(getState().expenses, parentId);
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
      return Splits.recalculateExtractedExpenseBalances(parent, getState().expenses);
    }

    function calculateMergeResult(parent, children) {
      return Splits.calculateMergeResult(parent, children, parent ? getExtractedChildren(parent.id) : children);
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
      const state = getState();
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
      const state = getState();
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

      const state = getState();
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
      showToast(`Merged ${children.length} extracted ${pluralize(children.length, "expense", "expenses")} back into "${parent.description}".`, "success");
    }

    return Object.freeze({
      openSplitExpenseDialog,
      updateSplitBasis,
      updateSplitPreview,
      saveSplitExpenseFromForm,
      openMergeExpenseDialog,
      updateMergePreview,
      saveMergeExpenseFromForm
    });
  }

  const api = Object.freeze({ createSplitExpenseController });

  if (typeof window !== "undefined") window.BudgetBoardSplitDialogs = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
