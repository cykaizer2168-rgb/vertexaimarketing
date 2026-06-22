import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { sanityFetch } from "@/sanity/lib/fetch";
import { POSTS_QUERY } from "@/sanity/lib/queries";
import type { PostListItem } from "@/sanity/lib/types";

export const metadata: Metadata = {
  title: "Blog",
  description: "NetSuite insights from the SuiteVertex team.",
};

export default async function BlogPage() {
  const posts = await sanityFetch<PostListItem[]>({ query: POSTS_QUERY, tags: ["post"] });
  return (
    <main>
      <Container className="py-20">
        <SectionHeading align="left" eyebrow="Blog" title="NetSuite, in practice" />
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {posts.map((p) => (
            <Link key={p._id} href={`/blog/${p.slug}`} className="group">
              <h2 className="text-xl font-semibold group-hover:text-indigo-600">{p.title}</h2>
              {p.excerpt && <p className="mt-2 text-navy-800/70">{p.excerpt}</p>}
              <p className="mt-2 text-sm text-navy-800/50">
                {new Date(p.publishedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {posts.length === 0 && <p className="text-navy-800/60">No posts yet.</p>}
        </div>
      </Container>
    </main>
  );
}
