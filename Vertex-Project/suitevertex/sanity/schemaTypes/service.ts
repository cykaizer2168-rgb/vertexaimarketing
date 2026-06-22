import { defineField, defineType } from "sanity";
export const service = defineType({
  name: "service", title: "Service", type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({ name: "icon", type: "string", description: "lucide-react icon name" }),
    defineField({ name: "category", type: "string", options: { list: ["managed", "implementation"] } }),
    defineField({ name: "order", type: "number" }),
  ],
});
