"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionWebhook = void 0;
const crypto_1 = require("crypto");
class NotionWebhook {
    constructor(config) {
        this.handlers = new Map();
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
    on(eventType, handler) {
        const handlers = this.handlers.get(eventType) || [];
        handlers.push(handler);
        this.handlers.set(eventType, handlers);
    }
    off(eventType, handler) {
        const handlers = this.handlers.get(eventType) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
            this.handlers.set(eventType, handlers);
        }
    }
    verifySignature(payload, signature, timestamp) {
        const signaturePayload = `v0:${timestamp}:${payload}`;
        const expectedSignature = (0, crypto_1.createHmac)("sha256", this.secret)
            .update(signaturePayload)
            .digest("hex");
        return `v0=${expectedSignature}` === signature;
    }
    async handleRequest(request) {
        const signature = request.headers["x-notion-signature"] || request.headers["X-Notion-Signature"];
        const timestamp = request.headers["x-notion-timestamp"] || request.headers["X-Notion-Timestamp"];
        const bodyString = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
        const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
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
    async processEvent(event) {
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
        return async (req, res, next) => {
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
            }
            catch (error) {
                if (next) {
                    next();
                }
                else {
                    res.status(500).json({ error: "Internal server error" });
                }
            }
        };
    }
    // Next.js API route handler
    nextApiHandler() {
        return async (req, res) => {
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
        return async (request) => {
            const body = await request.text();
            const headers = {};
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
exports.NotionWebhook = NotionWebhook;
