import { defineField, defineType } from "sanity";
export const testimonial = defineType({
  name: "testimonial", title: "Testimonial", type: "document",
  fields: [
    defineField({ name: "quote", type: "text", rows: 3 }),
    defineField({ name: "name", type: "string" }),
    defineField({ name: "role", type: "string" }),
    defineField({ name: "company", type: "string" }),
    defineField({ name: "logo", type: "image" }),
  ],
});
