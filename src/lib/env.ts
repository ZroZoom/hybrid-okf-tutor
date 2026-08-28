import "server-only";
import { z } from "zod";

const serverEnvSchema = z
  .object({
    OPENAI_API_KEY: z.string().min(1),
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    OKF_EDGE_FUNCTION_URL: z.url()
  })
  .strict();

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const getServerEnv = (source: NodeJS.ProcessEnv = process.env): ServerEnv =>
  serverEnvSchema.parse({
    OPENAI_API_KEY: source.OPENAI_API_KEY,
    SUPABASE_URL: source.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
    OKF_EDGE_FUNCTION_URL: source.OKF_EDGE_FUNCTION_URL
  });
