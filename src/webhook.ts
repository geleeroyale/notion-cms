import { createHmac } from "crypto";

export type WebhookEventType = 
  | "page.created"
  | "page.content_updated"
  | "page.properties_updated"
  | "page.deleted"
  | "page.restored"
  | "page.moved"
  | "page.locked"
  | "page.unlocked"
  | "database.created"
  | "database.content_updated"
  | "database.properties_updated"
  | "database.deleted"
  | "database.restored"
  | "database.moved";

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

export class NotionWebhook {
  private secret: string;
  private handlers: Map<string, WebhookHandler[]> = new Map();

  constructor(config: WebhookConfig) {
    this.secret = config.secret;

    if (config.onPageUpdate) {
      this.on("page.content_updated", config.onPageUpdate);
      this.on("page.properties_updated", config.onPageUpdate);
    }
    if (config.onPageCreate) {
      this.on("page.created", config.onPageCreate);
    }
    if (config.onPageDelete) {
      this.on("page.deleted", config.onPageDelete);
    }
    if (config.onDatabaseUpdate) {
      this.on("database.content_updated", config.onDatabaseUpdate);
      this.on("database.properties_updated", config.onDatabaseUpdate);
    }
    if (config.onAnyEvent) {
      this.on("*", config.onAnyEvent);
    }
  }

  on(eventType: WebhookEventType | "*", handler: WebhookHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  off(eventType: WebhookEventType | "*", handler: WebhookHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.handlers.set(eventType, handlers);
    }
  }

  verifySignature(payload: string, signature: string, timestamp: string): boolean {
    const signaturePayload = `v0:${timestamp}:${payload}`;
    const expectedSignature = createHmac("sha256", this.secret)
      .update(signaturePayload)
      .digest("hex");
    return `v0=${expectedSignature}` === signature;
  }

  async handleRequest(request: {
    body: string | WebhookPayload;
    headers: Record<string, string | undefined>;
  }): Promise<{ status: number; body: any }> {
    const signature = request.headers["x-notion-signature"] || request.headers["X-Notion-Signature"];
    const timestamp = request.headers["x-notion-timestamp"] || request.headers["X-Notion-Timestamp"];

    const bodyString = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
    const payload: WebhookPayload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;

    // URL verification challenge
    if (payload.type === "url_verification") {
      return {
        status: 200,
        body: { challenge: payload.verification_token },
      };
    }

    // Verify signature for event webhooks
    if (signature && timestamp) {
      if (!this.verifySignature(bodyString, signature, timestamp)) {
        return { status: 401, body: { error: "Invalid signature" } };
      }
    }

    // Process event
    if (payload.type === "event" && payload.event) {
      await this.processEvent(payload.event);
    }

    return { status: 200, body: { ok: true } };
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    // Call specific handlers
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      await handler(event);
    }

    // Call wildcard handlers
    const wildcardHandlers = this.handlers.get("*") || [];
    for (const handler of wildcardHandlers) {
      await handler(event);
    }
  }

  // Express/Connect middleware
  middleware() {
    return async (req: any, res: any, next?: () => void) => {
      try {
        let body = req.body;
        if (typeof body !== "string" && Buffer.isBuffer(body)) {
          body = body.toString("utf-8");
        }

        const result = await this.handleRequest({
          body,
          headers: req.headers,
        });

        res.status(result.status).json(result.body);
      } catch (error) {
        if (next) {
          next();
        } else {
          res.status(500).json({ error: "Internal server error" });
        }
      }
    };
  }

  // Next.js API route handler
  nextApiHandler() {
    return async (req: any, res: any) => {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const result = await this.handleRequest({
        body: req.body,
        headers: req.headers,
      });

      return res.status(result.status).json(result.body);
    };
  }

  // Next.js App Router handler
  nextAppHandler() {
    return async (request: Request) => {
      const body = await request.text();
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const result = await this.handleRequest({ body, headers });

      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    };
  }
}
