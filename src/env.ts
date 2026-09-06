import "dotenv/config";
import { z } from "zod";

export function getApifyToken(): string {
  const result = z.object({ APIFY_TOKEN: z.string().trim().min(1) }).safeParse(process.env);
  if (!result.success) throw new Error("APIFY_TOKEN is required");
  return result.data.APIFY_TOKEN;
}
