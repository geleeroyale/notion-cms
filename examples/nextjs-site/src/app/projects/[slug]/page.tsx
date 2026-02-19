import { notFound } from "next/navigation";
import { getContentBySlug, getAllContent } from "@/lib/notion";

export const revalidate = 60;

export async function generateStaticParams() {
  const projects = await getAllContent("project");
  return projects.map((project) => ({ slug: project.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getContentBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
        {project.properties.Tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.properties.Tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div
        className="notion-content"
        dangerouslySetInnerHTML={{ __html: project.html }}
      />
    </article>
  );
}
