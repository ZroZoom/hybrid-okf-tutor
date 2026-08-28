export type ReviewStatus = "draft" | "pending" | "approved" | "published" | "unversioned";

export type ConceptSummary = {
  id: string;
  name: string;
  subject: string;
  reviewStatus: ReviewStatus;
};

export type OkfAtom = {
  id: string;
  type: string;
  text: string;
  reviewStatus: ReviewStatus;
};

export type OkfLinkedEntity = {
  reviewStatus: ReviewStatus;
};

export type OkfConcept = {
  id: string;
  name: string;
  reviewStatus: ReviewStatus;
  atoms: OkfAtom[];
  relations: OkfLinkedEntity[];
  curriculum: OkfLinkedEntity[];
  skills: OkfLinkedEntity[];
};

export interface OkfRepository {
  searchConcepts(query: string, subject: string, level: string): Promise<ConceptSummary[]>;
  getConcept(conceptId: string, level: string): Promise<OkfConcept | null>;
}
