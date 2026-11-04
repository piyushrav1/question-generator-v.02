# API Reference

Base URL for local development: `http://127.0.0.1:4000`

## Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "service": "TestMeMan API"
}
```

## Generate Question

```http
POST /api/questions/generate
Content-Type: application/json
```

```json
{
  "topic": "arrays",
  "difficulty": "medium"
}
```

## Get Question

```http
GET /api/questions/:id
```

Hidden test cases do not expose expected output.

## Create Submission

```http
POST /api/submissions
Content-Type: application/json
```

```json
{
  "questionId": "demo-question",
  "language": "Python",
  "code": "def smallest_missing_positive(nums):\n    return 1",
  "submitted": true
}
```

`language` must be one of: `Python`, `JavaScript`, `Java`, or `C++`.

## Get Hint

```http
POST /api/questions/:id/hints
```

## Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": {}
  }
}
```
