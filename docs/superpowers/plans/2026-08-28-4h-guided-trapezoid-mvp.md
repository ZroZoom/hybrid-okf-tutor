# Four-Hour Guided Trapezoid MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a public 60-second walkthrough in which the tutor guides a student through one trapezoid-area problem without revealing the final answer before the student's attempt.

**Architecture:** A Next.js Route Handler calls `gpt-5.6-luna` only for strict intent/emotional classification, then reads educational facts through the two-operation `OkfRepository`. A deterministic state machine validates the student's formula, substitution, and result; the browser owns only non-sensitive ephemeral walkthrough state.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, pnpm, Vitest, Testing Library, Zod, OpenAI Responses API, Supabase Edge Functions, Vercel, GitHub Actions hosted `ubuntu-latest`.

**Spec:** `docs/superpowers/specs/2026-08-28-4h-guided-trapezoid-mvp-design.md`

## Global Constraints

- Primary model is exactly `gpt-5.6-luna` through OpenAI Responses API with reasoning effort `low` and strict Structured Outputs.
- LLM interprets language and emotional signal; it never supplies mathematical facts.
- `OkfRepository` exposes exactly `searchConcepts(query, subject, level)` and `getConcept(conceptId, level)`.
- The browser never receives `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, raw prompts, or raw database rows.
- Draft/pending knowledge is displayed as `DEV/UNREVIEWED`; production remains published-only after the hackathon.
- No auth, profiles, persistence, diagnosis, exercise generator, CAS, MCP, model fallback, or additional demo problem.
- A minimal deterministic crisis short-circuit precedes the educational flow.
- CI uses standard GitHub-hosted `ubuntu-latest`; there are no self-hosted runners.
- Keep the existing 10x toolkit ignore entries when extending `.gitignore`.

---

## File map

```text
.github/workflows/ci.yml                 pull-request quality gate
src/app/api/tutor/route.ts               production dependency wiring
src/app/api/tutor/handler.ts             testable request orchestration
src/app/layout.tsx                       page metadata and shell
src/app/page.tsx                         walkthrough page
src/app/globals.css                      small responsive visual layer
src/components/tutor-demo.tsx            browser walkthrough state and requests
src/components/task-card.tsx             fixed trapezoid problem
src/components/trace-panel.tsx           Luna → OKF → deterministic trace
src/domain/intent.ts                      strict Luna output type
src/domain/okf.ts                         two-operation OKF contract
src/domain/safety-policy.ts               deterministic safety decision
src/domain/walkthrough.ts                 four-state tutoring machine
src/infrastructure/okf/http-okf-repository.ts  server-only Edge Function client
src/infrastructure/openai/intent-interpreter.ts Luna Responses API adapter
src/lib/env.ts                            server environment validation
src/test/fixtures/okf.ts                  public-contract OKF fixtures
src/test/setup.ts                         DOM test setup
```

Tasks 1–2 are person B's first lane. The private Edge Function part of Task 3 is person A's parallel lane. Task 4 begins as soon as Task 2 is green; live integration waits only for Task 3's smoke result.

### Task 1: Bootstrap the app and hosted CI

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/test/setup.ts`
- Create: `src/lib/env.ts`, `src/lib/__tests__/env.test.ts`, `.env.example`, `.github/workflows/ci.yml`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `getServerEnv(): ServerEnv`
- Produces scripts: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`

- [ ] **Step 1: Create the minimal package and TypeScript configuration**

Use these scripts and dependency floors in `package.json`:

```json
{
  "private": true,
  "packageManager": "pnpm@11.17.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^16.0.0",
    "openai": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "server-only": "^0.0.1",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0",
    "jsdom": "^27.0.0",
    "typescript": "^5.9.0",
    "vitest": "^4.0.0"
  }
}
```

Add TypeScript strict mode, the `@/*` → `src/*` alias, App Router defaults, jsdom for component tests, and `src/test/setup.ts` as the Vitest setup file. Run `pnpm install` to generate the lockfile.

- [ ] **Step 2: Write the failing server-environment test**

```ts
it("rejects missing server secrets", () => {
  expect(() => getServerEnv({})).toThrow();
});

it("returns only the four server values", () => {
  expect(getServerEnv(validEnv)).toEqual({
    OPENAI_API_KEY: "test-openai",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
    OKF_EDGE_FUNCTION_URL: "https://example.supabase.co/functions/v1/hybrid-okf-dev"
  });
});
```

- [ ] **Step 3: Run the environment test and verify RED**

Run: `pnpm exec vitest run src/lib/__tests__/env.test.ts`

Expected: FAIL because `getServerEnv` does not exist.

- [ ] **Step 4: Implement server-only Zod validation**

```ts
import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OKF_EDGE_FUNCTION_URL: z.url()
}).strict();

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export const getServerEnv = (source: NodeJS.ProcessEnv = process.env): ServerEnv =>
  serverEnvSchema.parse({
    OPENAI_API_KEY: source.OPENAI_API_KEY,
    SUPABASE_URL: source.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
    OKF_EDGE_FUNCTION_URL: source.OKF_EDGE_FUNCTION_URL
  });
```

`.env.example` contains the four empty variable names. Extend `.gitignore` with `node_modules/`, `.next/`, `coverage/`, `.env*`, and `!.env.example` without deleting the toolkit rules.

- [ ] **Step 5: Add the hosted CI workflow**

Create a single job named `Quality`:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
permissions:
  contents: read
concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
jobs:
  quality:
    name: Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@v4
        with:
          run_install: false
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
```

- [ ] **Step 6: Verify the bootstrap and commit**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`

Expected: all commands exit 0.

Commit: `chore: bootstrap guided tutor app and CI`

### Task 2: Build the deterministic walkthrough domain

**Files:**
- Create: `src/domain/okf.ts`, `src/domain/walkthrough.ts`
- Create: `src/domain/__tests__/walkthrough.test.ts`, `src/test/fixtures/okf.ts`

**Interfaces:**
- Produces: `OkfRepository.searchConcepts(query: string, subject: string, level: string | null): Promise<ConceptSummary[]>`
- Produces: `OkfRepository.getConcept(conceptId: string, level: string | null): Promise<OkfConcept | null>`
- Produces: `advanceWalkthrough(input: WalkthroughInput): WalkthroughDecision`
- Produces: `TutorStage = "recall_formula" | "substitute_values" | "calculate" | "complete"`

- [ ] **Step 1: Define the exact public OKF types**

```ts
export type ReviewStatus = "draft" | "pending" | "approved" | "published";
export type ConceptSummary = { id: string; name: string; subject: string; reviewStatus: ReviewStatus };
export type OkfAtom = { id: string; type: string; text: string; reviewStatus: ReviewStatus };
export type OkfLinkedEntity = { id: string; reviewStatus: ReviewStatus };
export type OkfConcept = {
  id: string;
  name: string;
  reviewStatus: ReviewStatus;
  atoms: OkfAtom[];
  relations: OkfLinkedEntity[];
  curriculum: OkfLinkedEntity[];
  skills: OkfLinkedEntity[];
};
export interface OkfRepository {
  searchConcepts(query: string, subject: string, level: string | null): Promise<ConceptSummary[]>;
  getConcept(conceptId: string, level: string | null): Promise<OkfConcept | null>;
}
```

The Edge Function may map private database columns into this contract; no private schema names enter the public repo.

- [ ] **Step 2: Write failing tests for the three student checkpoints**

Use an OKF fixture whose formula atom text is `P = ((a + b) * h) / 2` and task data `{ a: 6, b: 10, h: 4, expectedResult: 32 }`.

```ts
expect(advanceWalkthrough(input("recall_formula", "P=(a+b)*h/2"))).toMatchObject({
  nextStage: "substitute_values",
  correctness: "correct"
});
expect(advanceWalkthrough(input("substitute_values", "(6+10)*4/2"))).toMatchObject({
  nextStage: "calculate",
  correctness: "correct"
});
expect(advanceWalkthrough(input("calculate", "32 cm²"))).toMatchObject({
  nextStage: "complete",
  correctness: "correct"
});
```

Add one wrong answer per stage and assert that the stage does not advance, `correctness` is `incorrect`, and the reply contains a question rather than the final numeric answer.

- [ ] **Step 3: Run the walkthrough test and verify RED**

Run: `pnpm exec vitest run src/domain/__tests__/walkthrough.test.ts`

Expected: FAIL because the state machine is not implemented.

- [ ] **Step 4: Implement the smallest four-state machine**

```ts
export type TutorSession = {
  taskId: "trapezoid-area-1";
  conceptId: string;
  stage: TutorStage;
  hintLevel: 0 | 1;
};

export type WalkthroughDecision = {
  nextStage: TutorStage;
  correctness: "correct" | "incorrect" | "unrecognized";
  reply: string;
  hintLevel: 0 | 1;
};
```

Extract and normalize the right-hand side of the selected OKF formula atom before comparing it with the student's normalized formula. Do not store a second canonical trapezoid formula in application code. Accept only the prepared substitution and `32`, `32 cm2`, or `32 cm²` for the later checkpoints. Wrong answers receive one question-shaped hint and never include `32`.

- [ ] **Step 5: Verify GREEN and commit**

Run: `pnpm exec vitest run src/domain/__tests__/walkthrough.test.ts`

Expected: PASS for correct, incorrect, and unrecognized answers at all stages.

Commit: `feat: add deterministic trapezoid walkthrough`

### Task 3: Connect the two-operation OKF boundary

**Files:**
- Create: `src/infrastructure/okf/http-okf-repository.ts`
- Create: `src/infrastructure/okf/__tests__/http-okf-repository.test.ts`

**Interfaces:**
- Consumes: `OkfRepository`, `ServerEnv`
- Produces: `HttpOkfRepository implements OkfRepository`

- [ ] **Step 1 — person A: verify and deploy the private Edge Function**

In the private Supabase environment, confirm that the live trapezoid concept has a formula atom usable at level `E8`. Deploy `hybrid-okf-dev` with `verify_jwt=true`, POST-only JSON, 64 KB body limit, 200-character query limit, subject allowlist `matematyka`, maximum eight search results, and service-role-only authorization.

The request bodies are exactly:

```json
{ "operation": "searchConcepts", "query": "trapez", "subject": "matematyka", "level": "E8" }
```

```json
{ "operation": "getConcept", "conceptId": "trapez-id", "level": "E8" }
```

At runtime, replace `trapez-id` with the exact ID returned by the preceding search. The response maps into the public types from Task 2 and carries review status on the concept, every atom, and every linked entity. No SQL, schema dump, service key, or private function source is copied into this repo.

- [ ] **Step 2 — person A: run positive and negative smoke checks**

Authenticated search must return 1–8 results including trapezoid. Authenticated get must return at least one formula atom. Missing authorization and anon authorization must return 401 or 403. Send person B only the endpoint URL and secrets through the approved secret channel, never chat or Git.

- [ ] **Step 3 — person B: write failing HTTP client tests**

Mock `fetch` and assert:

```ts
await repository.searchConcepts("trapez", "matematyka", "E8");
expect(fetch).toHaveBeenCalledWith(edgeUrl, expect.objectContaining({
  method: "POST",
  headers: expect.objectContaining({ Authorization: "Bearer test-service-role" }),
  body: JSON.stringify({ operation: "searchConcepts", query: "trapez", subject: "matematyka", level: "E8" })
}));
```

Add tests that an unknown response field, missing atom status, non-2xx response, or operation other than the two interface methods fails closed.

- [ ] **Step 4: Run the repository test and verify RED**

Run: `pnpm exec vitest run src/infrastructure/okf/__tests__/http-okf-repository.test.ts`

Expected: FAIL because `HttpOkfRepository` does not exist.

- [ ] **Step 5: Implement and validate the HTTP repository**

Use Zod `.strict()` schemas for both responses. Instantiate the client only in server code with `getServerEnv()`. Never return its headers or raw upstream error body.

Run: `pnpm exec vitest run src/infrastructure/okf/__tests__/http-okf-repository.test.ts`

Expected: PASS.

Commit: `feat: add narrow OKF repository client`

### Task 4: Add Luna orchestration and the safety gate

**Files:**
- Create: `src/domain/intent.ts`, `src/domain/safety-policy.ts`
- Create: `src/domain/__tests__/safety-policy.test.ts`
- Create: `src/infrastructure/openai/intent-interpreter.ts`
- Create: `src/infrastructure/openai/__tests__/intent-interpreter.test.ts`
- Create: `src/app/api/tutor/handler.ts`, `src/app/api/tutor/route.ts`
- Create: `src/app/api/tutor/handler.test.ts`

**Interfaces:**
- Produces: `IntentInterpreter.interpret(message: string, stage: TutorStage | "start"): Promise<StudentIntent>`
- Produces: `createTutorHandler(deps: TutorDependencies): (request: Request) => Promise<Response>`
- Consumes: `OkfRepository`, `advanceWalkthrough`, `getServerEnv`

- [ ] **Step 1: Define and test the strict intent schema**

```ts
export const studentIntentSchema = z.object({
  subject: z.enum(["matematyka"]).nullable(),
  level: z.enum(["E8"]).nullable(),
  intent: z.enum(["definition", "formula", "example", "relation", "other"]),
  concepts: z.array(z.string()).max(3),
  requestedAnswerType: z.enum(["definition", "formula", "example", "explanation"]).nullable(),
  ambiguity: z.boolean(),
  missingEntity: z.string().nullable(),
  rewrittenQuery: z.string().max(200),
  emotionalSignal: z.enum(["none", "frustration", "discouragement", "distress", "crisis"]),
  responseMode: z.enum(["normal", "supportive", "safety"])
}).strict();
```

Test valid output, a missing property, an additional property, and an unknown enum. Run the test first and expect RED.

- [ ] **Step 2: Implement the Luna adapter**

Use `client.responses.parse`, model `gpt-5.6-luna`, `reasoning: { effort: "low" }`, and the SDK's Zod strict-output helper. The system instruction is: classify the Polish message and emotional signal; never answer it and never add educational facts. Return `response.output_parsed`; throw on an absent parsed object. Do not log the message or full response.

The adapter test mocks `responses.parse` and asserts the exact model, low reasoning effort, and structured format.

- [ ] **Step 3: Write and implement the deterministic safety policy**

Tests must assert:

```ts
expect(decideSafety(crisisIntent)).toMatchObject({ continueEducationalFlow: false });
expect(decideSafety(crisisIntent).response).toContain("116 111");
expect(decideSafety(crisisIntent).response).toContain("112");
expect(decideSafety(normalIntent)).toEqual({ mode: "normal", continueEducationalFlow: true });
```

The crisis copy is constant application text and stops before any OKF call. Supportive mode adds one short constant prefix and continues.

- [ ] **Step 4: Write failing handler tests for start, answer, and safety**

Start request:

```json
{ "action": "start", "message": "Chcę obliczyć pole trapezu" }
```

Answer request:

```json
{
  "action": "answer",
  "message": "P=(a+b)*h/2",
  "session": { "taskId": "trapezoid-area-1", "conceptId": "trapez-id", "stage": "recall_formula", "hintLevel": 0 }
}
```

Assert that start performs `searchConcepts` then `getConcept`, answer performs only `getConcept`, and crisis performs neither. Assert the response contains only `reply`, validated `session`, `reviewStatus`, and a trace with `intent`, concept name, atom type, and deterministic rule name.

- [ ] **Step 5: Implement the handler and production route**

Order every request as: parse Zod body → Luna interpretation → deterministic safety → OKF lookup → walkthrough decision → minimal response. Reject unknown task IDs, stages, concept IDs longer than 100 characters, messages longer than 500 characters, and malformed bodies with 400. Map upstream failures to a generic 502 without raw error data.

`route.ts` wires `OpenAiIntentInterpreter`, `HttpOkfRepository`, and `createTutorHandler`; all test injection remains in `handler.ts`. Construct environment-backed dependencies lazily inside `POST`, so `next build` and CI do not require runtime secrets.

- [ ] **Step 6: Run focused and full tests, then commit**

Run: `pnpm exec vitest run src/domain/__tests__/safety-policy.test.ts src/infrastructure/openai/__tests__/intent-interpreter.test.ts src/app/api/tutor/handler.test.ts`

Expected: all PASS.

Run: `pnpm test && pnpm typecheck`

Commit: `feat: orchestrate grounded tutor walkthrough`

### Task 5: Build the one-screen walkthrough UI

**Files:**
- Create: `src/components/tutor-demo.tsx`, `src/components/task-card.tsx`, `src/components/trace-panel.tsx`
- Create: `src/components/__tests__/tutor-demo.test.tsx`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: `POST /api/tutor` start and answer contracts from Task 4
- Produces: one public, responsive, keyboard-usable walkthrough

- [ ] **Step 1: Write the failing component test**

Mock fetch for the four successful turns. Assert the visible sequence:

```text
Rozpocznij demo
→ Jaki jest wzór na pole trapezu?
→ Jakie wartości podstawisz za a, b i h?
→ Wykonaj teraz obliczenie.
→ Dobrze — samodzielnie rozwiązałeś zadanie.
```

Also assert that the task data, `DEV/UNREVIEWED`, and trace labels `Luna`, `OKF`, `Reguła deterministyczna` are visible. Add an incorrect formula response and assert that `32` is not present in the tutor's reply.

- [ ] **Step 2: Run the component test and verify RED**

Run: `pnpm exec vitest run src/components/__tests__/tutor-demo.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the smallest demo-first UI**

Render one CTA, task card with a small inline SVG labelled „Trapez z podstawami 6 cm i 10 cm oraz wysokością 4 cm”, conversation, text input, submit button, and three stage-specific quick-answer chips. A chip only copies text into the input; submission still calls the real route. Disable duplicate submission while loading, move focus to the newest tutor message, and show a retryable generic error without technical details.

The trace panel displays only:

```text
Luna: formula · trapez
OKF: trapez · formula · DEV/UNREVIEWED
Reguła deterministyczna: recall_formula
```

Use CSS only; add no component library, animation package, analytics, or remote font.

- [ ] **Step 4: Verify responsive behavior and commit**

Run: `pnpm exec vitest run src/components/__tests__/tutor-demo.test.tsx`

Run: `pnpm lint && pnpm typecheck && pnpm build`

Expected: all commands exit 0; page remains usable at 375 px and desktop widths.

Commit: `feat: add guided tutor demo UI`

### Task 6: Deploy and enforce the demo gate

**Files:**
- Modify: `README.md`
- Create: `docs/demo/2026-08-28-runbook.md`

**Interfaces:**
- Consumes: green Tasks 1–5 and person A's live endpoint
- Produces: production URL, repeatable 60-second script, required GitHub check `Quality`

- [ ] **Step 1: Add the operator runbook**

Document the exact successful clicks and inputs:

```text
Rozpocznij demo
P=(a+b)*h/2
(6+10)*4/2
32 cm²
```

Add two negative probes: wrong formula must not reveal `32`; a crisis fixture must stop educational flow and show 116 111 plus 112.

- [ ] **Step 2: Run the local release gate**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`

Run a tracked-file secret scan:

```bash
git grep -nE 'sk-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.' -- ':!pnpm-lock.yaml'
```

Expected: quality commands exit 0 and the secret scan prints nothing.

- [ ] **Step 3: Push the branch and open one PR**

Push the implementation branch, open a PR to `main`, and wait for the `Quality` job on the exact head SHA. Do not merge on a stale or missing check.

- [ ] **Step 4: Configure Vercel server-only environment and deploy**

In the separate Vercel project `hybrid-okf-tutor`, set `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `OKF_EDGE_FUNCTION_URL`. Do not prefix any of them with `NEXT_PUBLIC_`. Use the GitHub integration for preview/production deploys; add no repository secret containing the Vercel service-role value.

- [ ] **Step 5: Run production smoke and protect `main`**

Complete the four successful turns and the two negative probes on the deployed URL. In browser network/devtools, confirm that responses and JS bundles contain neither API key nor service-role token. After the first green workflow exists, add required status check `Quality` to the existing main ruleset while preserving PR-only, squash-only, resolved-thread, no-force-push, and no-deletion rules.

- [ ] **Step 6: Merge only after the observable gate**

Required evidence: exact-head `Quality` green, Vercel deployment ready, live OKF formula atom visible through the trace, full walkthrough green, negative probes green, and secret scan empty.

Commit documentation changes as: `docs: add hackathon demo runbook`
