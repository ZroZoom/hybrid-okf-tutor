import { describe, expect, it } from "vitest";
import { advanceWalkthrough, type TutorStage, type WalkthroughInput } from "@/domain/walkthrough";
import { trapezoidConcept, trapezoidTask } from "@/test/fixtures/okf";

const input = (stage: TutorStage, answer: string): WalkthroughInput => ({
  session: {
    taskId: "trapezoid-area-1",
    conceptId: trapezoidConcept.id,
    stage,
    hintLevel: 0
  },
  concept: trapezoidConcept,
  formulaAtomId: "trapezoid-area-formula",
  task: trapezoidTask,
  answer
});

describe("advanceWalkthrough", () => {
  it("advances after the formula from the selected OKF atom", () => {
    expect(advanceWalkthrough(input("recall_formula", "P=(a+b)*h/2"))).toMatchObject({
      nextStage: "substitute_values",
      correctness: "correct"
    });
  });

  it("advances after the prepared substitution", () => {
    expect(advanceWalkthrough(input("substitute_values", "(6+10)*4/2"))).toMatchObject({
      nextStage: "calculate",
      correctness: "correct"
    });
  });

  it("completes after the prepared result with an accepted unit", () => {
    expect(advanceWalkthrough(input("calculate", "32 cm²"))).toMatchObject({
      nextStage: "complete",
      correctness: "correct"
    });
  });

  it.each([
    ["recall_formula", "P=a*b"],
    ["substitute_values", "(6+10)*4"],
    ["calculate", "31 cm²"]
  ] as const)("keeps %s active for a recognizable incorrect answer", (stage, answer) => {
    const decision = advanceWalkthrough(input(stage, answer));

    expect(decision).toMatchObject({ nextStage: stage, correctness: "incorrect" });
    expect(decision.reply).toMatch(/\?$/);
    expect(decision.reply).not.toContain("32");
  });

  it.each([
    ["recall_formula", "nie wiem"],
    ["substitute_values", "pomocy"],
    ["calculate", "wynik?"],
    ["complete", "cokolwiek"]
  ] as const)("does not advance %s for an unrecognized answer", (stage, answer) => {
    expect(advanceWalkthrough(input(stage, answer))).toMatchObject({
      nextStage: stage,
      correctness: "unrecognized"
    });
  });
});
