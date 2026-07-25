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

function before(first, second) {
  assert.ok(order.has(first), `${first} is loaded`);
  assert.ok(order.has(second), `${second} is loaded`);
  assert.ok(order.get(first) < order.get(second), `${first} loads before ${second}`);
}

test("index loads classic scripts in dependency order", () => {
  before("budget-config.js", "app.js");
  before("budget-dom.js", "app.js");
  before("budget-core.js", "budget-currencies.js");
  before("budget-core.js", "budget-summary.js");
  before("budget-state.js", "app.js");
  before("budget-import-export.js", "budget-file-actions.js");
  before("budget-columns.js", "budget-column-dialogs.js");
  before("budget-icons.js", "app.js");
  before("budget-tickets.js", "budget-summary.js");
  before("budget-tickets.js", "budget-bulk-label-dialogs.js");
  before("budget-bulk-label-dialogs.js", "app.js");
  before("budget-planning.js", "budget-planning-dialogs.js");
  before("budget-planning-render.js", "budget-planning-dialogs.js");
  before("budget-planning-dialog-core.js", "budget-planning-dialogs.js");
  before("budget-planning-list-dialog.js", "budget-planning-dialogs.js");
  before("budget-planning-edit-dialog.js", "budget-planning-dialogs.js");
  before("budget-planning-match-dialog.js", "budget-planning-dialogs.js");
  before("budget-summary.js", "budget-summary-dialogs.js");
  before("budget-splits.js", "budget-split-dialogs.js");
  before("budget-ui.js", "app.js");
  before("budget-board-render.js", "app.js");
  before("budget-board-controller.js", "budget-app-bootstrap.js");
  before("budget-app-bootstrap.js", "app.js");
  before("xlsx-lite.js", "app.js");
});
