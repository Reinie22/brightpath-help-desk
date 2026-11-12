// Thin wrapper around any OpenAI-compatible /chat/completions endpoint.

class ModelError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "ModelError";
    this.cause = cause;
  }
}

// Read env at call time so tests and dotenv can change it.
function getConfig() {
  const baseUrl = (process.env.LLM_BASE_URL || "").replace(/\/+$/, "");
  const model = process.env.LLM_MODEL || "";
  if (!baseUrl || !model) {
    throw new ModelError("Missing config: set LLM_BASE_URL and LLM_MODEL");
  }
  return {
    baseUrl,
    model,
    apiKey: process.env.LLM_API_KEY || "", // blank is fine for Ollama
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 15000,
  };
}

// One HTTP call. The timer also covers reading the body, so a stalled
// response cannot hang us.
async function postChat(cfg, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  try {
    const headers = { "Content-Type": "application/json" };
    if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    if (err.name === "AbortError") {
      throw new ModelError(`Model request timed out after ${cfg.timeoutMs} ms`, err);
    }
    throw new ModelError(`Network error: ${err.message}`, err);
  } finally {
    clearTimeout(timer);
  }
}

function extractContent(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new ModelError("Model returned a non-JSON HTTP body", err);
  }
  const content = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : "";
  if (typeof content !== "string" || !content.trim()) {
    throw new ModelError("Model returned an empty response");
  }
  return content;
}

// Returns the model's reply text. Throws ModelError on any failure.
async function callModel(messages, opts = {}) {
  // Checked first so a simulated failure never touches the network.
  if (process.env.SIMULATE_FAILURE === "1" || opts.simulateFailure === true) {
    throw new ModelError("Simulated model failure");
  }

  const cfg = getConfig();
  const body = {
    model: cfg.model,
    messages,
    temperature: 0,
    response_format: { type: "json_object" },
  };

  let result = await postChat(cfg, body);

  // Some providers reject JSON mode with a 4xx. Retry once without it;
  // the prompt and parser still cope with plain text.
  if (!result.ok && (result.status === 400 || result.status === 422)) {
    delete body.response_format;
    result = await postChat(cfg, body);
  }

  if (!result.ok) {
    throw new ModelError(`Model returned HTTP ${result.status}: ${result.text.slice(0, 200)}`);
  }
  return extractContent(result.text);
}

module.exports = { callModel, ModelError };
