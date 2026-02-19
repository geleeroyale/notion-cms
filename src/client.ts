import { Client } from "@notionhq/client";
import { SimpleCache } from "./cache";
import { BlockTransformer } from "./transformer";
import {
  NotionCMSConfig,
  PageContent,
  ContentBlock,
  DatabaseQueryOptions,
  CMSPage,
  CMSCollection,
} from "./types";

export class NotionCMS {
  private client: Client;
  private cache: SimpleCache | null;
  private transformer: BlockTransformer;
  private databaseId?: string;

  constructor(config: NotionCMSConfig) {
    this.client = new Client({ auth: config.auth });
    this.databaseId = config.databaseId;
    this.transformer = new BlockTransformer();
    
    if (config.cache?.enabled) {
      this.cache = new SimpleCache(config.cache.ttl || 300);
    } else {
      this.cache = null;
    }
  }

  async getPage(pageId: string): Promise<PageContent> {
    const cacheKey = `page:${pageId}`;
    
    if (this.cache?.has(cacheKey)) {
      return this.cache.get<PageContent>(cacheKey)!;
    }

    const page = await this.client.pages.retrieve({ page_id: pageId });
    const blocks = await this.getAllBlocks(pageId);
    const contentBlocks = await this.parseBlocks(blocks);

    const pageContent: PageContent = {
      id: pageId,
      title: this.extractTitle(page),
      properties: this.extractProperties(page),
      content: contentBlocks,
      html: this.transformer.toHTML(contentBlocks),
      markdown: this.transformer.toMarkdown(contentBlocks),
      lastEdited: (page as any).last_edited_time,
      createdTime: (page as any).created_time,
    };

    this.cache?.set(cacheKey, pageContent);
    return pageContent;
  }

  async getDatabase(
    databaseId?: string,
    options: DatabaseQueryOptions = {}
  ): Promise<CMSCollection> {
    const dbId = databaseId || this.databaseId;
    if (!dbId) {
      throw new Error("Database ID is required");
    }

    const cacheKey = `db:${dbId}:${JSON.stringify(options)}`;
    
    if (this.cache?.has(cacheKey)) {
      return this.cache.get<CMSCollection>(cacheKey)!;
    }

    const response = await this.client.databases.query({
      database_id: dbId,
      filter: options.filter,
      sorts: options.sorts,
      page_size: options.pageSize || 100,
      start_cursor: options.startCursor,
    });

    const pages: CMSPage[] = response.results.map((page: any) => ({
      id: page.id,
      slug: this.extractSlug(page),
      title: this.extractTitle(page),
      properties: this.extractProperties(page),
    }));

    const collection: CMSCollection = {
      pages,
      hasMore: response.has_more,
      nextCursor: response.next_cursor,
    };

    this.cache?.set(cacheKey, collection);
    return collection;
  }

  async getPageBySlug(slug: string, databaseId?: string): Promise<PageContent | null> {
    const dbId = databaseId || this.databaseId;
    if (!dbId) {
      throw new Error("Database ID is required");
    }

    const response = await this.client.databases.query({
      database_id: dbId,
      filter: {
        property: "Slug",
        rich_text: { equals: slug },
      },
      page_size: 1,
    });

    if (response.results.length === 0) {
      return null;
    }

    return this.getPage(response.results[0].id);
  }

  async getAllPages(databaseId?: string): Promise<CMSPage[]> {
    const allPages: CMSPage[] = [];
    let cursor: string | undefined;

    do {
      const collection = await this.getDatabase(databaseId, {
        startCursor: cursor,
        pageSize: 100,
      });
      allPages.push(...collection.pages);
      cursor = collection.nextCursor || undefined;
    } while (cursor);

    return allPages;
  }

  private async getAllBlocks(blockId: string): Promise<any[]> {
    const blocks: any[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.client.blocks.children.list({
        block_id: blockId,
        page_size: 100,
        start_cursor: cursor,
      });
      blocks.push(...response.results);
      cursor = response.next_cursor || undefined;
    } while (cursor);

    return blocks;
  }

