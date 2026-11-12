require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { answerQuestion, UNAVAILABLE_TEXT } = require("../lib/assistant");

const Q1 = "When is the group coaching session?";

// Each case: what we ask, what we expect, and a check on the real output.
const CASES = [
  {
    question: Q1,
    opts: {},
    expected: "status answered, sources include doc2",
    check: (r) => r.status === "answered" && r.sources.some((s) => s.id === "doc2"),
  },
  {
    question: "What is the refund policy?",
    opts: {},
    expected: "status not_found, sources empty",
    check: (r) => r.status === "not_found" && r.sources.length === 0,
  },
  {
    question: Q1,
    opts: { simulateFailure: true },
    expected: `status error, message "${UNAVAILABLE_TEXT}"`,
    check: (r) => r.status === "error" && r.message === UNAVAILABLE_TEXT,
  },
];

function toMarkdown(report) {
  const lines = [
    "# Test results",
    "",
    `- Timestamp: ${report.timestamp}`,
    `- Model: ${report.model}`,
    "",
  ];
  report.results.forEach((r, i) => {
    lines.push(
      `## Case ${i + 1}: ${r.pass ? "PASS" : "FAIL"}`,
      "",
      `- Question: ${r.question}${r.simulateFailure ? " (simulateFailure: true)" : ""}`,
      `- Expected: ${r.expected}`,
      "- Actual:",
      "",
      "```json",
      JSON.stringify(r.actual, null, 2),
      "```",
      ""
    );
  });
  return lines.join("\n");
}

async function main() {
  const results = [];
  for (const c of CASES) {
    const actual = await answerQuestion(c.question, c.opts);
    results.push({
      question: c.question,
      simulateFailure: c.opts.simulateFailure === true,
      expected: c.expected,
      actual,
      pass: c.check(actual),
    });
  }

  const report = {
    timestamp: new Date().toISOString(),
    model: process.env.LLM_MODEL || "(not set)",
    results,
  };

  const dir = path.join(__dirname, "..", "results");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "results.json"), JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "results.md"), toMarkdown(report));

  results.forEach((r, i) => console.log(`Case ${i + 1}: ${r.pass ? "PASS" : "FAIL"}`));
  if (results.some((r) => !r.pass)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
