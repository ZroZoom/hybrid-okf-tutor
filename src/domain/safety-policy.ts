import type { StudentIntent } from "@/domain/intent";

const CRISIS_RESPONSE =
  "Jeśli jesteś w kryzysie, skontaktuj się z Telefonem Zaufania dla Dzieci i Młodzieży 116 111. Jeśli grozi Ci bezpośrednie niebezpieczeństwo, zadzwoń pod 112.";

const SUPPORTIVE_PREFIX = "Zróbmy to spokojnie, krok po kroku. ";

export type SafetyDecision =
  | {
      mode: "safety";
      response: string;
      prefix?: never;
      continueEducationalFlow: false;
    }
  | {
      mode: "supportive";
      prefix: string;
      response?: never;
      continueEducationalFlow: true;
    }
  | {
      mode: "normal";
      prefix?: never;
      response?: never;
      continueEducationalFlow: true;
    };

export const decideSafety = (intent: StudentIntent): SafetyDecision => {
  if (intent.emotionalSignal === "crisis" || intent.responseMode === "safety") {
    return {
      mode: "safety",
      response: CRISIS_RESPONSE,
      continueEducationalFlow: false
    };
  }

  if (intent.responseMode === "supportive") {
    return {
      mode: "supportive",
      prefix: SUPPORTIVE_PREFIX,
      continueEducationalFlow: true
    };
  }

  return { mode: "normal", continueEducationalFlow: true };
};
