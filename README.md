# Budget Board

An offline browser budget board for categorising card expenses, planning expected payments, and reviewing spending summaries. The app runs from static files and stores data in the browser, so it can be used locally without a server, build step, or internet connection.

## Start

Open `index.html` in a modern browser such as Chrome, Edge, Firefox, or Safari.

On Windows, you can also double-click `START_APP.bat`.

Published copy: [GitHub Pages](https://maliness.github.io/simple-ua-pb-budget-app/)

## Data Storage And Backups

The board is saved in browser `localStorage` under:

```text
budgetBoardState.v1
```

Storage belongs to the exact browser profile and page origin. Deleting the app folder does not delete saved board data from the browser.

Use **Export Board** regularly to download a JSON backup. The backup contains columns, colours, icons, folded states, actual expenses, planned expenses, matches, notes, labels, sorting modes, collapsed groups, goals, and custom currencies.

Use **Restore** to replace the current board with a verified JSON backup. The app clears the current board state before applying the restored data.

To clear local browser data manually from DevTools:

```js
localStorage.removeItem("budgetBoardState.v1");
location.reload();
```

## Main Features

- Create, rename, recolour, delete, reorder, and horizontally fold category columns.
- Keep **Unassigned** fixed as the first column for imports and uncategorised tickets.
- Pick a Font Awesome icon for a folded column; folded columns remain drag-and-drop targets.
- Create and edit actual expense tickets manually.
- Add internal notes to tickets.
- Assign labels: **Service**, green, yellow, red, or unlabelled.
- Apply a label to all currently unlabelled expenses in a column.
- Sort each column by label priority and collapse label groups independently.
- Drag tickets between columns, including folded columns.
- Move tickets from **Unassigned** by title/description mask.
- Import `.xlsx` bank statement data.
- Export and restore the complete board as JSON.
- Delete all actual expenses while keeping columns, goals, currencies, and planned expenses.

## Column Summaries

Each column header shows:

- actual transaction totals by plain transaction currency;
- initial transaction totals by initial currency;
- label totals and label percentages;
- the column's share of all board expenses by plain transaction currency;
- planned remaining totals for open planned expenses;
- the number of planned expenses where **Closed = false**.

Currencies are never converted or added together automatically. Percentages and totals are calculated separately per currency.

## Summary

Click **Summary** to view board-level statistics:

- total actual expense count;
- categorised and uncategorised expense counts;
- matched and unmatched actual expense counts and percentages;
- totals, averages, and largest expenses by currency;
- column shares by currency;
- goal progress;
- label distribution;
- planned-versus-matched statistics;
- Original Category donut charts by plain transaction currency.

The summary window includes **Exclude Service expenses from summary**. When checked, tickets labelled **Service** are excluded from actual-expense summary calculations, including totals, category charts, matched/unmatched actual counts, column shares, goals, and label distribution. Planned expenses still exist, but matched planned statistics use only the included actual tickets.

## Column Goals

Use the goal action in a column header to configure optional limits:

- maximum percentage of overall expenses;
- exact plain transaction limit;
- goal currency.

Goal status colours:

- green: comfortably within the target;
- yellow: at least 80% used;
- red: exceeded.

Goals are saved locally and included in JSON backups.

## Planned Expenses

Planned expenses belong to columns and are separate from actual tickets. They are not included in actual transaction totals, goals, averages, largest-expense calculations, or label statistics.

A planned expense contains:

- title or description;
- required expected amount and currency;
- optional second expected amount and currency;
- **Closed** checkbox.

Open planned expenses contribute their remaining expected amount to the column header. Remaining amounts are grouped by currency and never go below zero.

One planned expense can be matched to multiple actual tickets in the same column. Each actual ticket can belong to only one planned expense. Matching compares planned currencies against both actual plain and initial transaction currencies:

- if the actual plain currency matches, the plain transaction amount is used;
- otherwise, if the actual initial currency matches, the initial transaction amount is used;
- if plain and initial currencies are the same, the ticket contributes only the plain amount for that currency.

Example: a `200 UAH / 20 EUR` plan linked to actual tickets `100 UAH / 10 EUR`, `5 EUR / 50 UAH`, and `20 UAH / 2 EUR` is compared as `170 of 200 UAH` and `17 of 20 EUR`.

A plan closes automatically when matched actual expenses reach or exceed price 1. It can also be closed manually. If a matched actual ticket is deleted or detached and price 1 is no longer covered, the plan is reopened automatically.

Use **All Planned** to open the board-wide planned-expense list with totals, progress, column colours, open/closed state, and edit/match/delete actions.

## Actual And Planned Matching

Actual tickets can be matched or unmatched from:

- the planned-expense modal;
- the actual expense edit modal;
- the ticket-level planned action, which creates or opens a matched planned expense.

Moving a matched actual ticket to another column asks for confirmation. If confirmed, the ticket is detached from its plan and the original planned expense is recalculated. Cancelling keeps the ticket in its original column.

Rows for matched actual tickets inside planned modals are clickable. Selecting one closes the planned modal, scrolls to the actual ticket, highlights it, and opens the edit modal.

## Split And Merge

Actual expenses can be split into extracted child expenses. The user enters a child title and either the plain transaction amount or initial transaction amount. The other amount is calculated proportionally and rounded to two decimal places.

Example: splitting `10 UAH / 1 EUR` by entering `0.20 EUR` creates a new `2 UAH / 0.20 EUR` ticket and updates the original to `8 UAH / 0.80 EUR`.

The child keeps most parent metadata: date, card, column, Original Category, note, label, and planned match. The parent keeps its final balance. The child balance is calculated from the original balance plus the updated plain amount remaining in the parent.

Extracted tickets link back to the parent. The parent shows a folded list of extracted tickets. These links scroll to the selected ticket, highlight it, and open it for editing.

Use **Merge extracted** on a parent ticket to merge selected children back. The selected child amounts are added back to the parent, selected children are removed, surviving child balances are recalculated, and affected planned expenses are recalculated.

Deleting a parent or child asks for confirmation. Deleting does not restore or re-estimate amounts. If a parent is deleted, surviving children become independent tickets.

## XLSX Import Format

The importer reads the first worksheet. Rows 1 and 2 are ignored. Data starts from row 3 unless row 3 is detected as a header row, in which case data starts from row 4.

Columns A-J:

1. Date, for example `31.05.2026 20:36:03`
2. Original Category
3. Card
4. Description
5. Plain transaction sum, with a leading `-` removed
6. Plain currency
7. Initial transaction sum
8. Initial currency
9. Remaining sum
10. Remaining currency

Both comma and dot decimal separators are supported. Text dates are parsed as `DD.MM.YYYY`, so `10.06.2026` means 10 June 2026.

The built-in parser supports standard non-encrypted `.xlsx` workbooks with normal ZIP compression, shared strings, inline strings, numbers, cached formula results, and Excel date serials in column A. It does not support legacy `.xls`, password-protected workbooks, ZIP64, multipart ZIP archives, or unusual workbook features.

## Masks

Use the move-from-Unassigned action in a destination column to move matching tickets by title/description mask.

- `*` matches any amount of text.
- `?` matches one character.
- Matching is case-insensitive and applies to the full title.

Example:

```text
Автоплатіж. Отримувач Благодійний фонд*
```

matches:

```text
Автоплатіж. Отримувач Благодійний фонд 1.
Автоплатіж. Отримувач Благодійний фонд2
```

## Custom Currencies

Currency fields show `UAH`, `EUR`, and `USD` by default. Choose **Add currency...** to add another 2-8 character currency code. Custom currencies are saved locally and included in JSON backups.

## Project Structure

```text
index.html
styles.css
START_APP.bat
src/
  app/          bootstrap, DOM references, UI helpers, configuration
  board/        board rendering and board-level event handling
  columns/      column actions, dialogs, icons, mask moves
  core/         shared calculations and formatting helpers
  currencies/   currency dropdown and custom currency handling
  import/       XLSX import, JSON export, restore, file actions
  planning/     planned expense logic, rendering, dialogs, matching
  splits/       split and merge logic/dialogs
  state/        localStorage persistence and state migration
  summary/      summary calculations and summary dialog rendering
  tickets/      actual expense actions and dialogs
  vendor/       local app vendor helpers
tests/
vendor/
```

The app uses classic browser scripts loaded in dependency order from `index.html`. This keeps local file usage simple and avoids a build step while still separating logic by feature area.

## Development Checks

Run all focused tests:

```sh
node tests/core.test.cjs
node tests/modules.test.cjs
node tests/state.test.cjs
node tests/planning-summary.test.cjs
node tests/splits.test.cjs
node tests/ui.test.cjs
node tests/render.test.cjs
node tests/index-load-order.test.cjs
```

Run a syntax pass for browser scripts on Linux/macOS:

```sh
find src -name "*.js" -print0 | xargs -0 -n1 node --check
```

Run the same syntax pass in PowerShell:

```powershell
Get-ChildItem -Recurse -File src -Filter *.js | Sort-Object FullName | ForEach-Object {
  node --check $_.FullName
}
```

## Line Endings

The repository uses `.gitattributes` to keep source files as LF across platforms. Windows batch files stay CRLF. This is safe for Linux and avoids noisy line-ending changes after Git normalisation.
