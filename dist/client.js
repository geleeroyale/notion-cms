"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionCMS = void 0;
const client_1 = require("@notionhq/client");
const cache_1 = require("./cache");
const transformer_1 = require("./transformer");
class NotionCMS {
    constructor(config) {
        this.client = new client_1.Client({ auth: config.auth });
        this.databaseId = config.databaseId;
        this.transformer = new transformer_1.BlockTransformer();
        if (config.cache?.enabled) {
            this.cache = new cache_1.SimpleCache(config.cache.ttl || 300);
        }
        else {
            this.cache = null;
        }
    }
    async getPage(pageId) {
        const cacheKey = `page:${pageId}`;
        if (this.cache?.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const page = await this.client.pages.retrieve({ page_id: pageId });
        const blocks = await this.getAllBlocks(pageId);
        const contentBlocks = await this.parseBlocks(blocks);
        const pageContent = {
            id: pageId,
            title: this.extractTitle(page),
            properties: this.extractProperties(page),
            content: contentBlocks,
            html: this.transformer.toHTML(contentBlocks),
            markdown: this.transformer.toMarkdown(contentBlocks),
            lastEdited: page.last_edited_time,
            createdTime: page.created_time,
        };
        this.cache?.set(cacheKey, pageContent);
        return pageContent;
    }
    async getDatabase(databaseId, options = {}) {
        const dbId = databaseId || this.databaseId;
        if (!dbId) {
            throw new Error("Database ID is required");
        }
        const cacheKey = `db:${dbId}:${JSON.stringify(options)}`;
        if (this.cache?.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const response = await this.client.databases.query({
            database_id: dbId,
            filter: options.filter,
            sorts: options.sorts,
            page_size: options.pageSize || 100,
            start_cursor: options.startCursor,
        });
        const pages = response.results.map((page) => ({
            id: page.id,
            slug: this.extractSlug(page),
            title: this.extractTitle(page),
            properties: this.extractProperties(page),
        }));
        const collection = {
            pages,
            hasMore: response.has_more,
            nextCursor: response.next_cursor,
        };
        this.cache?.set(cacheKey, collection);
        return collection;
    }
    async getPageBySlug(slug, databaseId) {
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
    async getAllPages(databaseId) {
        const allPages = [];
        let cursor;
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
    async getAllBlocks(blockId) {
        const blocks = [];
        let cursor;
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
    async parseBlocks(blocks) {
        const contentBlocks = [];
        for (const block of blocks) {
            const contentBlock = await this.parseBlock(block);
            contentBlocks.push(contentBlock);
        }
        return contentBlocks;
    }
    async parseBlock(block) {
        const type = block.type;
        const blockData = block[type] || {};
        let children;
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
    extractRichText(richText) {
        if (!Array.isArray(richText))
            return "";
        return richText.map((t) => t.plain_text || "").join("");
    }
    extractTitle(page) {
        const props = page.properties || {};
        for (const key of Object.keys(props)) {
            const prop = props[key];
            if (prop.type === "title" && prop.title) {
                return this.extractRichText(prop.title);
            }
        }
        return "";
    }
    extractSlug(page) {
        const props = page.properties || {};
        if (props.Slug?.rich_text) {
            return this.extractRichText(props.Slug.rich_text);
        }
        const title = this.extractTitle(page);
        return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    extractProperties(page) {
        const props = page.properties || {};
        const result = {};
        for (const [key, prop] of Object.entries(props)) {
            result[key] = this.extractPropertyValue(prop);
        }
        return result;
    }
    extractPropertyValue(prop) {
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
                return prop.multi_select?.map((s) => s.name) || [];
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
                return prop.files?.map((f) => f.file?.url || f.external?.url) || [];
            case "relation":
                return prop.relation?.map((r) => r.id) || [];
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
    extractBlockMetadata(block) {
        const type = block.type;
        const data = block[type] || {};
        const metadata = {};
        if (data.language)
            metadata.language = data.language;
        if (data.checked !== undefined)
            metadata.checked = data.checked;
        if (data.icon)
            metadata.icon = data.icon?.emoji || data.icon?.external?.url || "";
        if (data.url)
            metadata.url = data.url;
        if (data.file?.url)
            metadata.url = data.file.url;
        if (data.external?.url)
            metadata.url = data.external.url;
        if (data.cells)
            metadata.cells = data.cells.map((c) => this.extractRichText(c));
        return metadata;
    }
    clearCache() {
        this.cache?.clear();
    }
    invalidatePage(pageId) {
        this.cache?.delete(`page:${pageId}`);
    }
}
exports.NotionCMS = NotionCMS;
