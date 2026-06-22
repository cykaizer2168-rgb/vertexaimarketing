import { defineField, defineType } from "sanity";
export const stat = defineType({
  name: "stat", title: "Stat", type: "document",
  fields: [
    defineField({ name: "value", type: "string", description: "e.g. 20+" }),
    defineField({ name: "label", type: "string" }),
    defineField({ name: "order", type: "number" }),
  ],
});
