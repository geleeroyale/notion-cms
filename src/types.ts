export interface NotionCMSConfig {
  auth: string;
  databaseId?: string;
  cache?: CacheConfig;
}

export interface CacheConfig {
  enabled: boolean;
  ttl?: number; // Time to live in seconds
}

export interface PageContent {
  id: string;
  title: string;
  properties: Record<string, any>;
  content: ContentBlock[];
  html: string;
  markdown: string;
  lastEdited: string;
  createdTime: string;
}

export interface ContentBlock {
  id: string;
  type: string;
  content: string;
  children?: ContentBlock[];
  metadata?: Record<string, any>;
}

export interface DatabaseQueryOptions {
  filter?: any;
  sorts?: any[];
  pageSize?: number;
  startCursor?: string;
}

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  properties: Record<string, any>;
  content?: PageContent;
}

export interface CMSCollection {
  pages: CMSPage[];
  hasMore: boolean;
  nextCursor: string | null;
}
