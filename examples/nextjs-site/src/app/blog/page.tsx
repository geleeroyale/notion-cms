import Link from "next/link";
import { getAllContent } from "@/lib/notion";

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getAllContent("blog");

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="block p-6 border rounded-lg hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
            {post.description && (
              <p className="text-gray-600 mb-4">{post.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {post.publishedAt && (
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-gray-500">No blog posts yet.</p>
      )}
    </div>
  );
}
