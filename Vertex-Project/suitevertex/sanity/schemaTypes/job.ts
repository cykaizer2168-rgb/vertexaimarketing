import { defineField, defineType } from "sanity";
export const job = defineType({
  name: "job", title: "Job", type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "location", type: "string" }),
    defineField({ name: "employmentType", type: "string", options: { list: ["Full-time", "Part-time", "Contract", "Fractional"] } }),
    defineField({ name: "salaryRange", type: "string" }),
    defineField({ name: "active", type: "boolean", initialValue: true }),
    defineField({ name: "applyUrl", type: "url" }),
    defineField({ name: "description", type: "array", of: [{ type: "block" }] }),
  ],
});
