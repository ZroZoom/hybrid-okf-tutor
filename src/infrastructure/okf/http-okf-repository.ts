import "server-only";
import { z } from "zod";
import type { ConceptSummary, OkfConcept, OkfRepository } from "@/domain/okf";
import { getServerEnv, type ServerEnv } from "@/lib/env";

const reviewStatusValueSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "published",
  "unversioned"
]);

const wireReviewStatusSchema = z
  .object({
    status: reviewStatusValueSchema,
    unreviewed: z.boolean(),
    needsReReview: z.boolean().nullable()
  })
  .strict();

const wireConceptSummarySchema = z
  .object({
    conceptId: z.string(),
    term: z.string(),
    subject: z.string(),
    topic: z.string().nullable(),
    reviewStatus: wireReviewStatusSchema
  })
  .strict();

const wireConceptSchema = z
  .object({
    conceptId: z.string(),
    term: z.string(),
    aliases: z.array(z.string()),
    subject: z.string(),
    topic: z.string().nullable(),
    reviewStatus: wireReviewStatusSchema
  })
  .strict();

const wireAtomSchema = z
  .object({
    atomId: z.string(),
    conceptId: z.string(),
    type: z.string(),
    level: z.string(),
    minLevel: z.string().nullable(),
    title: z.string(),
    body: z.string(),
    order: z.number(),
    reviewStatus: wireReviewStatusSchema
  })
  .strict();

const wireRelationSchema = z
  .object({
    relationId: z.string(),
    reviewStatus: wireReviewStatusSchema
  });

const wireCurriculumSchema = z
  .object({
    curriculumId: z.string(),
    reviewStatus: wireReviewStatusSchema
  });

const wireSkillSchema = z.object({
  skillId: z.string(),
  reviewStatus: wireReviewStatusSchema
});

const wireErrorResponseSchema = z.object({
  error: z.object({ code: z.string().max(100) })
});

class OkfRepositoryRequestError extends Error {
  constructor(
    readonly status?: number,
    readonly code?: string,
    readonly type?: string
  ) {
    super("OKF repository request failed.");
  }
}

const searchResponseSchema = z
  .object({ results: z.array(wireConceptSummarySchema) })
  .strict()
  .transform(({ results }): ConceptSummary[] =>
    results.map((result) => ({
      id: result.conceptId,
      name: result.term,
      subject: result.subject,
      reviewStatus: result.reviewStatus.status
    }))
  );

const conceptResponseSchema = z
  .object({
    result: z
      .object({
        concept: wireConceptSchema,
        atoms: z.array(wireAtomSchema),
        relations: z.array(wireRelationSchema),
        curriculum: z.array(wireCurriculumSchema),
        skills: z.array(wireSkillSchema),
        reviewStatus: wireReviewStatusSchema
      })
      .strict()
      .nullable()
  })
  .strict()
  .transform(({ result }): OkfConcept | null =>
    result
      ? {
          id: result.concept.conceptId,
          name: result.concept.term,
          reviewStatus: result.reviewStatus.status,
          atoms: result.atoms.map((atom) => ({
            id: atom.atomId,
            type: atom.type,
            text: atom.body,
            reviewStatus: atom.reviewStatus.status
          })),
          relations: result.relations.map((relation) => ({
            id: relation.relationId,
            reviewStatus: relation.reviewStatus.status
          })),
          curriculum: result.curriculum.map((entry) => ({
            id: entry.curriculumId,
            reviewStatus: entry.reviewStatus.status
          })),
          skills: result.skills.map((skill) => ({
            id: skill.skillId,
            reviewStatus: skill.reviewStatus.status
          }))
        }
      : null
  );

export class HttpOkfRepository implements OkfRepository {
  constructor(private readonly env: ServerEnv) {}

  async searchConcepts(query: string, subject: string, level: string): Promise<ConceptSummary[]> {
    return this.request(searchResponseSchema, { op: "searchConcepts", query, subject, level });
  }

  async getConcept(conceptId: string, level: string): Promise<OkfConcept | null> {
    return this.request(conceptResponseSchema, { op: "getConcept", conceptId, level });
  }

  private async request<T>(schema: z.ZodType<T>, body: Record<string, unknown>): Promise<T> {
    try {
      const response = await fetch(this.env.OKF_EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const parsedError = wireErrorResponseSchema.safeParse(
          await response.json().catch(() => null)
        );
        throw new OkfRepositoryRequestError(
          response.status,
          parsedError.success ? parsedError.data.error.code : undefined
        );
      }

      const parsedResponse = schema.safeParse(await response.json());
      if (!parsedResponse.success) {
        const issuePath = parsedResponse.error.issues[0]?.path.map(String).join(".") || "root";
        throw new OkfRepositoryRequestError(
          response.status,
          "INVALID_RESPONSE_SHAPE",
          issuePath
        );
      }

      return parsedResponse.data;
    } catch (error) {
      if (error instanceof OkfRepositoryRequestError) throw error;
      throw new OkfRepositoryRequestError(undefined, "UPSTREAM_REQUEST_FAILED");
    }
  }
}

export const createHttpOkfRepository = (): HttpOkfRepository => new HttpOkfRepository(getServerEnv());
