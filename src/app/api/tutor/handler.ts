import "server-only";
import { z } from "zod";
import type { IntentInterpreter } from "@/domain/intent";
import type { OkfRepository, ReviewStatus } from "@/domain/okf";
import { decideSafety } from "@/domain/safety-policy";
import {
  advanceWalkthrough,
  type TutorSession,
  type TutorStage
} from "@/domain/walkthrough";

const messageSchema = z.string().min(1).max(500);

const sessionSchema = z
  .object({
    taskId: z.literal("trapezoid-area-1"),
    conceptId: z.string().min(1).max(100),
    stage: z.enum(["recall_formula", "substitute_values", "calculate", "complete"]),
    hintLevel: z.union([z.literal(0), z.literal(1)])
  })
  .strict();

const tutorRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), message: messageSchema }).strict(),
  z
    .object({
      action: z.literal("answer"),
      message: messageSchema,
      session: sessionSchema
    })
    .strict()
]);

const TRAPEZOID_TASK = { a: 6, b: 10, h: 4, expectedResult: 32 } as const;
const INVALID_REQUEST = { error: "Invalid request." } as const;
const UPSTREAM_FAILURE = { error: "Tutor service is temporarily unavailable." } as const;

export type TutorDependencies = {
  intentInterpreter: IntentInterpreter;
  okfRepository: OkfRepository;
};

type TutorTrace = {
  intent: "definition" | "formula" | "example" | "relation" | "other";
  conceptName: string | null;
  atomType: string | null;
  ruleName: TutorStage | "safety";
};

type TutorResponse = {
  reply: string;
  session: TutorSession | null;
  reviewStatus: ReviewStatus | null;
  trace: TutorTrace;
};

const jsonResponse = (body: TutorResponse): Response => Response.json(body);

const failedUpstreamResponse = (): Response => Response.json(UPSTREAM_FAILURE, { status: 502 });

export const createTutorHandler =
  (deps: TutorDependencies) =>
  async (request: Request): Promise<Response> => {
    const parsedBody = await request
      .json()
      .then((body) => tutorRequestSchema.safeParse(body))
      .catch(() => null);

    if (!parsedBody?.success) {
      return Response.json(INVALID_REQUEST, { status: 400 });
    }

    const body = parsedBody.data;

    try {
      const intent = await deps.intentInterpreter.interpret(
        body.message,
        body.action === "start" ? "start" : body.session.stage
      );
      const safety = decideSafety(intent);

      if (!safety.continueEducationalFlow) {
        return jsonResponse({
          reply: safety.response,
          session: body.action === "answer" ? body.session : null,
          reviewStatus: null,
          trace: {
            intent: intent.intent,
            conceptName: null,
            atomType: null,
            ruleName: "safety"
          }
        });
      }

      const conceptId =
        body.action === "start"
          ? (
              await deps.okfRepository.searchConcepts(
                intent.rewrittenQuery,
                intent.subject ?? "matematyka",
                intent.level
              )
            )[0]?.id
          : body.session.conceptId;

      if (!conceptId) return failedUpstreamResponse();

      const concept = await deps.okfRepository.getConcept(conceptId, intent.level);
      const formulaAtom = concept?.atoms.find((atom) => atom.type === "formula");

      if (!concept || !formulaAtom) return failedUpstreamResponse();

      const prefix = safety.mode === "supportive" ? safety.prefix : "";

      if (body.action === "start") {
        const session: TutorSession = {
          taskId: "trapezoid-area-1",
          conceptId: concept.id,
          stage: "recall_formula",
          hintLevel: 0
        };

        return jsonResponse({
          reply: `${prefix}Jaki jest wzór na ${concept.name.toLowerCase()}?`,
          session,
          reviewStatus: formulaAtom.reviewStatus,
          trace: {
            intent: intent.intent,
            conceptName: concept.name,
            atomType: formulaAtom.type,
            ruleName: "recall_formula"
          }
        });
      }

      const decision = advanceWalkthrough({
        session: body.session,
        concept,
        formulaAtomId: formulaAtom.id,
        task: TRAPEZOID_TASK,
        answer: body.message
      });

      return jsonResponse({
        reply: `${prefix}${decision.reply}`,
        session: {
          ...body.session,
          stage: decision.nextStage,
          hintLevel: decision.hintLevel
        },
        reviewStatus: formulaAtom.reviewStatus,
        trace: {
          intent: intent.intent,
          conceptName: concept.name,
          atomType: formulaAtom.type,
          ruleName: body.session.stage
        }
      });
    } catch {
      return failedUpstreamResponse();
    }
  };
