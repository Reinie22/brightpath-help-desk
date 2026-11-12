require("dotenv").config();
const path = require("path");
const express = require("express");
const { answerQuestion, UNAVAILABLE_TEXT } = require("./lib/assistant");

const MAX_QUESTION_LENGTH = 500;

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/ask", async (req, res) => {
  const body = req.body || {};
  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({
      status: "error",
      message: `Please enter a question of 1 to ${MAX_QUESTION_LENGTH} characters.`,
    });
  }

  try {
    const result = await answerQuestion(question, {
      simulateFailure: body.simulateFailure === true,
    });
    const code = result.status === "error" ? 503 : 200;
    return res.status(code).json(result);
  } catch (err) {
    // Unexpected bug: log it, but still show the safe message.
    console.error("[server] unexpected error:", err);
    return res.status(503).json({
      status: "error",
      message: UNAVAILABLE_TEXT,
    });
  }
});

// Malformed JSON bodies end up here.
app.use((err, req, res, next) => {
  if (err && err.status === 400) {
    return res.status(400).json({ status: "error", message: "Invalid request body." });
  }
  return next(err);
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Help desk running on http://localhost:${port}`));
