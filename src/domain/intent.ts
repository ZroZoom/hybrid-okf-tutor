import { z } from "zod";
import type { TutorStage } from "@/domain/walkthrough";

export const studentIntentSchema = z
  .object({
    subject: z.enum(["matematyka"]).nullable(),
    level: z.enum(["E8"]).nullable(),
    intent: z.enum(["definition", "formula", "example", "relation", "other"]),
    concepts: z.array(z.string()).max(3),
    requestedAnswerType: z
      .enum(["definition", "formula", "example", "explanation"])
      .nullable(),
    ambiguity: z.boolean(),
    missingEntity: z.string().nullable(),
    rewrittenQuery: z.string().max(200),
    emotionalSignal: z.enum([
      "none",
      "frustration",
      "discouragement",
      "distress",
      "crisis"
    ]),
    responseMode: z.enum(["normal", "supportive", "safety"])
  })
  .strict();

export type StudentIntent = z.infer<typeof studentIntentSchema>;

export interface IntentInterpreter {
  interpret(message: string, stage: TutorStage | "start"): Promise<StudentIntent>;
}
