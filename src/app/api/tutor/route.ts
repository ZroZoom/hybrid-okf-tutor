import OpenAI from "openai";
import { createTutorHandler } from "@/app/api/tutor/handler";
import { HttpOkfRepository } from "@/infrastructure/okf/http-okf-repository";
import { OpenAiIntentInterpreter } from "@/infrastructure/openai/intent-interpreter";
import { getServerEnv } from "@/lib/env";

export const POST = async (request: Request): Promise<Response> => {
  try {
    const env = getServerEnv();
    const handler = createTutorHandler({
      intentInterpreter: new OpenAiIntentInterpreter(
        new OpenAI({ apiKey: env.OPENAI_API_KEY })
      ),
      okfRepository: new HttpOkfRepository(env)
    });

    return handler(request);
  } catch {
    return Response.json(
      { error: "Tutor service is temporarily unavailable." },
      { status: 502 }
    );
  }
};
