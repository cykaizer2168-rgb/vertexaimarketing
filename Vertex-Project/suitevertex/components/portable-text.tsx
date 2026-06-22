import { PortableText, type PortableTextComponents, type PortableTextBlock } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="mt-10 text-2xl font-bold">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-8 text-xl font-semibold">{children}</h3>,
    normal: ({ children }) => <p className="mt-4 leading-relaxed text-navy-800/80">{children}</p>,
  },
  list: { bullet: ({ children }) => <ul className="mt-4 list-disc space-y-1 pl-6">{children}</ul> },
  marks: { link: ({ children, value }) => <a href={value?.href} className="text-indigo-600 underline">{children}</a> },
  types: {
    image: ({ value }) => <Image src={urlFor(value).width(1200).url()} alt={value?.alt ?? ""} width={1200} height={675} className="mt-6 rounded-xl" />,
  },
};

export function RichText({ value }: { value: PortableTextBlock[] }) {
  if (!value?.length) return null;
  return <div><PortableText value={value} components={components} /></div>;
}
