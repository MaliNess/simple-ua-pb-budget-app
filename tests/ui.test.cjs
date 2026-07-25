const assert = require("node:assert/strict");
const ui = require("../budget-ui.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("escapeHtml escapes text for templates", () => {
  assert.equal(ui.escapeHtml(`<tag a="b">'&</tag>`), "&lt;tag a=&quot;b&quot;&gt;&#039;&amp;&lt;/tag&gt;");
});

test("pluralize and capitalize keep UI text helpers predictable", () => {
  assert.equal(ui.pluralize(1, "ticket", "tickets"), "ticket");
  assert.equal(ui.pluralize(2, "ticket", "tickets"), "tickets");
  assert.equal(ui.capitalize("green"), "Green");
});

test("cssEscape has a fallback for quoted selectors", () => {
  const originalCss = globalThis.CSS;
  try {
    globalThis.CSS = undefined;
    assert.equal(ui.cssEscape('a"b\\c'), 'a\\"b\\\\c');
  } finally {
    globalThis.CSS = originalCss;
  }
});
