import "server-only";
import type OpenAI from "openai";
import {
  studentIntentSchema,
  type IntentInterpreter,
  type StudentIntent
} from "@/domain/intent";
import type { TutorStage } from "@/domain/walkthrough";

type OpenAiClient = Pick<OpenAI, "responses">;

const studentIntentJsonSchema = {
  type: "object",
  properties: {
    subject: { type: ["string", "null"], enum: ["matematyka", null] },
    level: { type: ["string", "null"], enum: ["E8", null] },
    intent: {
      type: "string",
      enum: ["definition", "formula", "example", "relation", "other"]
    },
    concepts: { type: "array", items: { type: "string" }, maxItems: 3 },
    requestedAnswerType: {
      type: ["string", "null"],
      enum: ["definition", "formula", "example", "explanation", null]
    },
    ambiguity: { type: "boolean" },
    missingEntity: { type: ["string", "null"] },
    rewrittenQuery: { type: "string", maxLength: 200 },
    emotionalSignal: {
      type: "string",
      enum: ["none", "frustration", "discouragement", "distress", "crisis"]
    },
    responseMode: { type: "string", enum: ["normal", "supportive", "safety"] }
  },
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
  additionalProperties: false
} as const;

class IntentInterpretationError extends Error {
  readonly code = "INVALID_INTENT_RESPONSE";

  constructor(readonly type: string) {
    super("Intent interpretation failed.");
  }
}

export class OpenAiIntentInterpreter implements IntentInterpreter {
  constructor(private readonly client: OpenAiClient) {}

  async interpret(message: string, stage: TutorStage | "start"): Promise<StudentIntent> {
    const response = await this.client.responses.create({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      instructions:
        "Classify the Polish message and emotional signal; never answer it and never add educational facts.",
      input: `Stage: ${stage}\nPolish message: ${message}`,
      text: {
        format: {
          type: "json_schema",
          name: "student_intent",
          strict: true,
          schema: studentIntentJsonSchema
        }
      }
    });

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(response.output_text);
    } catch {
      throw new IntentInterpretationError("json");
    }

    const parsedIntent = studentIntentSchema.safeParse(parsedJson);
    if (!parsedIntent.success) {
      const issuePath = parsedIntent.error.issues[0]?.path.map(String).join(".") || "root";
      throw new IntentInterpretationError(issuePath);
    }

    return parsedIntent.data;
  }
}
