import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { RichText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { LEGAL_QUERY, LEGAL_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { LegalPage } from "@/sanity/lib/types";

// Force dynamic so the build doesn't try to pre-render against a missing Sanity dataset.
// Remove this once NEXT_PUBLIC_SANITY_PROJECT_ID is set in the deployment environment.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // Skip static generation when running against a placeholder project ID (e.g. CI/dummy build).
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "dummy") return [];
  const slugs = await sanityFetch<{ slug: string }[]>({ query: LEGAL_SLUGS_QUERY, tags: ["legalPage"] });
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await sanityFetch<LegalPage | null>({ query: LEGAL_QUERY, params: { slug }, tags: ["legalPage"] });
  return page ? { title: page.title } : {};
}

export default async function LegalPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await sanityFetch<LegalPage | null>({ query: LEGAL_QUERY, params: { slug }, tags: ["legalPage"] });
  if (!page) notFound();
  return (
    <main>
      <Container className="max-w-2xl py-20">
        <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
        {page.updatedAt && <p className="mt-2 text-sm text-navy-800/50">Updated {new Date(page.updatedAt).toLocaleDateString()}</p>}
        <article className="mt-8"><RichText value={page.body ?? []} /></article>
      </Container>
    </main>
  );
}
