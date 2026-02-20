import { NotionCMSConfig, PageContent, DatabaseQueryOptions, CMSPage, CMSCollection } from "./types";
export declare class NotionCMS {
    private client;
    private cache;
    private transformer;
    private databaseId?;
    constructor(config: NotionCMSConfig);
    getPage(pageId: string): Promise<PageContent>;
    getDatabase(databaseId?: string, options?: DatabaseQueryOptions): Promise<CMSCollection>;
    getPageBySlug(slug: string, databaseId?: string): Promise<PageContent | null>;
    getAllPages(databaseId?: string): Promise<CMSPage[]>;
    private getAllBlocks;
    private parseBlocks;
    private parseBlock;
    private extractRichText;
    private extractPlainText;
    private escapeText;
    private extractTitle;
    private extractSlug;
    private extractProperties;
    private extractPropertyValue;
    private extractBlockMetadata;
    clearCache(): void;
    invalidatePage(pageId: string): void;
}
