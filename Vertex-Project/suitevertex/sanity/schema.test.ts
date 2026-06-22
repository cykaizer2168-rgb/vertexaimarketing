import { describe, it, expect } from "vitest";
import { schema } from "./schema";

const expected = ["siteSettings","pricingPlan","service","comparison","stat","testimonial","clientLogo","faq","post","job","legalPage","author"];

describe("schema", () => {
  it("registers all content types", () => {
    const names = schema.types.map((t) => (t as { name: string }).name);
    for (const n of expected) expect(names).toContain(n);
  });
});
