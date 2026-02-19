import Link from "next/link";
import { getAllContent } from "@/lib/notion";

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getAllContent("project");

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Projects</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.slug}`}
            className="block p-6 border rounded-lg hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-semibold mb-2">{project.title}</h2>
            {project.description && (
              <p className="text-gray-600 mb-4">{project.description}</p>
            )}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-gray-500">No projects yet.</p>
      )}
    </div>
  );
}
