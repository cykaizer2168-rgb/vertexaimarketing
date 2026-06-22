import { defineField, defineType } from "sanity";
export const siteSettings = defineType({
  name: "siteSettings", title: "Site Settings", type: "document",
  fields: [
    defineField({ name: "brandName", type: "string", initialValue: "SuiteVertex" }),
    defineField({ name: "tagline", type: "string" }),
    defineField({ name: "logo", type: "image" }),
    defineField({ name: "contactEmail", type: "string" }),
    defineField({ name: "twitter", type: "url" }),
    defineField({ name: "linkedin", type: "url" }),
    defineField({ name: "seoDescription", type: "text", rows: 2 }),
  ],
});
