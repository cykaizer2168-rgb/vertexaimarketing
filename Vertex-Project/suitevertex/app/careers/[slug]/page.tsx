import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { RichText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { JOB_QUERY, JOB_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { Job } from "@/sanity/lib/types";

// Force dynamic so the build doesn't try to pre-render against a missing Sanity dataset.
// Remove this once NEXT_PUBLIC_SANITY_PROJECT_ID is set in the deployment environment.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // Skip static generation when running against a placeholder project ID (e.g. CI/dummy build).
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "dummy") return [];
  const slugs = await sanityFetch<{ slug: string }[]>({ query: JOB_SLUGS_QUERY, tags: ["job"] });
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await sanityFetch<Job | null>({ query: JOB_QUERY, params: { slug }, tags: ["job"] });
  return job ? { title: job.title } : {};
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await sanityFetch<Job | null>({ query: JOB_QUERY, params: { slug }, tags: ["job"] });
  if (!job) notFound();
  return (
    <main>
      <Container className="max-w-2xl py-20">
        <h1 className="text-4xl font-bold tracking-tight">{job.title}</h1>
        <p className="mt-3 text-navy-800/60">
          {[job.location, job.employmentType, job.salaryRange].filter(Boolean).join(" · ")}
        </p>
        <article className="mt-8">
          <RichText value={job.description ?? []} />
        </article>
        {job.applyUrl && (
          <ButtonLink href={job.applyUrl} className="mt-8">
            Apply now
          </ButtonLink>
        )}
      </Container>
    </main>
  );
}
