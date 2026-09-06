import { describe, expect, it } from "vitest";
import { jobSearchInputSchema } from "../src/domain.js";

const input = (overrides: Record<string, unknown> = {}) => ({
  sourceListId: "czech",
  instructions: { criteria: { query: "engineer" } },
  limitPerSource: 5,
  ...overrides
});

describe("job search input schema", () => {
  it("accepts the Czech LinkedIn geoId", () => {
    expect(jobSearchInputSchema.parse(input({ instructions: { criteria: { query: "engineer", geoId: "104508036" } } })).instructions.criteria.geoId).toBe("104508036");
  });
  it.each(["", "cz", "104508036x"]) ("rejects invalid geoId %j", (geoId) => {
    expect(jobSearchInputSchema.safeParse(input({ instructions: { criteria: { query: "engineer", geoId } } })).success).toBe(false);
  });
  it("rejects empty queries and limits outside 1–50", () => {
    expect(jobSearchInputSchema.safeParse(input({ instructions: { criteria: { query: " " } } })).success).toBe(false);
    expect(jobSearchInputSchema.safeParse(input({ limitPerSource: 0 })).success).toBe(false);
    expect(jobSearchInputSchema.safeParse(input({ limitPerSource: 51 })).success).toBe(false);
    expect(jobSearchInputSchema.parse(input({ limitPerSource: 1 })).limitPerSource).toBe(1);
    expect(jobSearchInputSchema.parse(input({ limitPerSource: 50 })).limitPerSource).toBe(50);
  });
});
