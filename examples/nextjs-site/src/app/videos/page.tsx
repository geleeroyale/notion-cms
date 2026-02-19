import Link from "next/link";
import { getAllContent } from "@/lib/notion";

export const revalidate = 60;

export default async function VideosPage() {
  const videos = await getAllContent("video");

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Videos</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/videos/${video.slug}`}
            className="block border rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-1">{video.title}</h2>
              {video.description && (
                <p className="text-gray-600 text-sm">{video.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {videos.length === 0 && (
        <p className="text-gray-500">No videos yet.</p>
      )}
    </div>
  );
}
