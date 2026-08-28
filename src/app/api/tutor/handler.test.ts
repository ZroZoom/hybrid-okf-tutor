import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IntentInterpreter, StudentIntent } from "@/domain/intent";
import type { OkfRepository, ReviewStatus } from "@/domain/okf";
import type { TutorSession } from "@/domain/walkthrough";
import { createTutorHandler } from "@/app/api/tutor/handler";

const normalIntent: StudentIntent = {
  subject: "matematyka",
  level: "E8",
  intent: "formula",
  concepts: ["trapez"],
  requestedAnswerType: "formula",
  ambiguity: false,
  missingEntity: null,
  rewrittenQuery: "pole trapezu",
  emotionalSignal: "none",
  responseMode: "normal"
};

const concept = {
  id: "trapez-id",
  name: "Pole trapezu",
  reviewStatus: "published" as const,
  atoms: [
    {
      id: "trapezoid-area-formula",
      type: "formula",
      text: "P = ((a + b) * h) / 2",
      reviewStatus: "published" as const
    }
  ],
  relations: [],
  curriculum: [],
  skills: []
};

const session: TutorSession = {
  taskId: "trapezoid-area-1",
  conceptId: "trapez-id",
  stage: "recall_formula",
  hintLevel: 0
};

const requestFor = (body: unknown): Request =>
  new Request("http://localhost/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });

const json = (response: Response): Promise<Record<string, unknown>> => response.json();

describe("createTutorHandler", () => {
  const calls: string[] = [];
  const interpret = vi.fn<IntentInterpreter["interpret"]>();
  const searchConcepts = vi.fn<OkfRepository["searchConcepts"]>();
  const getConcept = vi.fn<OkfRepository["getConcept"]>();

  beforeEach(() => {
    calls.length = 0;
    interpret.mockReset().mockResolvedValue(normalIntent);
    searchConcepts.mockReset().mockImplementation(async () => {
      calls.push("searchConcepts");
      return [
        {
          id: concept.id,
          name: concept.name,
          subject: "matematyka",
          reviewStatus: "published"
        }
      ];
    });
    getConcept.mockReset().mockImplementation(async () => {
      calls.push("getConcept");
      return concept;
    });
  });

  const handler = () =>
    createTutorHandler({
      intentInterpreter: { interpret },
      okfRepository: { searchConcepts, getConcept }
    });

  it("starts by searching and then fetching the grounded concept", async () => {
    const response = await handler()(
      requestFor({ action: "start", message: "Chcę obliczyć pole trapezu" })
    );
    const body = await json(response);

    expect(response.status).toBe(200);
    expect(calls).toEqual(["searchConcepts", "getConcept"]);
    expect(interpret).toHaveBeenCalledWith("Chcę obliczyć pole trapezu", "start");
    expect(searchConcepts).toHaveBeenCalledWith("pole trapezu", "matematyka", "E8");
    expect(getConcept).toHaveBeenCalledWith("trapez-id", "E8");
    expect(Object.keys(body).sort()).toEqual(["reply", "reviewStatus", "session", "trace"]);
    expect(body).toEqual({
      reply: "Jaki jest wzór na pole trapezu?",
      session,
      reviewStatus: "published",
      trace: {
        intent: "formula",
        conceptName: "Pole trapezu",
        atomType: "formula",
        ruleName: "recall_formula"
      }
    });
  });

  it("uses the required E8 level when the interpreter omits it", async () => {
    interpret.mockResolvedValueOnce({ ...normalIntent, level: null });

    const response = await handler()(
      requestFor({ action: "start", message: "Chcę obliczyć pole trapezu" })
    );

    expect(response.status).toBe(200);
    expect(searchConcepts).toHaveBeenCalledWith("pole trapezu", "matematyka", "E8");
    expect(getConcept).toHaveBeenCalledWith("trapez-id", "E8");
  });

  it("maps an overlong upstream concept ID to a generic 502 without leaking it", async () => {
    const overlongConceptId = `upstream-private-${"x".repeat(84)}`;
    searchConcepts.mockResolvedValueOnce([
      {
        id: overlongConceptId,
        name: concept.name,
        subject: "matematyka",
        reviewStatus: "published"
      }
    ]);
    getConcept.mockResolvedValueOnce({ ...concept, id: overlongConceptId });

    const response = await handler()(
      requestFor({ action: "start", message: "Chcę obliczyć pole trapezu" })
    );
    const serialized = JSON.stringify(await json(response));

    expect(overlongConceptId).toHaveLength(101);
    expect(response.status).toBe(502);
    expect(serialized).toBe('{"error":"Tutor service is temporarily unavailable."}');
    expect(serialized).not.toContain(overlongConceptId);
  });

  it("answers by fetching only the session concept and applying its formula atom", async () => {
    const response = await handler()(
      requestFor({ action: "answer", message: "P=(a+b)*h/2", session })
    );
    const body = await json(response);

    expect(response.status).toBe(200);
    expect(calls).toEqual(["getConcept"]);
    expect(searchConcepts).not.toHaveBeenCalled();
    expect(getConcept).toHaveBeenCalledWith("trapez-id", "E8");
    expect(interpret).toHaveBeenCalledWith("P=(a+b)*h/2", "recall_formula");
    expect(Object.keys(body).sort()).toEqual(["reply", "reviewStatus", "session", "trace"]);
    expect(body).toEqual({
      reply: "Dobrze. Jakie wartości podstawisz za a, b i h?",
      session: { ...session, stage: "substitute_values" },
      reviewStatus: "published",
      trace: {
        intent: "formula",
        conceptName: "Pole trapezu",
        atomType: "formula",
        ruleName: "recall_formula"
      }
    });
  });

  it.each([
    {
      action: "start",
      conceptStatus: "draft",
      formulaStatus: "published",
      expectedStatus: "draft"
    },
    {
      action: "start",
      conceptStatus: "pending",
      formulaStatus: "approved",
      expectedStatus: "pending"
    },
    {
      action: "answer",
      conceptStatus: "published",
      formulaStatus: "pending",
      expectedStatus: "pending"
    },
    {
      action: "answer",
      conceptStatus: "draft",
      formulaStatus: "published",
      expectedStatus: "draft"
    },
    {
      action: "answer",
      conceptStatus: "published",
      formulaStatus: "unversioned",
      expectedStatus: "unversioned"
    }
  ] satisfies Array<{
    action: "start" | "answer";
    conceptStatus: ReviewStatus;
    formulaStatus: ReviewStatus;
    expectedStatus: ReviewStatus;
  }>)(
    "preserves $expectedStatus review status for $action when concept is $conceptStatus and formula is $formulaStatus",
    async ({ action, conceptStatus, formulaStatus, expectedStatus }) => {
      getConcept.mockResolvedValueOnce({
        ...concept,
        reviewStatus: conceptStatus,
        atoms: [{ ...concept.atoms[0], reviewStatus: formulaStatus }]
      });

      const requestBody =
        action === "start"
          ? { action, message: "Chcę obliczyć pole trapezu" }
          : { action, message: "P=(a+b)*h/2", session };
      const response = await handler()(requestFor(requestBody));

      expect(response.status).toBe(200);
      expect(await json(response)).toMatchObject({ reviewStatus: expectedStatus });
    }
  );

  it("short-circuits a crisis before every OKF operation", async () => {
    interpret.mockResolvedValueOnce({
      ...normalIntent,
      emotionalSignal: "crisis",
      responseMode: "safety"
    });

    const response = await handler()(
      requestFor({ action: "answer", message: "Nie chcę żyć", session })
    );
    const body = await json(response);

    expect(response.status).toBe(200);
    expect(searchConcepts).not.toHaveBeenCalled();
    expect(getConcept).not.toHaveBeenCalled();
    expect(Object.keys(body).sort()).toEqual(["reply", "reviewStatus", "session", "trace"]);
    expect(body).toEqual({
      reply:
        "Jeśli jesteś w kryzysie, skontaktuj się z Telefonem Zaufania dla Dzieci i Młodzieży 116 111. Jeśli grozi Ci bezpośrednie niebezpieczeństwo, zadzwoń pod 112.",
      session,
      reviewStatus: null,
      trace: {
        intent: "formula",
        conceptName: null,
        atomType: null,
        ruleName: "safety"
      }
    });
  });

  it("adds the deterministic supportive prefix and continues through OKF", async () => {
    interpret.mockResolvedValueOnce({ ...normalIntent, responseMode: "supportive" });

    const response = await handler()(
      requestFor({ action: "answer", message: "To jest trudne", session })
    );

    expect(await json(response)).toMatchObject({
      reply: "Zróbmy to spokojnie, krok po kroku. Czy możesz zapisać wzór z użyciem a, b i h?"
    });
    expect(calls).toEqual(["getConcept"]);
  });

  it.each([
    ["malformed JSON", "{"],
    [
      "an unknown task ID",
      {
        action: "answer",
        message: "P=(a+b)*h/2",
        session: { ...session, taskId: "other-task" }
      }
    ],
    [
      "an unknown stage",
      {
        action: "answer",
        message: "P=(a+b)*h/2",
        session: { ...session, stage: "give_solution" }
      }
    ],
    [
      "a concept ID longer than 100 characters",
      {
        action: "answer",
        message: "P=(a+b)*h/2",
        session: { ...session, conceptId: "x".repeat(101) }
      }
    ],
    ["a message longer than 500 characters", { action: "start", message: "x".repeat(501) }],
    ["an additional field", { action: "start", message: "Start", headers: "secret" }]
  ] as const)("returns 400 before Luna for %s", async (_caseName, body) => {
    const response = await handler()(requestFor(body));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Invalid request." });
    expect(interpret).not.toHaveBeenCalled();
    expect(searchConcepts).not.toHaveBeenCalled();
    expect(getConcept).not.toHaveBeenCalled();
  });

  it("logs only safe metadata for Luna failures and returns a generic 502", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    interpret.mockRejectedValueOnce(
      Object.assign(new Error("openai-secret-bearing-error"), {
        status: 404,
        code: "model_not_found",
        type: "invalid_request_error"
      })
    );

    const response = await handler()(
      requestFor({ action: "start", message: "Chcę obliczyć pole trapezu" })
    );
    const serialized = JSON.stringify(await json(response));

    expect(response.status).toBe(502);
    expect(serialized).toBe('{"error":"Tutor service is temporarily unavailable."}');
    expect(serialized).not.toContain("openai-secret-bearing-error");
    expect(errorLog).toHaveBeenCalledWith("Tutor dependency failed.", {
      name: "Error",
      status: 404,
      code: "model_not_found",
      type: "invalid_request_error"
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("openai-secret-bearing-error");
    errorLog.mockRestore();
  });

  it("maps OKF failures to the same generic 502 without raw error data", async () => {
    getConcept.mockRejectedValueOnce(new Error("database-secret-bearing-error"));

    const response = await handler()(
      requestFor({ action: "answer", message: "P=(a+b)*h/2", session })
    );
    const serialized = JSON.stringify(await json(response));

    expect(response.status).toBe(502);
    expect(serialized).toBe('{"error":"Tutor service is temporarily unavailable."}');
    expect(serialized).not.toContain("database-secret-bearing-error");
  });
});
