import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { RichText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { POST_QUERY, POST_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { Post } from "@/sanity/lib/types";

// Force dynamic so the build doesn't try to pre-render against a missing Sanity dataset.
// Remove this once NEXT_PUBLIC_SANITY_PROJECT_ID is set in the deployment environment.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // Skip static generation when running against a placeholder project ID (e.g. CI/dummy build).
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "dummy") return [];
  const slugs = await sanityFetch<{ slug: string }[]>({ query: POST_SLUGS_QUERY, tags: ["post"] });
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await sanityFetch<Post | null>({ query: POST_QUERY, params: { slug }, tags: ["post"] });
  if (!post) return {};
  return { title: post.title, description: post.seoDescription ?? post.excerpt };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await sanityFetch<Post | null>({ query: POST_QUERY, params: { slug }, tags: ["post"] });
  if (!post) notFound();
  return (
    <main>
      <Container className="max-w-2xl py-20">
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-3 text-sm text-navy-800/50">
          {new Date(post.publishedAt).toLocaleDateString()}
          {post.author ? ` · ${post.author.name}` : ""}
        </p>
        <article className="mt-8">
          <RichText value={post.body ?? []} />
        </article>
      </Container>
    </main>
  );
}
