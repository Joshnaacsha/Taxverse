# RegimeIQ
The AI Tax Decision Engine

## Run (local)

### Backend (Fastify + LangGraph)
- `cd RegimeIQ/backend`
- Create `.env` from `RegimeIQ/backend/.env.example` and set `GOOGLE_API_KEY` (only needed if you enable AI).
- Install: `npm install`
- Dev server: `npm run dev` (defaults to `http://localhost:3001`)
- API:
  - `GET /health`
  - `POST /analyze` body:
    - India example:
      - `{ "country": "IN", "input": { "annualSalary": 720000, "otherIncome": 0, "deductions80C": 0, "hra": 0, "homeLoanInterest": 0, "nps": 0 }, "options": { "includeAi": true, "projectionYears": 5, "projectionGrowthRatePct": 10, "scenarioCount": 8 } }`
    - US example:
      - `{ "country": "US", "input": { "annualIncome": 90000, "otherIncome": 5000, "filingStatus": "SINGLE", "itemizedDeductions": 0 }, "options": { "includeAi": true } }`
    - Supported `country`: `IN`, `US`, `UK`, `SG`, `AE` (all simplified estimators)
  - `POST /qa` body:
    - `{ "context": { "...": "use the /analyze response" }, "question": "Why is the recommended regime better?", "history": [{ "role": "user", "content": "..." }] }`

### Frontend (Next.js)
- `cd RegimeIQ/frontend`
- (Optional) create `.env.local` from `RegimeIQ/frontend/.env.local.example`
- Install: `npm install`
- Dev server: `npm run dev` (open `http://localhost:3000`)

## Notes
- This is a hackathon demo project; calculations are simplified (example: HRA is treated as a direct exemption).
- Do not commit real API keys; keep `.env` local.