  private async parseBlocks(blocks: any[]): Promise<ContentBlock[]> {
    const contentBlocks: ContentBlock[] = [];

    for (const block of blocks) {
      const contentBlock = await this.parseBlock(block);
      contentBlocks.push(contentBlock);
    }

    return contentBlocks;
  }

  private async parseBlock(block: any): Promise<ContentBlock> {
    const type = block.type;
    const blockData = block[type] || {};

    let children: ContentBlock[] | undefined;
    if (block.has_children) {
      const childBlocks = await this.getAllBlocks(block.id);
      children = await this.parseBlocks(childBlocks);
    }

    return {
      id: block.id,
      type,
      content: this.extractRichText(blockData.rich_text || blockData.text || []),
      children,
      metadata: this.extractBlockMetadata(block),
    };
  }

  private extractRichText(richText: any[]): string {
    if (!Array.isArray(richText)) return "";
    return richText.map((t: any) => t.plain_text || "").join("");
  }

  private extractTitle(page: any): string {
    const props = page.properties || {};
    
    for (const key of Object.keys(props)) {
      const prop = props[key];
      if (prop.type === "title" && prop.title) {
        return this.extractRichText(prop.title);
      }
    }
    
    return "";
  }

  private extractSlug(page: any): string {
    const props = page.properties || {};
    
    if (props.Slug?.rich_text) {
      return this.extractRichText(props.Slug.rich_text);
    }
    
    const title = this.extractTitle(page);
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  private extractProperties(page: any): Record<string, any> {
    const props = page.properties || {};
    const result: Record<string, any> = {};

    for (const [key, prop] of Object.entries(props) as [string, any][]) {
      result[key] = this.extractPropertyValue(prop);
    }

    return result;
  }

  private extractPropertyValue(prop: any): any {
    switch (prop.type) {
      case "title":
        return this.extractRichText(prop.title);
      case "rich_text":
        return this.extractRichText(prop.rich_text);
      case "number":
        return prop.number;
      case "select":
        return prop.select?.name || null;
      case "multi_select":
        return prop.multi_select?.map((s: any) => s.name) || [];
      case "date":
        return prop.date;
      case "checkbox":
        return prop.checkbox;
      case "url":
        return prop.url;
      case "email":
        return prop.email;
      case "phone_number":
        return prop.phone_number;
      case "files":
        return prop.files?.map((f: any) => f.file?.url || f.external?.url) || [];
      case "relation":
        return prop.relation?.map((r: any) => r.id) || [];
      case "formula":
        return prop.formula?.[prop.formula?.type];
      case "rollup":
        return prop.rollup?.[prop.rollup?.type];
      case "created_time":
        return prop.created_time;
      case "last_edited_time":
        return prop.last_edited_time;
      case "created_by":
        return prop.created_by;
      case "last_edited_by":
        return prop.last_edited_by;
      case "status":
        return prop.status?.name || null;
      default:
        return null;
    }
  }

  private extractBlockMetadata(block: any): Record<string, any> {
    const type = block.type;
    const data = block[type] || {};
    const metadata: Record<string, any> = {};

    if (data.language) metadata.language = data.language;
    if (data.checked !== undefined) metadata.checked = data.checked;
    if (data.icon) metadata.icon = data.icon?.emoji || data.icon?.external?.url || "";
    if (data.url) metadata.url = data.url;
    if (data.file?.url) metadata.url = data.file.url;
    if (data.external?.url) metadata.url = data.external.url;
    if (data.cells) metadata.cells = data.cells.map((c: any[]) => this.extractRichText(c));

    return metadata;
  }

  clearCache(): void {
    this.cache?.clear();
  }

  invalidatePage(pageId: string): void {
    this.cache?.delete(`page:${pageId}`);
  }
}
