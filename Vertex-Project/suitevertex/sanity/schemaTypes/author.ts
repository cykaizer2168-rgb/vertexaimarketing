import { defineField, defineType } from "sanity";
export const author = defineType({
  name: "author", title: "Author", type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "role", type: "string" }),
    defineField({ name: "avatar", type: "image" }),
    defineField({ name: "bio", type: "text", rows: 3 }),
  ],
});
