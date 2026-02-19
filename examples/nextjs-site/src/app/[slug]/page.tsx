import { notFound } from "next/navigation";
import { getContentBySlug, getAllContent } from "@/lib/notion";

export const revalidate = 60;

export async function generateStaticParams() {
  const pages = await getAllContent("page");
  return pages.map((page) => ({ slug: page.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = await getContentBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
      <div
        className="notion-content"
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    </article>
  );
}
