import type { OkfConcept } from "@/domain/okf";

export const trapezoidConcept: OkfConcept = {
  id: "trapezoid-area",
  name: "Pole trapezu",
  reviewStatus: "published",
  atoms: [
    {
      id: "trapezoid-area-formula",
      type: "formula",
      text: "P = ((a + b) * h) / 2",
      reviewStatus: "published"
    }
  ],
  relations: [],
  curriculum: [],
  skills: []
};

export const trapezoidTask = {
  a: 6,
  b: 10,
  h: 4,
  expectedResult: 32
} as const;
