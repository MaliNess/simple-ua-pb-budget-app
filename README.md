# Budget Board

A browser-based, offline budget management board. AI-generated for personal usage

## Start

Open `index.html` in Chrome, Edge, Firefox, or another modern browser. No server or installation is required.

On Windows, you can also double-click `START_APP.bat`.

[Link to GH Page](https://maliness.github.io/simple-ua-pb-budget-app/)

## Included features

- Create, rename, recolour, reorder, horizontally fold, and delete category columns. Choose a built-in Font Awesome icon for each folded column.
- Create and edit expenses manually, including an optional internal note on each ticket.
- Split an actual expense into proportional extracted expenses while preserving the original totals, balances, metadata, and navigation links.
- Select some or all extracted expenses and merge them back into their parent, with planned-expense matching recalculated.
- Follow original/extracted and planned-match links with automatic scrolling, temporary highlighting, and direct opening of the selected expense.
- Import `.xlsx` expenses from the first worksheet using the app's built-in limited parser.
- Drag tickets between columns.
- Reorder category columns by dragging the ⠿ handle; the left and right arrow keys also work while the handle is focused.
- Fold a column into a narrow drop target that keeps only its selected icon, actual-expense count, and planned-expense count visible.
- Assign a blue **Service** label or green, yellow, and red labels to tickets.
- Apply one label, including the blue Service label, to every currently unlabelled expense in a selected column.
- Sort each column with one of three label priorities: unlabelled first, green first, or red first.
- Collapse or expand each label group independently inside every column.
- Move all matching tickets from **Unassigned** into a chosen category using a title/description mask.
- See transaction totals, initial-currency totals, label totals, and label percentages in each column header.
- See each column's percentage of all board expenses, calculated separately for every plain transaction currency.
- Add optional spending goals to every column.
- Add planned expenses with expected prices in one or two currencies, match one or several actual tickets, and compare combined actual values with the plan.
- Open a board-wide **All Planned** modal with totals by currency, per-plan progress for price 1 and price 2, coloured column names, open/closed state, and direct editing or match management.
- Mark planned expenses as open or closed; open plans contribute their remaining expected amounts to the column header.
- Create a matched planned expense directly from an actual ticket; transaction and distinct initial-currency amounts are copied automatically while the planned title remains user-defined.
- Match or unmatch an actual ticket to an existing planned expense directly from the actual expense edit modal.
- Open a full board summary with totals, planned-versus-matched statistics, averages, largest expenses, column shares, Original Category circle charts, goal progress, and label distribution.
- Delete all expense tickets while keeping the columns.
- Automatic local saving in the browser.
- Export the complete board to JSON and restore it later.

## Horizontally folded columns

Use the **⇤** action in a column header to fold that column into a narrow vertical rail. A folded column shows only:

- The selected Font Awesome icon. Hover over it to see the full column title, or click it to expand the column.
- The number of actual expense tickets.
- The total number of planned expenses.

A folded column remains an active drag-and-drop target. Dropping an expense into it moves the ticket without expanding the column. Folded state and selected icons are saved automatically and included in exported JSON backups.

Choose the folded icon from the regular **Edit Column** dialog. Existing boards are migrated with sensible default icons where possible.

## All Planned modal

Click **All Planned** in the top toolbar to open a board-wide list of planned expenses. The modal includes:

- Total, open, closed, matched, and linked-actual statistics.
- Overall expected, matched-actual, and open-remaining sums separated by currency.
- Every planned title and its coloured column name.
- Price 1 and price 2 amounts, matched amounts, remaining amounts, and matched percentages.
- Direct controls to close/reopen a plan, edit it, change its actual matches, or delete it.

After editing or changing matches, the app returns to the board-wide planned list automatically.

## Column order

Drag the **⠿** handle beside a category title to place that column before or after another category. The **Unassigned** column remains fixed at the beginning because it is the board's import and uncategorised-ticket area.

For keyboard control, focus a category's **⠿** handle and press the left or right arrow key. Column order is saved automatically and included in JSON backups.

## Overall expense percentages

Every column header includes an **Overall share** section. Percentages use the plain transaction sum and are calculated separately by currency.

For example, if the complete board contains `1 500 UAH` and the Food column contains `500 UAH`, Food shows `33.3%` for UAH. EUR, USD, and other currencies are never added together or converted automatically.

## Column goals

Use the **◎** button in a column header to add or edit goals. Both goals are optional:

- **Maximum share of overall expenses** — the column's maximum percentage of all plain transaction expenses in the selected currency.
- **Exact transaction limit** — the maximum plain transaction sum for that column in the selected currency.

One goal currency is selected for both targets. Goal indicators are:

- Green — comfortably within the target.
- Yellow — at least 80% of the target has been used.
- Red — the target has been exceeded.

Goals are saved in browser storage and included in exported JSON backups. Existing backups from older app versions remain compatible.

## Summary modal

Click **Summary** in the top toolbar to view:

- Total expense count and categorisation percentage.
- Board totals by plain transaction currency.
- Ticket count, average transaction, and largest transaction per currency.
- Every column's amount and overall expense percentage per currency.
- Progress bars for all active column goals.
- Blue Service, green, yellow, red, and unlabelled ticket distribution.
- Planned expense counts, linked-ticket count, match rate, and expected-versus-combined-actual totals by currency.
- Original Category circle charts showing each category’s percentage of plain transaction sums, separately for every currency.

The **Edit goal** button in the summary opens the selected column's goal settings.

## Sorting and label groups

Use the **⇅** button in a column header to choose one of these group orders:

- Unlabelled → Service → Green → Yellow → Red
- Green → Yellow → Red → Service → Unlabelled
- Red → Yellow → Green → Service → Unlabelled

Tickets inside a label group are ordered newest first. Click a label-group header to collapse or expand that group. In the **Unlabelled** group, use **Label all** to apply Service, green, yellow, or red to every currently unlabelled ticket in that column. Existing labelled tickets are not changed. The chosen sorting mode and collapsed groups are stored in browser storage and included in JSON backups.

## Move from Unassigned by mask

Click the **⇥** button in the destination column. Enter a ticket title/description mask and all matching tickets currently in **Unassigned** will be moved there.

- `*` matches any amount of text.
- `?` matches one character.
- Matching is case-insensitive and applies to the entire title.

Example: `Автоплатіж. Отримувач Благодійний фонд*` matches titles such as `Автоплатіж. Отримувач Благодійний фонд 1.` and `Автоплатіж. Отримувач Благодійний фонд2`.

## Planned expenses

Each column has a compact **remaining** counter in its second header row. The number shows planned expenses whose **Closed** flag is false, including both matched and unmatched plans. Click the counter to open all planned expenses for that column.

A planned expense contains:

- A title or description.
- A required approximate amount and currency.
- An optional second approximate amount in another currency.

Planned expenses are stored separately from actual tickets. They never affect column totals, overall percentages, label statistics, goals, averages, or largest-expense calculations.

After actual transactions appear, open the planned expense and choose **Match actuals**. Select one or more available tickets from the same column. A planned expense may contain several actual tickets, while each actual ticket can still belong to only one planned expense. For every currency provided in the plan, the app adds matching values from all linked tickets. A ticket contributes its plain transaction amount when the plain currency matches; otherwise its initial transaction amount is used when the initial currency matches. One ticket contributes at most one value to each planned currency, so when plain and initial currencies are identical, only the plain transaction amount is counted. If none of the linked tickets contains a planned currency, the comparison is marked unavailable.

Example: a `200 UAH / 20 EUR` plan linked to tickets containing `100 UAH + 10 EUR`, `5 EUR + 50 UAH`, and `20 UAH + 2 EUR` is compared as `170 of 200 UAH` and `17 of 20 EUR`.

You can also click the **◷** button directly on an actual ticket. This opens a new planned-expense form in the same column, copies the plain transaction amount as the first expected price, copies the initial transaction amount as the second price when it uses a different currency, and automatically matches the resulting plan to that ticket. The title is intentionally left blank for you to enter. If the ticket is already matched, the same button opens its existing planned expense for editing.

The regular **Edit Expense** modal also contains a **Matched planned expense** selector. Choose any plan from the ticket’s current column to add the ticket to it, or choose **Not matched** to detach it. Several actual tickets may select the same plan, but each actual ticket can belong to only one plan.

Inside the planned-expense modal, each matched actual-expense row is clickable. Selecting a row closes the planned list and opens that actual expense in the regular **Edit Expense** modal.

Every planned expense has a **Closed** checkbox. Closed plans are excluded from the remaining planned total. Open plans add only their unspent remainder, separately by currency, to the **Planned remaining** section above the transaction sums in the column header. The section title and the compact header counter also show how many plans currently have **Closed = false**. A plan is automatically closed when the combined matched actual amount in price 1 currency reaches or exceeds price 1. You can also close a plan manually before it is fully used, or reopen it while price 1 is still below the target.

When a plan has only one linked actual ticket, moving that ticket to another column also moves the plan. When a plan has several linked tickets, moving one of them to another column detaches only that ticket so the remaining matches stay valid in the original column. Deleting an actual ticket removes only that match and keeps the planned expense. After a matched actual ticket is deleted, the plan is recalculated: it stays closed only when the remaining linked actual expenses still reach price 1; otherwise **Closed** is automatically returned to false. **Delete All** performs the same recalculation for every plan, so all plans without enough remaining matched value reopen. Deleting a column moves both its actual and planned items to **Unassigned**.

## Split actual expenses

Click the **✂** button on an original actual-expense ticket to extract part of it into a separate ticket. Enter a new title and choose whether to type the extracted plain transaction amount or the extracted initial transaction amount. The other amount is calculated proportionally and rounded to two decimal places.

For example, splitting `10 UAH / 1 EUR` by entering `0.20 EUR` creates a new `2 UAH / 0.20 EUR` ticket and updates the original to `8 UAH / 0.80 EUR`.

The extracted ticket keeps the source date, card, column, Original Category, internal note, label, and planned-expense match. The original ticket keeps its existing final balance. When a source balance exists, the extracted ticket balance is calculated as the source balance plus the updated plain amount remaining in the original ticket. The extracted balance currency is always the plain transaction currency.

An extracted ticket contains a link back to its original expense. The original ticket contains a folded **Extracted expenses** list with links to every extracted part. Repeated splits should be made from the original ticket so all parts stay grouped under one source.

Use **↶ Merge extracted** on the parent ticket to reverse a split. Select any subset of its extracted tickets or select all of them. Their plain and initial transaction amounts are added back to the parent, the selected tickets are removed, and the parent's final post-transaction balance is preserved. You can also choose which planned expense the merged parent should belong to; all affected planned expenses are recalculated, including their matched totals, remaining values, and **Closed** state.

Deleting a related ticket is intentionally different from merging. Deleting an extracted child asks for confirmation and does not add its amounts back to the parent. Deleting a parent also asks for confirmation, leaves every child amount and balance unchanged, and removes the parent link from those children so they become independent tickets.

## XLSX import format

Rows 1 and 2 are ignored. Data is read from row 3, using columns A–J in this order:

1. Date — `31.05.2026 20:36:03`
2. Category — text
3. Card — numbers and `*`
4. Description — text
5. Plain transaction sum — number; a leading `-` is removed
6. Plain currency — text
7. Initial transaction sum — number
8. Initial currency — text
9. Remaining sum — number
10. Remaining currency — text

Imported tickets are added to **Unassigned**. If row 3 is detected as a header row, it is skipped and data begins on row 4.

Both comma and dot decimal separators are supported. Text dates are interpreted explicitly as day–month–year, so `10.06.2026` remains 10 June 2026 rather than being swapped to 6 October.

The importer is implemented directly in the app and supports standard, non-encrypted `.xlsx` workbooks that use normal ZIP compression. It reads the first worksheet, shared strings, inline strings, numbers, cached formula results, and Excel date serials in column A. Legacy binary `.xls`, password-protected files, multi-part ZIP archives, and ZIP64 workbooks are not supported.

## Backup

Use **Export Board** to download a JSON backup containing all columns, colours, selected icons, folded states, actual tickets, planned expenses, matches, internal notes, labels, column assignments, sorting modes, collapsed groups, and goals. Use **Restore** to replace the current board with a saved backup.

Browser storage belongs to the exact browser/profile and file location, so regular JSON backups are recommended.

## Internal ticket notes

Open a ticket with the **✎** button and use **Internal note** for private comments. Notes are displayed inside the ticket, saved in browser storage, and included in JSON exports. XLSX imports leave the note empty because the original ten-column spreadsheet format is unchanged.

## Version 3.8.2

Planned expenses are now re-evaluated after deleting one matched actual expense or all actual expenses. A plan is automatically reopened when its remaining linked actuals no longer reach price 1.

## Version 3.8

Added proportional expense splitting. A new extracted ticket can be defined by either plain or initial transaction amount; the other currency amount is calculated to two decimal places, the original amounts are reduced, statement balance sequencing is preserved, and original/extracted tickets link to each other.

## Version 3.7.1

The column counter and **Planned remaining** heading now show the number of plans with **Closed = false**. Matched actual-expense rows in the planned modal can now be clicked to open the actual expense editor.

## Version 3.7

Added currency-matched aggregation across multiple actual expenses, open/closed planned-expense checkboxes, automatic closing when price 1 is reached, and remaining planned totals in column headers.

## Version 3.6

Added planned-expense matching directly in the actual expense edit modal and Original Category circle charts in Summary. The chart percentages use plain transaction amounts and remain separated by currency.

## Version 3.5

Added many-to-one planned matching: one planned expense can now be linked to several actual tickets in the same column, and expected-versus-actual comparisons use the combined actual totals by currency.

## Version 3.4

Added a ticket-level **◷** action that creates a matched planned expense in the same column, prefilled from the actual transaction and its distinct initial currency while requiring a user-entered planned title.

## Version 3.3

Added the blue **Service** label and planned expenses with two-currency estimates, actual-ticket matching, expected-versus-actual comparisons, unmatched counters in column headers, and planned statistics in the Summary modal.

## Version 3.2.1

Fixed XLSX text-date parsing so European `DD.MM.YYYY` values are not interpreted as `MM.DD.YYYY`.

## Version 3.2

Added internal ticket notes and a **Label all** action for every Unlabelled group.

## Version 3.1

Added persistent category-column reordering by drag handle and keyboard arrows.

## Version 3.0

Added overall expense percentages per column, per-column percentage and exact-limit goals, and the full board statistics modal.


## Version 3.9.0

- Currency fields are real dropdowns and always show UAH, EUR, and USD.
- Choose **Add currency…** to add another 2–8 character currency code. Custom currencies are saved in browser storage and JSON backups.
- Moving a matched actual expense to another column now asks for confirmation. When confirmed, the expense is unmatched and the original planned expense is recalculated, including its Closed state and remaining planned amount.
- This confirmation also applies to drag-and-drop, changing the column in Edit Expense, and mask-based moves.

## Version 3.10.0

- Added reverse split functionality: select some or all extracted expenses and merge them back into their parent.
- Parent plain and initial amounts are restored proportionally, the final balance is preserved, and selected child tickets are removed.
- Planned-expense links can be chosen during merge; every affected plan is recalculated.
- Deleting a child or parent now gives relationship-specific confirmation. Parent/child amounts and balances are never re-estimated during deletion, and deleting a parent detaches its surviving children.

## Version 3.10.1

- Fixed remaining child balances after a partial merge.
- After selected extracted expenses are merged into the parent, every surviving child balance is recalculated from the preserved parent balance and the updated transaction sequence.
- Merging a later child keeps earlier balances unchanged when appropriate; merging an earlier child correctly increases the balances of later surviving children.


## Version 3.11.0

- Added horizontally folded columns with selectable embedded Font Awesome icons.
- Folded columns remain valid drag-and-drop destinations and do not expand when a ticket is dropped into them.
- Added the board-wide **All Planned** modal with overall currency totals, per-plan price 1 and price 2 progress, coloured column information, and edit/match/close/delete actions.


## Version 3.12.0

- Removed the bundled SheetJS parser and related vendor files.
- Added a custom limited `.xlsx` reader implemented directly in the app.
- The importer continues to read the first worksheet, skip rows 1–2, preserve Ukrainian and English text, parse numeric and text dates, and support the existing ten-column bank statement format.
- Legacy `.xls`, encrypted workbooks, ZIP64, and unusual workbook features remain outside the supported import format.
