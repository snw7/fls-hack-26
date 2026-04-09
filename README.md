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
