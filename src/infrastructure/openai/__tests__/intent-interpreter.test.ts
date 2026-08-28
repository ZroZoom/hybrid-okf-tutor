import { describe, expect, it, vi } from "vitest";
import { studentIntentSchema } from "@/domain/intent";
import { OpenAiIntentInterpreter } from "@/infrastructure/openai/intent-interpreter";

const validIntent = {
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
} as const;

describe("studentIntentSchema", () => {
  it("accepts the complete strict intent contract", () => {
    expect(studentIntentSchema.safeParse(validIntent).success).toBe(true);
  });

  it("rejects a missing property", () => {
    const missingResponseMode: Record<string, unknown> = { ...validIntent };
    delete missingResponseMode.responseMode;

    expect(studentIntentSchema.safeParse(missingResponseMode).success).toBe(false);
  });

  it("rejects an additional property", () => {
    expect(studentIntentSchema.safeParse({ ...validIntent, answer: "P = 32" }).success).toBe(false);
  });

  it("rejects an unknown enum value", () => {
    expect(studentIntentSchema.safeParse({ ...validIntent, intent: "solution" }).success).toBe(false);
  });
});

describe("OpenAiIntentInterpreter", () => {
  it("classifies with Luna low reasoning and strict structured output", async () => {
    const create = vi.fn().mockResolvedValue({ output_text: JSON.stringify(validIntent) });
    const client = {
      responses: { create }
    } as unknown as ConstructorParameters<typeof OpenAiIntentInterpreter>[0];
    const interpreter = new OpenAiIntentInterpreter(client);

    await expect(interpreter.interpret("Pamiętam wzór", "recall_formula")).resolves.toEqual(
      validIntent
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.6-luna",
        reasoning: { effort: "low" },
        instructions:
          "Classify the Polish message and emotional signal; never answer it and never add educational facts.",
        input: "Stage: recall_formula\nPolish message: Pamiętam wzór",
        text: {
          format: expect.objectContaining({
            type: "json_schema",
            name: "student_intent",
            strict: true,
            schema: expect.objectContaining({
              type: "object",
              required: [
                "subject",
                "level",
                "intent",
                "concepts",
                "requestedAnswerType",
                "ambiguity",
                "missingEntity",
                "rewrittenQuery",
                "emotionalSignal",
                "responseMode"
              ],
              additionalProperties: false,
              properties: expect.objectContaining({
                concepts: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 3
                },
                rewrittenQuery: { type: "string", maxLength: 200 }
              })
            })
          })
        }
      })
    );
  });

  it("classifies an invalid structured intent without exposing its content", async () => {
    const invalidIntent: Record<string, unknown> = { ...validIntent };
    delete invalidIntent.responseMode;
    const client = {
      responses: { create: vi.fn().mockResolvedValue({ output_text: JSON.stringify(invalidIntent) }) }
    } as unknown as ConstructorParameters<typeof OpenAiIntentInterpreter>[0];

    await expect(
      new OpenAiIntentInterpreter(client).interpret("Pomocy", "start")
    ).rejects.toMatchObject({
      message: "Intent interpretation failed.",
      code: "INVALID_INTENT_RESPONSE",
      type: "responseMode"
    });
  });
});
