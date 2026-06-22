import { defineField, defineType } from "sanity";
export const comparison = defineType({
  name: "comparison", title: "Comparison Option", type: "document",
  fields: [
    defineField({ name: "optionLabel", type: "string", description: "e.g. Option A · Hire someone" }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "body", type: "text", rows: 3 }),
    defineField({ name: "costNote", type: "string" }),
    defineField({ name: "order", type: "number" }),
  ],
});
