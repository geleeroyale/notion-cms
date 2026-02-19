import { notFound } from "next/navigation";
import { getContentBySlug, getAllContent } from "@/lib/notion";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getAllContent("blog");
  return posts.map((post) => ({ slug: post.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getContentBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-gray-500">
          {post.properties.Published?.start && (
            <time>
              {new Date(post.properties.Published.start).toLocaleDateString()}
            </time>
          )}
          {post.properties.Tags?.length > 0 && (
            <div className="flex gap-2">
              {post.properties.Tags.map((tag: string) => (
                <span
                  key={tag}
                  className="bg-gray-100 px-2 py-1 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div
        className="notion-content"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
