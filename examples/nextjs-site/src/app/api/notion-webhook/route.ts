import { NextRequest, NextResponse } from "next/server";
import { NotionWebhook } from "notion-cms";
import { cms } from "@/lib/notion";

const webhook = new NotionWebhook({
  secret: process.env.NOTION_WEBHOOK_SECRET || "",
  onPageUpdate: async (event) => {
    console.log("Page updated:", event.data.page_id);
    if (event.data.page_id) {
      cms.invalidatePage(event.data.page_id);
    }
  },
  onPageCreate: async (event) => {
    console.log("New page created:", event.data.page_id);
  },
  onPageDelete: async (event) => {
    console.log("Page deleted:", event.data.page_id);
    if (event.data.page_id) {
      cms.invalidatePage(event.data.page_id);
    }
  },
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const result = await webhook.handleRequest({ body, headers });

  return NextResponse.json(result.body, { status: result.status });
}
