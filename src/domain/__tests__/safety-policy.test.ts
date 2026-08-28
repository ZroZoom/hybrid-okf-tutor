import { describe, expect, it } from "vitest";
import type { StudentIntent } from "@/domain/intent";
import { decideSafety } from "@/domain/safety-policy";

const normalIntent: StudentIntent = {
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
};

const crisisIntent: StudentIntent = {
  ...normalIntent,
  emotionalSignal: "crisis",
  responseMode: "safety"
};

describe("decideSafety", () => {
  it("stops educational flow with constant crisis contacts", () => {
    const decision = decideSafety(crisisIntent);

    expect(decision).toMatchObject({ continueEducationalFlow: false });
    expect(decision.response).toContain("116 111");
    expect(decision.response).toContain("112");
  });

  it("stops when the crisis signal is present even if the response mode is inconsistent", () => {
    expect(decideSafety({ ...crisisIntent, responseMode: "normal" })).toMatchObject({
      mode: "safety",
      continueEducationalFlow: false
    });
  });

  it("adds one short constant prefix in supportive mode and continues", () => {
    expect(decideSafety({ ...normalIntent, responseMode: "supportive" })).toEqual({
      mode: "supportive",
      prefix: "Zróbmy to spokojnie, krok po kroku. ",
      continueEducationalFlow: true
    });
  });

  it("continues normal educational flow without extra copy", () => {
    expect(decideSafety(normalIntent)).toEqual({
      mode: "normal",
      continueEducationalFlow: true
    });
  });
});
