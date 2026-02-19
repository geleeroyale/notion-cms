import { notFound } from "next/navigation";
import { getContentBySlug, getAllContent } from "@/lib/notion";

export const revalidate = 60;

export async function generateStaticParams() {
  const videos = await getAllContent("video");
  return videos.map((video) => ({ slug: video.slug }));
}

interface Props {
  params: { slug: string };
}

function getEmbedUrl(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/,
    )?.[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes("vimeo.com")) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;
  const video = await getContentBySlug(slug);

  if (!video) {
    notFound();
  }

  const videoUrl = video.properties.VideoURL;

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">{video.title}</h1>

      {videoUrl && (
        <div className="video-embed mb-8">
          <iframe
            src={getEmbedUrl(videoUrl)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div
        className="notion-content"
        dangerouslySetInnerHTML={{ __html: video.html }}
      />
    </article>
  );
}
