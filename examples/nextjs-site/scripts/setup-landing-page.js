const { Client } = require("@notionhq/client");
require("dotenv").config({ path: ".env.local" });

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const landingPageId = process.env.NOTION_LANDING_PAGE_ID;

async function setupLandingPage() {
  console.log("Setting up landing page with various Notion elements...");
  console.log("Landing Page ID:", landingPageId);

  if (!landingPageId) {
    console.error("NOTION_LANDING_PAGE_ID is not set");
    process.exit(1);
  }

  try {
    // First verify we can access the page
    const page = await notion.pages.retrieve({ page_id: landingPageId });
    console.log("✓ Connected to landing page");

    // Clear existing content by archiving and recreating would be complex,
    // so we'll just append new blocks
    const blocks = [
      // Hero heading
      {
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: "Welcome to Our Platform" } }],
        },
      },
      // Hero paragraph
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { type: "text", text: { content: "Build amazing websites powered by " } },
            { type: "text", text: { content: "Notion CMS" }, annotations: { bold: true } },
            { type: "text", text: { content: ". Edit your content in Notion and see it live on your site." } },
          ],
        },
      },
      // Divider
      { object: "block", type: "divider", divider: {} },
      
      // Features section
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "✨ Features" } }],
        },
      },
      // Callout block
      {
        object: "block",
        type: "callout",
        callout: {
          rich_text: [{ type: "text", text: { content: "Easy to use - Just write in Notion and publish!" } }],
          icon: { type: "emoji", emoji: "💡" },
        },
      },
      // Bulleted list
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { type: "text", text: { content: "Real-time sync" }, annotations: { bold: true } },
            { type: "text", text: { content: " - Content updates automatically" } },
          ],
        },
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { type: "text", text: { content: "Multiple content types" }, annotations: { bold: true } },
            { type: "text", text: { content: " - Blogs, videos, projects, and pages" } },
          ],
        },
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { type: "text", text: { content: "SEO friendly" }, annotations: { bold: true } },
            { type: "text", text: { content: " - Built for performance" } },
          ],
        },
      },
      
      // Quote block
      {
        object: "block",
        type: "quote",
        quote: {
          rich_text: [{ type: "text", text: { content: "The best CMS is the one you already use every day." } }],
        },
      },
      
      // Code block
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "🚀 Quick Start" } }],
        },
      },
      {
        object: "block",
        type: "code",
        code: {
          rich_text: [{ type: "text", text: { content: "npm install notion-cms\n\nimport { NotionCMS } from 'notion-cms';\n\nconst cms = new NotionCMS({\n  auth: process.env.NOTION_TOKEN,\n  databaseId: 'your-database-id'\n});\n\nconst page = await cms.getPageBySlug('hello-world');" } }],
          language: "javascript",
        },
      },
      
      // Numbered list
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "📋 How It Works" } }],
        },
      },
      {
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ type: "text", text: { content: "Create your content in Notion" } }],
        },
      },
      {
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ type: "text", text: { content: "Connect your database to the CMS" } }],
        },
      },
      {
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ type: "text", text: { content: "Deploy your site and enjoy!" } }],
        },
      },
      
      // Toggle block
      {
        object: "block",
        type: "toggle",
        toggle: {
          rich_text: [{ type: "text", text: { content: "Click to see more details..." } }],
          children: [
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [{ type: "text", text: { content: "This is hidden content inside a toggle block! You can use toggles for FAQs, additional details, or collapsible sections." } }],
              },
            },
          ],
        },
      },
      
      // Table
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "📊 Supported Block Types" } }],
        },
      },
      {
        object: "block",
        type: "table",
        table: {
          table_width: 3,
          has_column_header: true,
          has_row_header: false,
          children: [
            {
              type: "table_row",
              table_row: {
                cells: [
                  [{ type: "text", text: { content: "Block Type" } }],
                  [{ type: "text", text: { content: "Status" } }],
                  [{ type: "text", text: { content: "Notes" } }],
                ],
              },
            },
            {
              type: "table_row",
              table_row: {
                cells: [
                  [{ type: "text", text: { content: "Headings" } }],
                  [{ type: "text", text: { content: "✅" } }],
                  [{ type: "text", text: { content: "H1, H2, H3" } }],
                ],
              },
            },
            {
              type: "table_row",
              table_row: {
                cells: [
                  [{ type: "text", text: { content: "Lists" } }],
                  [{ type: "text", text: { content: "✅" } }],
                  [{ type: "text", text: { content: "Bulleted, numbered, todo" } }],
                ],
              },
            },
            {
              type: "table_row",
              table_row: {
                cells: [
                  [{ type: "text", text: { content: "Code" } }],
                  [{ type: "text", text: { content: "✅" } }],
                  [{ type: "text", text: { content: "With syntax highlighting" } }],
                ],
              },
            },
          ],
        },
      },
      
      // Bookmark/link
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "🔗 Learn More" } }],
        },
      },
      {
        object: "block",
        type: "bookmark",
        bookmark: {
          url: "https://developers.notion.com/",
        },
      },
      
      // Footer divider and text
      { object: "block", type: "divider", divider: {} },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { type: "text", text: { content: "Built with ❤️ using " } },
            { type: "text", text: { content: "Notion CMS Framework" }, annotations: { italic: true } },
          ],
        },
      },
    ];

    // Append blocks to the page
    await notion.blocks.children.append({
      block_id: landingPageId,
      children: blocks,
    });

    console.log("✓ Landing page content created!");
    console.log("\n🎉 Setup complete! Refresh your browser to see the landing page.");

  } catch (error) {
    console.error("Error:", error.message);
    if (error.code === "object_not_found") {
      console.error("\n⚠️  Make sure you've shared the page with your integration");
    }
    process.exit(1);
  }
}

setupLandingPage();
