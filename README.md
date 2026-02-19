# Notion CMS Framework

A minimal framework to use Notion as a CMS for any website.

## Installation

```bash
npm install notion-cms
```

## Setup

1. Create a Notion integration at https://www.notion.so/my-integrations
2. Share your Notion database/pages with the integration
3. Copy your integration token and database ID

## Usage

```typescript
import { NotionCMS } from "notion-cms";

const cms = new NotionCMS({
  auth: process.env.NOTION_TOKEN,
  databaseId: process.env.NOTION_DATABASE_ID,
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
});

// Get all pages from a database
const { pages } = await cms.getDatabase();

// Get a single page with full content
const page = await cms.getPage("page-id");
console.log(page.html); // Rendered HTML
console.log(page.markdown); // Rendered Markdown
console.log(page.content); // Structured content blocks

// Get page by slug
const blogPost = await cms.getPageBySlug("my-first-post");

// Get all pages (handles pagination)
const allPages = await cms.getAllPages();
```

## Database Query Options

```typescript
const { pages, hasMore, nextCursor } = await cms.getDatabase(undefined, {
  filter: {
    property: "Status",
    select: { equals: "Published" },
  },
  sorts: [{ property: "Date", direction: "descending" }],
  pageSize: 10,
});
```

## Page Content Structure

```typescript
interface PageContent {
  id: string;
  title: string;
  properties: Record<string, any>;
  content: ContentBlock[]; // Structured blocks
  html: string; // Pre-rendered HTML
  markdown: string; // Pre-rendered Markdown
  lastEdited: string;
  createdTime: string;
}
```

## Supported Block Types

- Paragraphs
- Headings (H1, H2, H3)
- Bulleted and numbered lists
- To-do items
- Toggle blocks
- Code blocks (with language)
- Quotes and callouts
- Dividers
- Images, videos, embeds
- Bookmarks
- Tables

## Caching

Built-in memory cache with configurable TTL:

```typescript
const cms = new NotionCMS({
  auth: "...",
  cache: { enabled: true, ttl: 600 },
});

// Manually clear cache
cms.clearCache();

// Invalidate specific page
cms.invalidatePage("page-id");
```

## Example: Next.js Integration

```typescript
// app/blog/[slug]/page.tsx
import { NotionCMS } from "notion-cms";

const cms = new NotionCMS({
  auth: process.env.NOTION_TOKEN!,
  databaseId: process.env.NOTION_DATABASE_ID!,
  cache: { enabled: true },
});

export async function generateStaticParams() {
  const pages = await cms.getAllPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await cms.getPageBySlug(params.slug);

  if (!post) return <div>Not found</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  );
}
```

## Example: Static Site Generation

```typescript
import { NotionCMS } from "notion-cms";
import { writeFileSync } from "fs";

const cms = new NotionCMS({ auth: process.env.NOTION_TOKEN! });

async function build() {
  const pages = await cms.getAllPages(process.env.NOTION_DATABASE_ID);

  for (const page of pages) {
    const content = await cms.getPage(page.id);
    writeFileSync(`./dist/${page.slug}.html`, content.html);
  }
}

build();
```

## Webhooks (Automatic Updates)

Notion can push updates directly to your app via webhooks. The framework provides handlers for all major frameworks.

### Setup Webhooks in Notion

1. Go to your integration settings at https://www.notion.so/my-integrations
2. Enable webhooks and set your endpoint URL (e.g., `https://yoursite.com/api/notion-webhook`)
3. Copy the webhook signing secret

### Next.js App Router

```typescript
// app/api/notion-webhook/route.ts
import { NotionWebhook, NotionCMS } from "notion-cms";

const cms = new NotionCMS({
  auth: process.env.NOTION_TOKEN!,
  cache: { enabled: true },
});

const webhook = new NotionWebhook({
  secret: process.env.NOTION_WEBHOOK_SECRET!,
  onPageUpdate: async (event) => {
    // Invalidate cache when page is updated
    if (event.data.page_id) {
      cms.invalidatePage(event.data.page_id);
    }
  },
  onPageCreate: async (event) => {
    console.log("New page created:", event.data.page_id);
  },
});

export const POST = webhook.nextAppHandler();
```

### Next.js Pages Router

```typescript
// pages/api/notion-webhook.ts
import { NotionWebhook } from "notion-cms";

const webhook = new NotionWebhook({
  secret: process.env.NOTION_WEBHOOK_SECRET!,
  onPageUpdate: async (event) => {
    // Trigger revalidation
    await fetch(
      `${process.env.SITE_URL}/api/revalidate?pageId=${event.data.page_id}`,
    );
  },
});

export default webhook.nextApiHandler();
```

### Express

```typescript
import express from "express";
import { NotionWebhook, NotionCMS } from "notion-cms";

const app = express();
const cms = new NotionCMS({
  auth: process.env.NOTION_TOKEN!,
  cache: { enabled: true },
});

const webhook = new NotionWebhook({
  secret: process.env.NOTION_WEBHOOK_SECRET!,
  onPageUpdate: (event) => cms.invalidatePage(event.data.page_id!),
});

app.use(express.raw({ type: "application/json" }));
app.post("/api/notion-webhook", webhook.middleware());
```

### Custom Handler

```typescript
import { NotionWebhook } from "notion-cms";

const webhook = new NotionWebhook({
  secret: process.env.NOTION_WEBHOOK_SECRET!,
});

// Subscribe to specific events
webhook.on("page.content_updated", async (event) => {
  console.log("Page content updated:", event.data.page_id);
});

webhook.on("page.deleted", async (event) => {
  console.log("Page deleted:", event.data.page_id);
});

// Catch-all handler
webhook.on("*", async (event) => {
  console.log("Event received:", event.type);
});

// Manual request handling
const result = await webhook.handleRequest({
  body: requestBody,
  headers: requestHeaders,
});
```

### Supported Webhook Events

- `page.created` - New page created
- `page.content_updated` - Page content changed
- `page.properties_updated` - Page properties changed
- `page.deleted` - Page deleted
- `page.restored` - Page restored from trash
- `page.moved` - Page moved to different parent
- `database.created` - New database created
- `database.content_updated` - Database content changed
- `database.properties_updated` - Database schema changed

## Environment Variables

```env
NOTION_TOKEN=secret_xxxxx
NOTION_DATABASE_ID=xxxxx
NOTION_WEBHOOK_SECRET=xxxxx
```

## License

MIT
