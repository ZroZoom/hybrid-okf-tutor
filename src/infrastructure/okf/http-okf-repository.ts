import "server-only";
import { z } from "zod";
import type { ConceptSummary, OkfConcept, OkfRepository } from "@/domain/okf";
import { getServerEnv, type ServerEnv } from "@/lib/env";

const reviewStatusSchema = z.enum(["draft", "pending", "approved", "published"]);

const conceptSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    subject: z.string(),
    reviewStatus: reviewStatusSchema
  })
  .strict();

const atomSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    text: z.string(),
    reviewStatus: reviewStatusSchema
  })
  .strict();

const linkedEntitySchema = z
  .object({
    id: z.string(),
    reviewStatus: reviewStatusSchema
  })
  .strict();

const conceptSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    reviewStatus: reviewStatusSchema,
    atoms: z.array(atomSchema),
    relations: z.array(linkedEntitySchema),
    curriculum: z.array(linkedEntitySchema),
    skills: z.array(linkedEntitySchema)
  })
  .strict();

const searchResponseSchema = z.array(conceptSummarySchema);
const conceptResponseSchema = conceptSchema.nullable();

export class HttpOkfRepository implements OkfRepository {
  constructor(private readonly env: ServerEnv) {}

  async searchConcepts(query: string, subject: string, level: string | null): Promise<ConceptSummary[]> {
    return this.request(searchResponseSchema, { operation: "searchConcepts", query, subject, level });
  }

  async getConcept(conceptId: string, level: string | null): Promise<OkfConcept | null> {
    return this.request(conceptResponseSchema, { operation: "getConcept", conceptId, level });
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
        throw new Error("Upstream response was not successful.");
      }

      return schema.parse(await response.json());
    } catch {
      throw new Error("OKF repository request failed.");
    }
  }
}

export const createHttpOkfRepository = (): HttpOkfRepository => new HttpOkfRepository(getServerEnv());
