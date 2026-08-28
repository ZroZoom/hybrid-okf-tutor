import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpOkfRepository } from "@/infrastructure/okf/http-okf-repository";

const edgeUrl = "https://example.supabase.co/functions/v1/hybrid-okf-dev";
const serverEnv = {
  OPENAI_API_KEY: "test-openai",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  OKF_EDGE_FUNCTION_URL: edgeUrl
};

const publishedReviewStatus = {
  status: "published",
  unreviewed: false,
  needsReReview: false
} as const;

const unversionedReviewStatus = {
  status: "unversioned",
  unreviewed: true,
  needsReReview: null
} as const;

const wireSearchResult = {
  conceptId: "trapez-id",
  term: "Trapez",
  subject: "matematyka",
  topic: null,
  reviewStatus: publishedReviewStatus
};

const searchResult = {
  id: "trapez-id",
  name: "Trapez",
  subject: "matematyka",
  reviewStatus: "published"
};

const wireConcept = {
  concept: {
    conceptId: "trapez-id",
    term: "Trapez",
    aliases: [],
    subject: "matematyka",
    topic: null,
    reviewStatus: publishedReviewStatus
  },
  atoms: [
    {
      atomId: "trapez-formula",
      conceptId: "trapez-id",
      type: "formula",
      level: "E8",
      minLevel: null,
      title: "Pole trapezu",
      body: "P = ((a + b) * h) / 2",
      order: 0,
      reviewStatus: publishedReviewStatus
    }
  ],
  relations: [],
  curriculum: [],
  skills: [],
  reviewStatus: publishedReviewStatus
};

const concept = {
  id: "trapez-id",
  name: "Trapez",
  reviewStatus: "published",
  atoms: [
    {
      id: "trapez-formula",
      type: "formula",
      text: "P = ((a + b) * h) / 2",
      reviewStatus: "published"
    }
  ],
  relations: [],
  curriculum: [],
  skills: []
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });

describe("HttpOkfRepository", () => {
  const fetchMock = vi.fn();
  const repository = new HttpOkfRepository(serverEnv);

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the exact server-authorized search request and returns validated summaries", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [wireSearchResult] }));

    await expect(repository.searchConcepts("trapez", "matematyka", "E8")).resolves.toEqual([
      searchResult
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      edgeUrl,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-service-role" }),
        body: JSON.stringify({
          op: "searchConcepts",
          query: "trapez",
          subject: "matematyka",
          level: "E8"
        })
      })
    );
  });

  it("sends the exact server-authorized concept request and returns linked-entity statuses", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: wireConcept }));

    await expect(repository.getConcept("trapez-id", "E8")).resolves.toEqual(concept);

    expect(fetchMock).toHaveBeenCalledWith(
      edgeUrl,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-service-role" }),
        body: JSON.stringify({ op: "getConcept", conceptId: "trapez-id", level: "E8" })
      })
    );
  });

  it("maps a null getConcept result to the domain null", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: null }));

    await expect(repository.getConcept("missing-id", "E8")).resolves.toBeNull();
  });

  it("accepts the documented unversioned review status as unreviewed knowledge", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        results: [
          {
            ...wireSearchResult,
            reviewStatus: unversionedReviewStatus
          }
        ]
      })
    );

    await expect(repository.searchConcepts("trapez", "matematyka", "E8")).resolves.toEqual([
      { ...searchResult, reviewStatus: "unversioned" }
    ]);
  });

  it("rejects an unknown field in a search response", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ results: [{ ...wireSearchResult, unexpected: true }] })
    );

    await expect(repository.searchConcepts("trapez", "matematyka", "E8")).rejects.toThrow(
      "OKF repository request failed."
    );
  });

  it("rejects a response that declares an operation outside the two-operation contract", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ results: [{ ...wireSearchResult, op: "deleteConcept" }] })
    );

    await expect(repository.searchConcepts("trapez", "matematyka", "E8")).rejects.toThrow(
      "OKF repository request failed."
    );
  });

  it("rejects a concept response with an atom missing its review status", async () => {
    const atomWithoutReviewStatus = { ...wireConcept.atoms[0] };
    delete (atomWithoutReviewStatus as Partial<typeof wireConcept.atoms[number]>).reviewStatus;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        result: {
          ...wireConcept,
          atoms: [atomWithoutReviewStatus]
        }
      })
    );

    await expect(repository.getConcept("trapez-id", "E8")).rejects.toThrow(
      "OKF repository request failed."
    );
  });

  it("rejects a malformed review-status object", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        result: {
          ...wireConcept,
          reviewStatus: { status: "draft", unreviewed: true }
        }
      })
    );

    await expect(repository.getConcept("trapez-id", "E8")).rejects.toThrow(
      "OKF repository request failed."
    );
  });

  it("preserves only the safe status and error code from a non-success response", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: "UNAUTHORIZED_WRONG_ROLE",
            message: "upstream-secret-detail"
          }
        },
        403
      )
    );

    await expect(repository.getConcept("trapez-id", "E8")).rejects.toMatchObject({
      message: "OKF repository request failed.",
      status: 403,
      code: "UNAUTHORIZED_WRONG_ROLE"
    });
  });
});
