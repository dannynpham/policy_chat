# PolicyChat

PolicyChat is a small retrieval-augmented generation demo. Upload multiple insurance policy PDFs and ask questions answered from all uploaded policies, such as a home policy and a trading-card policy together.

The app includes upload validation, hosted retrieval, returned file citations, blocked-request escalation, simulated live-agent handoff, and loading states for long-running operations.

## Run locally

Requirements: Node.js 20+ and an OpenAI API key with access to the Responses API and hosted Vector Stores.

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | Server-side key used for Files, Vector Stores, and Responses API calls. |

The key is read only in server code. Never put a real key in `.env.example` or client-side code.

## How the RAG flow works

1. `POST /api/documents` accepts one PDF up to 4 MB per upload and rejects other file types. The limit keeps multipart requests within Vercel Function limits.
2. The server uploads the file through the OpenAI Files API, creates a temporary Vector Store, and attaches the file with `vectorStores.files.createAndPoll`.
3. The indexed document is classified through the Responses API. Non-policy documents are deleted and rejected before they are returned to the browser.
4. The API waits for classification and indexing to complete before returning the Vector Store ID and file metadata.
5. The browser stores a list of policy records in localStorage so multiple policies survive a refresh.
6. `POST /api/chat` sends the question to the Responses API with `file_search` scoped to every uploaded policy's Vector Store, so a home policy and a trading-card policy can be queried together.
7. The server returns the model answer and the file citations returned by OpenAI. The client maps each citation's file ID to the uploaded policy name and does not create page numbers or other citations.
8. `DELETE /api/documents` can remove one policy or clean up all stored Vector Stores and uploaded Files, then the browser clears the relevant local session.

## Human review and reliability

- Questions containing configured instruction-control terms such as `override`, `ignore`, or `bypass` are stopped before the OpenAI request and returned with `blocked: true` and `reason: "blocked_term"`.
- Answers are marked for human review only when the assistant explicitly indicates that the policy content is insufficient. Normal greetings and uncited conversational responses do not automatically escalate.
- The UI provides a simulated live-agent handoff for flagged answers.
- Chat requests use `AbortController`, prevent duplicate submissions, cancel on a new conversation, and ignore expected cancellation errors.
- A **New conversation** action clears messages without deleting uploaded policies.
- Uploading/classifying/indexing, individual deletion, clear-all deletion, and answer generation show loading indicators.

OpenAI manages PDF parsing, chunking, embeddings, vector storage, and retrieval. This version uses hosted retrieval because it keeps the first implementation small, avoids an external database, and uses the platform's maintained File Search pipeline.

## Future PostgreSQL and pgvector version

A future version could store documents, chunks, embeddings, and user/session ownership in PostgreSQL with `pgvector`. That would enable custom chunking, metadata filtering, similarity thresholds, document isolation, and retrieval evaluation. It would also require owning ingestion, embedding generation, migrations, indexing, cleanup, and operational monitoring instead of delegating those concerns to OpenAI hosted retrieval.

## Project shape

- `app/page.tsx`: composition-only page shell
- `components/PolicySidebar.tsx`: upload, policy list, cleanup, and suggestions
- `components/ChatPanel.tsx`: conversation, citations, escalation, and composer UI
- `components/LoadingSpinner.tsx`: accessible CSS loading indicator
- `hooks/usePolicyDocuments.ts`: document persistence and upload/delete state
- `hooks/usePolicyChat.ts`: question state, chat requests, scrolling, and handoff state
- `lib/api/`: typed browser request helpers for the API routes
- `lib/server/document-processing.ts`: server-only indexing, policy classification, and OpenAI cleanup
- `lib/policy-classification.ts`: strict classification response parsing
- `lib/escalation.ts`: blocked-term and insufficient-answer detection
- `app/api/documents/route.ts`: PDF upload, indexing, and cleanup
- `app/api/chat/route.ts`: Responses API calls
- `lib/validation.ts`: API input validation
- `lib/citations.ts`: extraction of returned file citations
- `tests/`: focused validation and citation tests

## Deploy to Vercel

1. Import this repository into Vercel and keep the framework preset as **Next.js**.
2. Add `OPENAI_API_KEY` as an environment variable for Production, Preview, and Development as needed.
3. Deploy. Vercel detects the Next.js build and serves the API routes as Node.js Functions.

The API routes declare a 60-second maximum duration for OpenAI retrieval and document indexing. Vercel plan limits still apply.
