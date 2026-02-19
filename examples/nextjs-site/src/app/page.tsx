import Link from "next/link";
import { getAllContent, getLandingPage } from "@/lib/notion";

export const revalidate = 60;

export default async function Home() {
  const [landingPage, allContent] = await Promise.all([
    getLandingPage(),
    getAllContent(),
  ]);

  const blogs = allContent.filter((c) => c.type === "blog").slice(0, 3);
  const videos = allContent.filter((c) => c.type === "video").slice(0, 3);
  const projects = allContent.filter((c) => c.type === "project").slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {landingPage ? (
        <section className="mb-16">
          <div
            className="notion-content"
            dangerouslySetInnerHTML={{ __html: landingPage.html }}
          />
        </section>
      ) : (
        <section className="mb-16">
          <h1 className="text-5xl font-bold mb-4">Welcome</h1>
          <p className="text-xl text-gray-600">Content powered by Notion CMS</p>
        </section>
      )}

      {blogs.length > 0 && (
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Latest Posts</h2>
            <Link href="/blog" className="text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {blogs.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block p-6 border rounded-lg hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                {post.description && (
                  <p className="text-gray-600 text-sm">{post.description}</p>
                )}
                {post.publishedAt && (
                  <p className="text-gray-400 text-xs mt-4">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Latest Videos</h2>
            <Link href="/videos" className="text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.slug}`}
                className="block p-6 border rounded-lg hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
                {video.description && (
                  <p className="text-gray-600 text-sm">{video.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Projects</h2>
            <Link href="/projects" className="text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="block p-6 border rounded-lg hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                {project.description && (
                  <p className="text-gray-600 text-sm">{project.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
