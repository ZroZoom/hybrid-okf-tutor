import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpOkfRepository } from "@/infrastructure/okf/http-okf-repository";

const edgeUrl = "https://example.supabase.co/functions/v1/hybrid-okf-dev";
const serverEnv = {
  OPENAI_API_KEY: "test-openai",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  OKF_EDGE_FUNCTION_URL: edgeUrl
};

const searchResult = {
  id: "trapez-id",
  name: "Trapez",
  subject: "matematyka",
  reviewStatus: "published"
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
  relations: [{ id: "relation-id", reviewStatus: "published" }],
  curriculum: [{ id: "curriculum-id", reviewStatus: "approved" }],
  skills: [{ id: "skill-id", reviewStatus: "pending" }]
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
    fetchMock.mockResolvedValueOnce(jsonResponse([searchResult]));

    await expect(repository.searchConcepts("trapez", "matematyka", "E8")).resolves.toEqual([
      searchResult
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      edgeUrl,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-service-role" }),
        body: JSON.stringify({
          operation: "searchConcepts",
          query: "trapez",
          subject: "matematyka",
          level: "E8"
        })
      })
    );
  });

  it("sends the exact server-authorized concept request and returns linked-entity statuses", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(concept));

    await expect(repository.getConcept("trapez-id", "E8")).resolves.toEqual(concept);

    expect(fetchMock).toHaveBeenCalledWith(
      edgeUrl,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-service-role" }),
        body: JSON.stringify({ operation: "getConcept", conceptId: "trapez-id", level: "E8" })
      })
    );
  });

  it("rejects an unknown field in a search response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ ...searchResult, unexpected: true }]));

    await expect(repository.searchConcepts("trapez", "matematyka", "E8")).rejects.toThrow(
      "OKF repository request failed."
    );
  });

  it("rejects a response that declares an operation outside the two-operation contract", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ ...searchResult, operation: "deleteConcept" }]));

    await expect(repository.searchConcepts("trapez", "matematyka", "E8")).rejects.toThrow(
      "OKF repository request failed."
    );
  });

  it("rejects a concept response with an atom missing its review status", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ ...concept, atoms: [{ id: "trapez-formula", type: "formula", text: "P = a" }] })
    );

    await expect(repository.getConcept("trapez-id", "E8")).rejects.toThrow(
      "OKF repository request failed."
    );
  });

  it("rejects a concept response with a linked entity missing its review status", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...concept, relations: [{ id: "relation-id" }] }));

    await expect(repository.getConcept("trapez-id", "E8")).rejects.toThrow(
      "OKF repository request failed."
    );
  });

  it("fails closed for a non-success response without exposing its body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "upstream-secret-detail" }, 403));

    await expect(repository.getConcept("trapez-id", "E8")).rejects.toThrow(
      "OKF repository request failed."
    );
  });
});
