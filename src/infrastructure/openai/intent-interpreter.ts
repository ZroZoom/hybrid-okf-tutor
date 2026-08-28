import "server-only";
import type OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  studentIntentSchema,
  type IntentInterpreter,
  type StudentIntent
} from "@/domain/intent";
import type { TutorStage } from "@/domain/walkthrough";

type OpenAiClient = Pick<OpenAI, "responses">;

export class OpenAiIntentInterpreter implements IntentInterpreter {
  constructor(private readonly client: OpenAiClient) {}

  async interpret(message: string, stage: TutorStage | "start"): Promise<StudentIntent> {
    const response = await this.client.responses.parse({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      instructions:
        "Classify the Polish message and emotional signal; never answer it and never add educational facts.",
      input: `Stage: ${stage}\nPolish message: ${message}`,
      text: {
        format: zodTextFormat(studentIntentSchema, "student_intent")
      }
    });

    if (!response.output_parsed) {
      throw new Error("Intent interpretation failed.");
    }

    return response.output_parsed;
  }
}
