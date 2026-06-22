import { defineField, defineType } from "sanity";
export const pricingPlan = defineType({
  name: "pricingPlan", title: "Pricing Plan", type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "price", type: "string", description: "e.g. $2,499", validation: (r) => r.required() }),
    defineField({ name: "cadence", type: "string", options: { list: ["/mo", "flat"] }, initialValue: "/mo" }),
    defineField({ name: "bestFor", type: "string" }),
    defineField({ name: "featured", type: "boolean", initialValue: false }),
    defineField({ name: "features", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "ctaLabel", type: "string", initialValue: "Book intro call" }),
    defineField({ name: "order", type: "number" }),
  ],
  orderings: [{ name: "order", title: "Order", by: [{ field: "order", direction: "asc" }] }],
});
