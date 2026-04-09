# FI Requirements Workbench

Single-page React frontend for an agent-assisted requirements workflow. The UI keeps session state in the browser, talks to two n8n webhooks, renders Markdown, collects selected-text comments, and shows local diffs between revisions.

The application source lives in `frontend/`.

## Stack

- React 19 + Vite + TypeScript
- `react-markdown` + `remark-gfm`
- Zod for webhook validation
- Vitest + Testing Library
- Docker + Nginx + Docker Compose
- n8n for the `discovery-agent` and `revision-agent` webhook flows

## Run locally

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- App: `http://localhost:3000`
- n8n: `http://localhost:5678`

## n8n contract

Create or import two active n8n webhooks:

- `POST /webhook/discovery-agent`
- `POST /webhook/revision-agent`

Their expected payloads and outputs are documented in:

- `docs/n8n-agent-contract.md`
- `docs/n8n-agent-test-cases.md`

## Local dev without Docker

```bash
cd frontend
npm install
npm run dev
```
