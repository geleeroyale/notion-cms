import { NotionCMS, CMSPage } from "notion-cms";

export const cms = new NotionCMS({
  auth: process.env.NOTION_TOKEN || "",
  databaseId: process.env.NOTION_DATABASE_ID,
  cache: {
    enabled: true,
    ttl: 300,
  },
});

export type ContentType = "blog" | "page" | "video" | "project";

export interface PageMeta {
  id: string;
  slug: string;
  title: string;
  type: ContentType;
  description?: string;
  coverImage?: string;
  publishedAt?: string;
  tags?: string[];
  videoUrl?: string;
}

export async function getAllContent(type?: ContentType): Promise<PageMeta[]> {
  const filter = type
    ? {
        property: "Type",
        select: { equals: type },
      }
    : undefined;

  const { pages } = await cms.getDatabase(undefined, {
    filter,
    sorts: [{ property: "Published", direction: "descending" }],
  });

  return pages.map((page: CMSPage) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    type: (page.properties.Type as ContentType) || "page",
    description: page.properties.Description || "",
    coverImage: page.properties.Cover?.[0] || null,
    publishedAt: page.properties.Published?.start || null,
    tags: page.properties.Tags || [],
    videoUrl: page.properties.VideoURL || null,
  }));
}

export async function getContentBySlug(slug: string) {
  return cms.getPageBySlug(slug);
}

export async function getContentById(id: string) {
  return cms.getPage(id);
}

export async function getLandingPage() {
  const landingPageId = process.env.NOTION_LANDING_PAGE_ID;
  if (!landingPageId) {
    return null;
  }
  return cms.getPage(landingPageId);
}
