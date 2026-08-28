import type { OkfConcept } from "@/domain/okf";

export type TutorStage = "recall_formula" | "substitute_values" | "calculate" | "complete";

export type TutorSession = {
  taskId: "trapezoid-area-1";
  conceptId: string;
  stage: TutorStage;
  hintLevel: 0 | 1;
};

export type WalkthroughDecision = {
  nextStage: TutorStage;
  correctness: "correct" | "incorrect" | "unrecognized";
  reply: string;
  hintLevel: 0 | 1;
};

export type WalkthroughTask = {
  a: number;
  b: number;
  h: number;
  expectedResult: number;
};

export type WalkthroughInput = {
  session: TutorSession;
  concept: OkfConcept;
  formulaAtomId: string;
  task: WalkthroughTask;
  answer: string;
};

const readLatexGroup = (
  value: string,
  openingBraceIndex: number
): { content: string; nextIndex: number } | null => {
  if (value[openingBraceIndex] !== "{") return null;

  let depth = 0;
  for (let index = openingBraceIndex; index < value.length; index += 1) {
    if (value[index] === "{") depth += 1;
    if (value[index] === "}") depth -= 1;

    if (depth === 0) {
      return {
        content: value.slice(openingBraceIndex + 1, index),
        nextIndex: index + 1
      };
    }
  }

  return null;
};

const linearizeLatexFractions = (value: string): string => {
  let result = "";
  let index = 0;

  while (index < value.length) {
    if (!value.startsWith("\\frac", index)) {
      result += value[index];
      index += 1;
      continue;
    }

    const numerator = readLatexGroup(value, index + "\\frac".length);
    const denominator = numerator ? readLatexGroup(value, numerator.nextIndex) : null;

    if (!numerator || !denominator) {
      result += value[index];
      index += 1;
      continue;
    }

    result += `(${linearizeLatexFractions(numerator.content)})/${linearizeLatexFractions(
      denominator.content
    )}`;
    index = denominator.nextIndex;
  }

  return result;
};

const normalizeExpression = (value: string): string => {
  const equalsIndex = value.indexOf("=");
  const rightHandSide = equalsIndex === -1 ? value : value.slice(equalsIndex + 1);
  const normalized = linearizeLatexFractions(rightHandSide)
    .toLowerCase()
    .replaceAll("\\left", "")
    .replaceAll("\\right", "")
    .replaceAll("\\cdot", "*")
    .replaceAll("\\times", "*")
    .replaceAll("×", "*")
    .replaceAll("·", "*")
    .replace(/\s+/g, "");

  return removeRedundantDivisionGrouping(normalized);
};

const removeRedundantDivisionGrouping = (expression: string): string => {
  if (!expression.startsWith("(")) return expression;

  let depth = 0;
  for (let index = 0; index < expression.length; index += 1) {
    if (expression[index] === "(") depth += 1;
    if (expression[index] === ")") depth -= 1;

    if (depth === 0) {
      return expression[index + 1] === "/"
        ? `${expression.slice(1, index)}${expression.slice(index + 1)}`
        : expression;
    }
  }

  return expression;
};

const getFormulaRightHandSide = (input: WalkthroughInput): string | null => {
  const formulaAtom = input.concept.atoms.find((atom) => atom.id === input.formulaAtomId);
  if (!formulaAtom) return null;

  const equalsIndex = formulaAtom.text.indexOf("=");
  return equalsIndex === -1 ? null : formulaAtom.text.slice(equalsIndex + 1);
};

const preparedSubstitution = (formula: string, task: WalkthroughTask): string =>
  normalizeExpression(formula)
    .replace(/\ba\b/g, String(task.a))
    .replace(/\bb\b/g, String(task.b))
    .replace(/\bh\b/g, String(task.h));

const retry = (
  stage: TutorStage,
  correctness: "incorrect" | "unrecognized",
  reply: string
): WalkthroughDecision => ({
  nextStage: stage,
  correctness,
  reply,
  hintLevel: 1
});

const isFormulaAttempt = (answer: string): boolean => /[=+*/]|\b[abh]\b/i.test(answer);

const isSubstitutionAttempt = (answer: string): boolean => /\d|[+*/]/.test(answer);

const isCalculationAttempt = (answer: string): boolean => /^\d+(?:\s*cm(?:2|²))?$/i.test(answer.trim());

export const advanceWalkthrough = (input: WalkthroughInput): WalkthroughDecision => {
  const formula = getFormulaRightHandSide(input);

  if (!formula) {
    return retry(
      input.session.stage,
      "unrecognized",
      "Czy możesz spróbować ponownie, korzystając z podanego wzoru?"
    );
  }

  switch (input.session.stage) {
    case "recall_formula": {
      if (normalizeExpression(input.answer) === normalizeExpression(formula)) {
        return {
          nextStage: "substitute_values",
          correctness: "correct",
          reply: "Dobrze. Jakie wartości podstawisz za a, b i h?",
          hintLevel: 0
        };
      }

      return isFormulaAttempt(input.answer)
        ? retry(
            "recall_formula",
            "incorrect",
            "Czy możesz jeszcze raz zapisać wzór na pole trapezu?"
          )
        : retry(
            "recall_formula",
            "unrecognized",
            "Czy możesz zapisać wzór z użyciem a, b i h?"
          );
    }

    case "substitute_values": {
      if (normalizeExpression(input.answer) === preparedSubstitution(formula, input.task)) {
        return {
          nextStage: "calculate",
          correctness: "correct",
          reply: "Dobrze. Jaki wynik otrzymasz po obliczeniu?",
          hintLevel: 0
        };
      }

      return isSubstitutionAttempt(input.answer)
        ? retry(
            "substitute_values",
            "incorrect",
            "Czy możesz ponownie sprawdzić, gdzie podstawiasz każdą wartość?"
          )
        : retry(
            "substitute_values",
            "unrecognized",
            "Czy możesz zapisać podstawienie jako działanie?"
          );
    }

    case "calculate": {
      const normalizedAnswer = input.answer.toLowerCase().replace(/\s+/g, "").replace("²", "2");
      const expectedResult = String(input.task.expectedResult);

      if (normalizedAnswer === expectedResult || normalizedAnswer === `${expectedResult}cm2`) {
        return {
          nextStage: "complete",
          correctness: "correct",
          reply: "Świetnie, wynik jest poprawny.",
          hintLevel: 0
        };
      }

      return isCalculationAttempt(input.answer)
        ? retry("calculate", "incorrect", "Czy możesz ponownie obliczyć to działanie?")
        : retry("calculate", "unrecognized", "Czy możesz podać wynik liczbowy z jednostką?");
    }

    case "complete":
      return retry("complete", "unrecognized", "Czy chcesz rozpocząć zadanie ponownie?");
  }
};
