import { describe, expect, it } from "vitest";
import { getServerEnv } from "@/lib/env";

const validEnv = {
  OPENAI_API_KEY: "test-openai",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  OKF_EDGE_FUNCTION_URL: "https://example.supabase.co/functions/v1/hybrid-okf-dev"
};

describe("getServerEnv", () => {
  it("rejects missing server secrets", () => {
    expect(() => getServerEnv({} as NodeJS.ProcessEnv)).toThrow();
  });

  it("returns only the four server values", () => {
    expect(
      getServerEnv({ ...validEnv, UNRELATED_VALUE: "not returned" } as unknown as NodeJS.ProcessEnv)
    ).toEqual({
      OPENAI_API_KEY: "test-openai",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
      OKF_EDGE_FUNCTION_URL: "https://example.supabase.co/functions/v1/hybrid-okf-dev"
    });
  });
});
