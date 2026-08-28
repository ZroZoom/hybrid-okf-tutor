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
    const command = value.startsWith("\\dfrac", index)
      ? "\\dfrac"
      : value.startsWith("\\frac", index)
        ? "\\frac"
        : null;

    if (!command) {
      result += value[index];
      index += 1;
      continue;
    }

    const numerator = readLatexGroup(value, index + command.length);
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

const normalizeExpression = (value: string, trustedFormula = false): string => {
  const equalsIndex = value.indexOf("=");
  const rightHandSide = equalsIndex === -1 ? value : value.slice(equalsIndex + 1);
  const normalizedEscapes = rightHandSide.replace(
    /\\\\(?=(?:displaystyle|d?frac|cdot|times|left|right|[,;]))/g,
    "\\"
  );
  const expressionSource = trustedFormula
    ? normalizedEscapes.replaceAll("\\displaystyle", "")
    : normalizedEscapes;
  const normalized = linearizeLatexFractions(expressionSource)
    .toLowerCase()
    .replaceAll("\\left", "")
    .replaceAll("\\right", "")
    .replaceAll("\\cdot", "*")
    .replaceAll("\\times", "*")
    .replaceAll("\\,", "")
    .replaceAll("\\;", "")
    .replaceAll("×", "*")
    .replaceAll("·", "*")
    .replaceAll("÷", "/")
    .replaceAll("{", "(")
    .replaceAll("}", ")")
    .replaceAll("$", "")
    .replace(/\s+/g, "");

  return trustedFormula ? normalized.replaceAll("**", "") : normalized;
};

type FormulaVariables = Record<"a" | "b" | "h", number>;

type ExpressionToken =
  | { type: "number"; value: number }
  | { type: "variable"; value: keyof FormulaVariables }
  | { type: "operator"; value: "+" | "-" | "*" | "/" }
  | { type: "left-parenthesis" }
  | { type: "right-parenthesis" };

const tokenizeExpression = (
  value: string,
  allowTrailingAnnotation = false
): ExpressionToken[] | null => {
  const expression = normalizeExpression(value, allowTrailingAnnotation);
  const tokens: ExpressionToken[] = [];

  for (let index = 0; index < expression.length; ) {
    const character = expression[index];

    if (
      /[0-9]/.test(character) ||
      ((character === "." || character === ",") && /[0-9]/.test(expression[index + 1] ?? ""))
    ) {
      let end = index + 1;
      while (end < expression.length && /[0-9.,]/.test(expression[end])) end += 1;

      const literal = expression.slice(index, end).replace(",", ".");
      if ((literal.match(/\./g) ?? []).length > 1) return null;

      const number = Number(literal);
      if (!Number.isFinite(number)) return null;

      tokens.push({ type: "number", value: number });
      index = end;
      continue;
    }

    if (character === "a" || character === "b" || character === "h") {
      tokens.push({ type: "variable", value: character });
      index += 1;
      continue;
    }

    if (character === "+" || character === "-" || character === "*" || character === "/") {
      tokens.push({ type: "operator", value: character });
      index += 1;
      continue;
    }

    if (character === "(") {
      tokens.push({ type: "left-parenthesis" });
      index += 1;
      continue;
    }

    if (character === ")") {
      tokens.push({ type: "right-parenthesis" });
      index += 1;
      continue;
    }

    if (allowTrailingAnnotation && tokens.length > 0) break;
    return null;
  }

  return tokens.length > 0 ? tokens : null;
};

const evaluateExpression = (
  value: string,
  variables: FormulaVariables,
  allowTrailingAnnotation = false
): number | null => {
  const tokens = tokenizeExpression(value, allowTrailingAnnotation);
  if (!tokens) return null;

  let index = 0;
  const current = (): ExpressionToken | undefined => tokens[index];

  const parsePrimary = (): number | null => {
    const token = current();
    if (!token) return null;

    if (token.type === "number") {
      index += 1;
      return token.value;
    }

    if (token.type === "variable") {
      index += 1;
      return variables[token.value];
    }

    if (token.type !== "left-parenthesis") return null;

    index += 1;
    const result = parseSum();
    if (result === null || current()?.type !== "right-parenthesis") return null;
    index += 1;
    return result;
  };

  const parseUnary = (): number | null => {
    const token = current();
    if (token?.type !== "operator" || (token.value !== "+" && token.value !== "-")) {
      return parsePrimary();
    }

    index += 1;
    const valueAfterSign = parseUnary();
    if (valueAfterSign === null) return null;
    return token.value === "-" ? -valueAfterSign : valueAfterSign;
  };

  const startsImplicitFactor = (token: ExpressionToken | undefined): boolean =>
    token?.type === "number" ||
    token?.type === "variable" ||
    token?.type === "left-parenthesis";

  const parseProduct = (): number | null => {
    let result = parseUnary();
    if (result === null) return null;

    while (index < tokens.length) {
      const token = current();
      const hasExplicitOperator =
        token?.type === "operator" && (token.value === "*" || token.value === "/");
      if (!hasExplicitOperator && !startsImplicitFactor(token)) break;

      const operator = hasExplicitOperator && token.type === "operator" ? token.value : "*";
      if (hasExplicitOperator) index += 1;

      const right = parseUnary();
      if (right === null || (operator === "/" && right === 0)) return null;
      result = operator === "*" ? result * right : result / right;
    }

    return Number.isFinite(result) ? result : null;
  };

  function parseSum(): number | null {
    let result = parseProduct();
    if (result === null) return null;

    while (current()?.type === "operator") {
      const token = current();
      if (token?.type !== "operator" || (token.value !== "+" && token.value !== "-")) break;
      index += 1;

      const right = parseProduct();
      if (right === null) return null;
      result = token.value === "+" ? result + right : result - right;
    }

    return Number.isFinite(result) ? result : null;
  }

  const result = parseSum();
  return result !== null && index === tokens.length ? result : null;
};

const approximatelyEqual = (left: number, right: number): boolean =>
  Math.abs(left - right) <= Number.EPSILON * 100 * Math.max(1, Math.abs(left), Math.abs(right));

const equivalentFormula = (answer: string, formula: string): boolean =>
  [
    { a: 2, b: 5, h: 3 },
    { a: 4, b: 9, h: 2 },
    { a: 7, b: 1, h: 5 }
  ].every((variables) => {
    const answerValue = evaluateExpression(answer, variables);
    const formulaValue = evaluateExpression(formula, variables, true);
    return answerValue !== null && formulaValue !== null && approximatelyEqual(answerValue, formulaValue);
  });

const equivalentSubstitution = (
  answer: string,
  formula: string,
  task: WalkthroughTask
): boolean => {
  const tokens = tokenizeExpression(answer);
  if (!tokens) return false;

  const suppliedNumbers = tokens
    .filter((token): token is Extract<ExpressionToken, { type: "number" }> => token.type === "number")
    .map((token) => token.value);
  const includesTaskValues = [task.a, task.b, task.h].every((expected) =>
    suppliedNumbers.some((actual) => approximatelyEqual(actual, expected))
  );
  if (!includesTaskValues) return false;

  const answerValue = evaluateExpression(answer, task);
  const formulaValue = evaluateExpression(formula, task, true);
  return answerValue !== null && formulaValue !== null && approximatelyEqual(answerValue, formulaValue);
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
      if (
        normalizeExpression(input.answer) === normalizeExpression(formula) ||
        equivalentFormula(input.answer, formula)
      ) {
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
      if (
        normalizeExpression(input.answer) === preparedSubstitution(formula, input.task) ||
        equivalentSubstitution(input.answer, formula, input.task)
      ) {
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
