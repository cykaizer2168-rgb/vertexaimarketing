import type { SchemaTypeDefinition } from "sanity";
import { siteSettings } from "./schemaTypes/siteSettings";
import { pricingPlan } from "./schemaTypes/pricingPlan";
import { service } from "./schemaTypes/service";
import { comparison } from "./schemaTypes/comparison";
import { stat } from "./schemaTypes/stat";
import { testimonial } from "./schemaTypes/testimonial";
import { clientLogo } from "./schemaTypes/clientLogo";
import { faq } from "./schemaTypes/faq";
import { post } from "./schemaTypes/post";
import { job } from "./schemaTypes/job";
import { legalPage } from "./schemaTypes/legalPage";
import { author } from "./schemaTypes/author";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [siteSettings, pricingPlan, service, comparison, stat, testimonial, clientLogo, faq, post, job, legalPage, author],
};
