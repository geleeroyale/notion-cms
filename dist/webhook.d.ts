export type WebhookEventType = "page.created" | "page.content_updated" | "page.properties_updated" | "page.deleted" | "page.restored" | "page.moved" | "page.locked" | "page.unlocked" | "database.created" | "database.content_updated" | "database.properties_updated" | "database.deleted" | "database.restored" | "database.moved";
export interface WebhookEvent {
    type: WebhookEventType;
    timestamp: string;
    workspace_id: string;
    data: {
        page_id?: string;
        database_id?: string;
        parent?: {
            type: string;
            page_id?: string;
            database_id?: string;
            workspace?: boolean;
        };
    };
}
export interface WebhookPayload {
    verification_token?: string;
    type: "url_verification" | "event";
    event?: WebhookEvent;
}
export type WebhookHandler = (event: WebhookEvent) => void | Promise<void>;
export interface WebhookConfig {
    secret: string;
    onPageUpdate?: WebhookHandler;
    onPageCreate?: WebhookHandler;
    onPageDelete?: WebhookHandler;
    onDatabaseUpdate?: WebhookHandler;
    onAnyEvent?: WebhookHandler;
}
export declare class NotionWebhook {
    private secret;
    private handlers;
    constructor(config: WebhookConfig);
    on(eventType: WebhookEventType | "*", handler: WebhookHandler): void;
    off(eventType: WebhookEventType | "*", handler: WebhookHandler): void;
    verifySignature(payload: string, signature: string, timestamp: string): boolean;
    handleRequest(request: {
        body: string | WebhookPayload;
        headers: Record<string, string | undefined>;
    }): Promise<{
        status: number;
        body: any;
    }>;
    private processEvent;
    middleware(): (req: any, res: any, next?: () => void) => Promise<void>;
    nextApiHandler(): (req: any, res: any) => Promise<any>;
    nextAppHandler(): (request: Request) => Promise<import("undici-types").Response>;
}
