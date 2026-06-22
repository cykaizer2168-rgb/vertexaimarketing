import { defineField, defineType } from "sanity";
export const faq = defineType({
  name: "faq", title: "FAQ", type: "document",
  fields: [
    defineField({ name: "question", type: "string" }),
    defineField({ name: "answer", type: "text", rows: 3 }),
    defineField({ name: "page", type: "string", options: { list: ["home", "pricing"] }, initialValue: "home" }),
    defineField({ name: "order", type: "number" }),
  ],
});
