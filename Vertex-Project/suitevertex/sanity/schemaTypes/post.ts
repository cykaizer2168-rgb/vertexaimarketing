import { defineField, defineType } from "sanity";
export const post = defineType({
  name: "post", title: "Blog Post", type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "excerpt", type: "text", rows: 2 }),
    defineField({ name: "coverImage", type: "image", options: { hotspot: true } }),
    defineField({ name: "author", type: "reference", to: [{ type: "author" }] }),
    defineField({ name: "publishedAt", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "body", type: "array", of: [{ type: "block" }, { type: "image" }] }),
    defineField({ name: "seoDescription", type: "text", rows: 2 }),
  ],
  orderings: [{ name: "publishedDesc", title: "Newest", by: [{ field: "publishedAt", direction: "desc" }] }],
});
