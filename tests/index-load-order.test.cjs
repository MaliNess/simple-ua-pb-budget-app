const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\s+src="([^"?]+)(?:\?[^"]*)?"/g)].map(match => match[1]);
const order = new Map(scripts.map((script, index) => [script, index]));
const compareHtml = fs.readFileSync(path.join(__dirname, "..", "compare.html"), "utf8");
const compareScripts = [...compareHtml.matchAll(/<script\s+src="([^"?]+)(?:\?[^"]*)?"/g)].map(match => match[1]);
const compareOrder = new Map(compareScripts.map((script, index) => [script, index]));

function before(first, second) {
  assert.ok(order.has(first), `${first} is loaded`);
  assert.ok(order.has(second), `${second} is loaded`);
  assert.ok(order.get(first) < order.get(second), `${first} loads before ${second}`);
}

function compareBefore(first, second) {
  assert.ok(compareOrder.has(first), `${first} is loaded on compare page`);
  assert.ok(compareOrder.has(second), `${second} is loaded on compare page`);
  assert.ok(compareOrder.get(first) < compareOrder.get(second), `${first} loads before ${second} on compare page`);
}

test("index loads classic scripts in dependency order", () => {
  before("src/app/budget-config.js", "src/app/app.js");
  before("src/app/budget-dom.js", "src/app/app.js");
  before("src/core/budget-core.js", "src/currencies/budget-currencies.js");
  before("src/core/budget-core.js", "src/summary/budget-summary.js");
  before("src/state/budget-state.js", "src/app/app.js");
  before("src/import/budget-import-export.js", "src/import/budget-file-actions.js");
  before("src/columns/budget-columns.js", "src/columns/budget-column-dialogs.js");
  before("src/columns/budget-icons.js", "src/app/app.js");
  before("src/tickets/budget-tickets.js", "src/summary/budget-summary.js");
  before("src/tickets/budget-tickets.js", "src/tickets/budget-bulk-label-dialogs.js");
  before("src/tickets/budget-bulk-label-dialogs.js", "src/app/app.js");
  before("src/planning/budget-planning.js", "src/planning/budget-planning-dialogs.js");
  before("src/planning/budget-planning-render.js", "src/planning/budget-planning-dialogs.js");
  before("src/planning/budget-planning-dialog-core.js", "src/planning/budget-planning-dialogs.js");
  before("src/planning/budget-planning-list-dialog.js", "src/planning/budget-planning-dialogs.js");
  before("src/planning/budget-planning-edit-dialog.js", "src/planning/budget-planning-dialogs.js");
  before("src/planning/budget-planning-match-dialog.js", "src/planning/budget-planning-dialogs.js");
  before("src/summary/budget-summary.js", "src/summary/budget-summary-dialogs.js");
  before("src/splits/budget-splits.js", "src/splits/budget-split-dialogs.js");
  before("src/app/budget-ui.js", "src/app/app.js");
  before("src/board/budget-board-render.js", "src/app/app.js");
  before("src/board/budget-board-controller.js", "src/app/budget-app-bootstrap.js");
  before("src/app/budget-app-bootstrap.js", "src/app/app.js");
  before("src/vendor/xlsx-lite.js", "src/app/app.js");
});

test("compare page loads classic scripts in dependency order", () => {
  compareBefore("src/app/budget-config.js", "src/compare/budget-board-compare.js");
  compareBefore("src/core/budget-core.js", "src/compare/budget-board-compare.js");
  compareBefore("src/state/budget-state.js", "src/compare/budget-board-compare.js");
  compareBefore("src/import/budget-import-export.js", "src/compare/budget-board-compare.js");
  compareBefore("src/tickets/budget-tickets.js", "src/summary/budget-summary.js");
  compareBefore("src/planning/budget-planning.js", "src/summary/budget-summary.js");
  compareBefore("src/summary/budget-summary.js", "src/compare/budget-board-compare.js");
  compareBefore("src/app/budget-ui.js", "src/compare/budget-board-compare.js");
});
