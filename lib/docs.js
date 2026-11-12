const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.join(__dirname, "..", "docs");

// Fixed titles: the UI shows these, so they must not depend on file content.
const TITLES = {
  doc1: "Document 1 — Getting started",
  doc2: "Document 2 — Coaching and feedback",
  doc3: "Document 3 — Account help",
};

// Loads docs/*.txt into [{ id, title, text }], in id order.
function loadDocs(dir = DOCS_DIR) {
  return Object.keys(TITLES).map((id) => {
    const file = path.join(dir, `${id}.txt`);
    const text = fs.readFileSync(file, "utf8").trim();
    return { id, title: TITLES[id], text };
  });
}

module.exports = { loadDocs, TITLES };
