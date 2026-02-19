import { ContentBlock } from "./types";
export declare class BlockTransformer {
    toHTML(blocks: ContentBlock[]): string;
    toMarkdown(blocks: ContentBlock[]): string;
    private blockToHTML;
    private blockToMarkdown;
    private escapeHTML;
}
