# FI Requirements Workbench

Single-page React frontend plus a thin FastAPI/OpenAI backend for an agent-assisted requirements workflow. The UI keeps session state in the browser, sends the full request context to two stateless backend endpoints, renders Markdown, collects selected-text comments, and shows local diffs between revisions.

The application source lives in `frontend/`.

## Stack

- React 19 + Vite + TypeScript
- Python 3.13 + FastAPI
- OpenAI Python SDK via the Responses API
- `react-markdown` + `remark-gfm`
- Zod for webhook validation
- Vitest + Testing Library
- Docker + Nginx + Docker Compose
- stateless webhook-style agent endpoints

## Run locally

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- App: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`

## Agent contract

The backend serves two active endpoints:

- `POST /webhook/discovery-agent`
- `POST /webhook/revision-agent`
- `POST /sessions/{session_id}/export-json`

Their expected payloads and outputs are documented in:

- `docs/n8n-agent-contract.md`
- `docs/n8n-agent-test-cases.md`

## Local dev without Docker

```bash
export OPENAI_API_KEY=your_key_here

cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd ../frontend
npm install
npm run dev
```

## Contract changes and build visibility

If you change the webhook request/response contract, rebuild both services so the running frontend bundle and backend schema stay aligned:

```bash
docker compose up --build
```

To identify the running backend build from outside the container, set `BACKEND_BUILD_ID` before starting Compose. The backend exposes it in `GET /health` and the `X-Build-Id` response header.

## Saving requirement JSON

The review screen includes a manual `Save JSON` action. It persists the full current session snapshot for later Jira generation to:

- host path: `./data/requirements/<session_id>.json`
- container path: `/app/data/requirements/<session_id>.json`

The saved file includes the session state, latest revision, latest markdown, and change summary in one stable JSON document.
