import type { PortableTextBlock } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export type PricingPlan = { _id: string; name: string; price: string; cadence: string; bestFor?: string; featured?: boolean; features?: string[]; ctaLabel?: string };
export type Service = { _id: string; title: string; description?: string; icon?: string; category?: "managed" | "implementation" };
export type Comparison = { _id: string; optionLabel?: string; title?: string; body?: string; costNote?: string };
export type Stat = { _id: string; value: string; label: string };
export type Testimonial = { _id: string; quote?: string; name?: string; role?: string; company?: string; logo?: SanityImageSource };
export type ClientLogo = { _id: string; name?: string; logo?: SanityImageSource };
export type Faq = { _id: string; question: string; answer: string };
export type PostListItem = { _id: string; title: string; slug: string; excerpt?: string; coverImage?: SanityImageSource; publishedAt: string };
export type Post = PostListItem & { body?: PortableTextBlock[]; author?: { name: string; role?: string; avatar?: SanityImageSource }; seoDescription?: string };
export type JobListItem = { _id: string; title: string; slug: string; location?: string; employmentType?: string };
export type Job = JobListItem & { salaryRange?: string; applyUrl?: string; description?: PortableTextBlock[] };
export type LegalPage = { _id: string; title: string; slug: string; updatedAt?: string; body?: PortableTextBlock[] };
export type SiteSettings = { brandName: string; tagline?: string; contactEmail?: string; seoDescription?: string };
