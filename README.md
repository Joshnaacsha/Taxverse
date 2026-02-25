# Taxverse

AI-assisted tax decision and filing-readiness platform for India, US, UK, Singapore, and UAE.

Taxverse combines:
- deterministic tax computation,
- multi-year projection and scenario simulation,
- LLM-powered explanation/Q&A,
- India salary-slip parsing,
- India ITR draft prefill + preview/download flow.

---

## 1. Monorepo Structure

```text
Taxverse/
  backend/   # Fastify + LangGraph + tax engines
  frontend/  # Next.js app
```

---

## 2. Core Features

- Multi-country tax analysis: `IN`, `US`, `UK`, `SG`, `AE`
- India salary workflow:
  - upload payslip PDF and auto-extract values
  - manual salary + deduction entry
  - TDS planning
- AI insights split by intent:
  - `thisYearActions`
  - `nextYearPlanning`
- Q&A grounded in user analysis context
- India ITR Draft Pack:
  - generated from existing analysis/salary data
  - preview in UI
  - download JSON / text summary
  - print/save PDF

---

## 3. Tech Stack

### Frontend
- Next.js 16 (React 19, TypeScript)
- Tailwind CSS
- Recharts + Chart.js
- Motion / Lucide

### Backend
- Fastify
- LangGraph
- Zod validation
- Google Gemini via `@langchain/google-genai`
- `pdf-parse` for payslip parsing

---

## 4. Local Setup

## Prerequisites
- Node.js 20+ recommended
- npm

## Clone and install

```bash
git clone <your-repo-url>
cd Taxverse
```

### Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3001
HOST=0.0.0.0
GOOGLE_API_KEY=your_key_here   # optional but required for AI insights/Q&A
```

Run backend:

```bash
npm run dev
```

Backend runs at `http://localhost:3001`.

### Frontend setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

Run frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## 5. Scripts

### Backend (`backend/package.json`)
- `npm run dev` - start dev server with `ts-node-dev`
- `npm run build` - compile TypeScript to `dist/`
- `npm start` - run built server

### Frontend (`frontend/package.json`)
- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm start` - run production server
- `npm run lint` - run ESLint

---

## 6. API Reference

Base URL: `http://localhost:3001`

### `GET /health`
Health check.

### `POST /analyze`
Multi-country tax analysis.

India example:

```json
{
  "country": "IN",
  "input": {
    "annualSalary": 720000,
    "otherIncome": 0,
    "deductions80C": 0,
    "hra": 0,
    "homeLoanInterest": 0,
    "nps": 0
  },
  "options": {
    "includeAi": true,
    "projectionYears": 5,
    "projectionGrowthRatePct": 10,
    "scenarioCount": 8
  }
}
```

US example:

```json
{
  "country": "US",
  "input": {
    "annualIncome": 90000,
    "otherIncome": 5000,
    "filingStatus": "SINGLE",
    "itemizedDeductions": 0
  },
  "options": {
    "includeAi": true
  }
}
```

### `POST /salary/analyze`
India salary breakdown + derived tax analysis.

### `POST /payslip/parse`
Parse text-based PDF payslip.

### `POST /qa`
Context-grounded AI Q&A.

```json
{
  "context": { "report": {}, "insights": {}, "projection": {} },
  "question": "Why is this recommendation better?",
  "history": [{ "role": "user", "content": "..." }]
}
```

### `POST /prefill`
Generate India ITR-style draft payload.

```json
{
  "country": "IN",
  "input": {
    "annualSalary": 720000,
    "otherIncome": 0,
    "deductions80C": 60000,
    "hra": 0,
    "homeLoanInterest": 0,
    "nps": 50000
  },
  "personal": {
    "fullName": "Asha Rao",
    "pan": "ABCDE1234F",
    "dateOfBirth": "1995-05-10"
  }
}
```

---

## 7. Product Flow

1. User enters salary/tax inputs (or uploads payslip in India mode)
2. Backend computes deterministic tax options and recommendation
3. Projection and scenario simulation are generated
4. AI agent explains recommendation and outputs:
   - summary
   - stability
   - future warning
   - this-year actions
   - next-year planning
5. User can ask follow-up questions in Q&A
6. In ITR Guide, user generates Draft Pack and downloads artifacts

---

## 8. Current Assumptions and Scope

- This is a decision-support tool, not an official filing engine.
- Country models are intentionally simplified estimators.
- India calculations include practical shortcuts for hackathon speed.
- AI outputs are constrained by prompt + schema but must still be user-reviewed.

---

## 9. Troubleshooting

- AI fields empty / disabled:
  - Ensure `GOOGLE_API_KEY` is set in `backend/.env`.
- CORS/Network errors:
  - Confirm backend is running on `http://localhost:3001`.
  - Confirm `NEXT_PUBLIC_BACKEND_URL` matches backend URL.
- Payslip parsing weak:
  - Use text-based PDFs; scanned/image PDFs may parse poorly.
- Hydration warnings in Next dev:
  - hard refresh browser
  - restart `npm run dev` in frontend after major UI refactors

---

## 10. Security and Privacy Notes

- Never commit real API keys.
- Keep `.env` and `.env.local` local-only.
- Do not upload real sensitive payroll/PII in shared demo environments.

---

## 11. Suggested Demo Narrative (Hackathon)

- Start on Landing -> Salary (India)
- Upload payslip or show manual mode with prefilled sample inputs
- Run analysis -> show recommendation + savings + trend chart
- Open Insights -> show this-year vs next-year action split
- Open Q&A -> ask a practical scenario question
- Open ITR Guide -> generate Draft Pack -> download summary / print PDF

This sequence makes Taxverse clearly more than a chat wrapper: deterministic engine + explainability + workflow outputs.
