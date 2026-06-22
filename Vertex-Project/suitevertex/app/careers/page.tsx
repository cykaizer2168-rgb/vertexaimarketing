import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { sanityFetch } from "@/sanity/lib/fetch";
import { JOBS_QUERY } from "@/sanity/lib/queries";
import type { JobListItem } from "@/sanity/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join SuiteVertex — senior NetSuite engineers and operators.",
};

export default async function CareersPage() {
  const jobs = await sanityFetch<JobListItem[]>({ query: JOBS_QUERY, tags: ["job"] });
  return (
    <main>
      <Container className="py-20">
        <SectionHeading align="left" eyebrow="Careers" title="Work with senior NetSuite people" />
        <div className="mt-12 space-y-4">
          {jobs.map((j) => (
            <Link key={j._id} href={`/careers/${j.slug}`}>
              <Card className="flex items-center justify-between transition-colors hover:border-indigo-600">
                <div>
                  <h2 className="text-lg font-semibold">{j.title}</h2>
                  <p className="mt-1 text-sm text-navy-800/60">
                    {[j.location, j.employmentType].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="text-indigo-600">→</span>
              </Card>
            </Link>
          ))}
          {jobs.length === 0 && (
            <p className="text-navy-800/60">No open roles right now.</p>
          )}
        </div>
      </Container>
    </main>
  );
}
