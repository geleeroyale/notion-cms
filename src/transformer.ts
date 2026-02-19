import { ContentBlock } from "./types";

export class BlockTransformer {
  
  toHTML(blocks: ContentBlock[]): string {
    return blocks.map(block => this.blockToHTML(block)).join("\n");
  }

  toMarkdown(blocks: ContentBlock[]): string {
    return blocks.map(block => this.blockToMarkdown(block)).join("\n\n");
  }

  private blockToHTML(block: ContentBlock): string {
    const childrenHTML = block.children 
      ? block.children.map(b => this.blockToHTML(b)).join("\n") 
      : "";

    switch (block.type) {
      case "paragraph":
        return `<p>${this.escapeHTML(block.content)}</p>`;
      
      case "heading_1":
        return `<h1>${this.escapeHTML(block.content)}</h1>`;
      
      case "heading_2":
        return `<h2>${this.escapeHTML(block.content)}</h2>`;
      
      case "heading_3":
        return `<h3>${this.escapeHTML(block.content)}</h3>`;
      
      case "bulleted_list_item":
        return `<li>${this.escapeHTML(block.content)}${childrenHTML ? `<ul>${childrenHTML}</ul>` : ""}</li>`;
      
      case "numbered_list_item":
        return `<li>${this.escapeHTML(block.content)}${childrenHTML ? `<ol>${childrenHTML}</ol>` : ""}</li>`;
      
      case "to_do":
        const checked = block.metadata?.checked ? "checked" : "";
        return `<div class="todo"><input type="checkbox" ${checked} disabled />${this.escapeHTML(block.content)}</div>`;
      
      case "toggle":
        return `<details><summary>${this.escapeHTML(block.content)}</summary>${childrenHTML}</details>`;
      
      case "code":
        const lang = block.metadata?.language || "";
        return `<pre><code class="language-${lang}">${this.escapeHTML(block.content)}</code></pre>`;
      
      case "quote":
        return `<blockquote>${this.escapeHTML(block.content)}</blockquote>`;
      
      case "callout":
        const icon = block.metadata?.icon || "";
        return `<div class="callout">${icon} ${this.escapeHTML(block.content)}</div>`;
      
      case "divider":
        return `<hr />`;
      
      case "image":
        const url = block.metadata?.url || "";
        const caption = block.content || "";
        return `<figure><img src="${url}" alt="${this.escapeHTML(caption)}" />${caption ? `<figcaption>${this.escapeHTML(caption)}</figcaption>` : ""}</figure>`;
      
      case "video":
        return `<video src="${block.metadata?.url || ""}" controls></video>`;
      
      case "embed":
        return `<iframe src="${block.metadata?.url || ""}" frameborder="0"></iframe>`;
      
      case "bookmark":
        return `<a href="${block.metadata?.url || ""}" class="bookmark">${this.escapeHTML(block.content || block.metadata?.url || "")}</a>`;
      
      case "table":
        return `<table>${childrenHTML}</table>`;
      
      case "table_row":
        const cells = block.metadata?.cells || [];
        return `<tr>${cells.map((c: string) => `<td>${this.escapeHTML(c)}</td>`).join("")}</tr>`;
      
      default:
        return `<div class="block-${block.type}">${this.escapeHTML(block.content)}</div>`;
    }
  }

  private blockToMarkdown(block: ContentBlock): string {
    const childrenMD = block.children 
      ? block.children.map(b => this.blockToMarkdown(b)).map(s => "  " + s).join("\n") 
      : "";

    switch (block.type) {
      case "paragraph":
        return block.content;
      
      case "heading_1":
        return `# ${block.content}`;
      
      case "heading_2":
        return `## ${block.content}`;
      
      case "heading_3":
        return `### ${block.content}`;
      
      case "bulleted_list_item":
        return `- ${block.content}${childrenMD ? `\n${childrenMD}` : ""}`;
      
      case "numbered_list_item":
        return `1. ${block.content}${childrenMD ? `\n${childrenMD}` : ""}`;
      
      case "to_do":
        const checkbox = block.metadata?.checked ? "[x]" : "[ ]";
        return `- ${checkbox} ${block.content}`;
      
      case "toggle":
        return `<details>\n<summary>${block.content}</summary>\n\n${childrenMD}\n</details>`;
      
      case "code":
        const lang = block.metadata?.language || "";
        return `\`\`\`${lang}\n${block.content}\n\`\`\``;
      
      case "quote":
        return `> ${block.content}`;
      
      case "callout":
        const icon = block.metadata?.icon || "💡";
        return `> ${icon} ${block.content}`;
      
      case "divider":
        return `---`;
      
      case "image":
        const caption = block.content || "image";
        return `![${caption}](${block.metadata?.url || ""})`;
      
      case "video":
        return `[Video](${block.metadata?.url || ""})`;
      
      case "embed":
        return `[Embed](${block.metadata?.url || ""})`;
      
      case "bookmark":
        return `[${block.content || "Link"}](${block.metadata?.url || ""})`;
      
      case "table":
        return childrenMD;
      
      case "table_row":
        const cells = block.metadata?.cells || [];
        return `| ${cells.join(" | ")} |`;
      
      default:
        return block.content;
    }
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
