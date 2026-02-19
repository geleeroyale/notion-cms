const { Client } = require("@notionhq/client");
require("dotenv").config({ path: ".env.local" });

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function setupDatabase() {
  console.log("Setting up Notion database properties...");
  console.log("Database ID:", databaseId);

  try {
    // First, try to retrieve the database to verify connection
    const db = await notion.databases.retrieve({ database_id: databaseId });
    console.log("✓ Connected to database:", db.title?.[0]?.plain_text || "Untitled");

    // Update database with required properties
    const response = await notion.databases.update({
      database_id: databaseId,
      properties: {
        // Title is automatically created, but we ensure it exists
        Name: {
          title: {},
        },
        Slug: {
          rich_text: {},
        },
        Type: {
          select: {
            options: [
              { name: "blog", color: "blue" },
              { name: "video", color: "red" },
              { name: "project", color: "green" },
              { name: "page", color: "gray" },
            ],
          },
        },
        Description: {
          rich_text: {},
        },
        Published: {
          date: {},
        },
        Tags: {
          multi_select: {
            options: [
              { name: "featured", color: "yellow" },
              { name: "tutorial", color: "blue" },
              { name: "announcement", color: "purple" },
            ],
          },
        },
        VideoURL: {
          url: {},
        },
      },
    });

    console.log("✓ Database properties updated successfully!");
    console.log("\nProperties added:");
    Object.keys(response.properties).forEach((prop) => {
      console.log(`  - ${prop} (${response.properties[prop].type})`);
    });

    // Create a sample blog post
    console.log("\nCreating sample content...");
    
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ text: { content: "Welcome to the CMS" } }],
        },
        Slug: {
          rich_text: [{ text: { content: "welcome" } }],
        },
        Type: {
          select: { name: "blog" },
        },
        Description: {
          rich_text: [{ text: { content: "Your first blog post powered by Notion CMS" } }],
        },
        Published: {
          date: { start: new Date().toISOString().split("T")[0] },
        },
        Tags: {
          multi_select: [{ name: "featured" }],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: "This is your first blog post! Edit this page in Notion to update the content." } }],
          },
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Getting Started" } }],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: "Add more pages to your Notion database and they will automatically appear on your website." } }],
          },
        },
      ],
    });

    console.log("✓ Sample blog post created!");
    console.log("\n🎉 Setup complete! Refresh your browser to see the content.");

  } catch (error) {
    console.error("Error:", error.message);
    if (error.code === "object_not_found") {
      console.error("\n⚠️  Make sure you've shared the database with your integration:");
      console.error("   1. Open the database in Notion");
      console.error("   2. Click '...' menu → 'Connections'");
      console.error("   3. Add your integration");
    }
    process.exit(1);
  }
}

setupDatabase();
