# Test results

- Timestamp: 2026-11-12T16:39:10.488Z
- Model: qwen2.5:7b

## Case 1: PASS

- Question: When is the group coaching session?
- Expected: status answered, sources include doc2
- Actual:

```json
{
  "status": "answered",
  "answer": "Group coaching sessions run every Thursday at 17:00 UTC and last 45 minutes.",
  "sources": [
    {
      "id": "doc2",
      "title": "Document 2 — Coaching and feedback"
    }
  ]
}
```

## Case 2: PASS

- Question: What is the refund policy?
- Expected: status not_found, sources empty
- Actual:

```json
{
  "status": "not_found",
  "answer": "That information isn't available in the supplied documents. Please contact support@brightpath.example (Monday to Friday, 09:00–17:00 UTC).",
  "sources": []
}
```

## Case 3: PASS

- Question: When is the group coaching session? (simulateFailure: true)
- Expected: status error, message "The assistant is unavailable right now. Please try again in a moment, or contact support@brightpath.example."
- Actual:

```json
{
  "status": "error",
  "message": "The assistant is unavailable right now. Please try again in a moment, or contact support@brightpath.example."
}
```
