import { defineField, defineType } from "sanity";
export const clientLogo = defineType({
  name: "clientLogo", title: "Client Logo", type: "document",
  fields: [
    defineField({ name: "name", type: "string" }),
    defineField({ name: "logo", type: "image" }),
    defineField({ name: "order", type: "number" }),
  ],
});
