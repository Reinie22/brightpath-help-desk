# BrightPath Learn help desk

A small web app: type a question, get an answer drawn only from three
supplied documents, with the supporting document shown. If the documents
don't answer it, you get a fixed "contact support" message instead.

**Full step-by-step instructions are in [INSTALL.md](INSTALL.md).**

## Requirements

- Node 20 or newer
- Any OpenAI-compatible chat completions endpoint. The default setup is
  local [Ollama](https://ollama.com) with the `qwen2.5:7b` model (free, no
  API key).

## Quick start

1. Install Ollama and run `ollama pull qwen2.5:7b`
2. Copy the env file: `cp .env.example .env` (already set up for Ollama)
3. `npm install`
4. `npm start`, then open http://localhost:3000

## How answers stay grounded

- The model is told to answer only from the three documents and to reply in
  a fixed JSON shape. Answers with no valid document source become
  "not found".
- Times are never converted. Asked for a time in another time zone, it gives
  the UTC time exactly as the documents state it.
- A code check rejects any clock time (e.g. `12:00`) in an answer that
  doesn't appear in the cited document. The model gets one corrective retry;
  if it is still wrong, the user gets the "not found" message rather than a
  made-up time.
- The question is treated as untrusted input, so instructions inside it
  (e.g. "ignore your instructions") are ignored.

## Tests

`npm test` runs the three required cases directly (no server needed). It
exits with a non-zero code if any case fails.

## Triggering a failure

Tick "Simulate API failure" in the page, or start the server with
`SIMULATE_FAILURE=1`. The user sees a generic "unavailable" message; the
real cause is logged on the server only.

## Results

`results/results.md` and `results/results.json` (written by `npm test`).
