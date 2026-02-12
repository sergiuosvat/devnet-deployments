/**
 * Common types for MCP tools
 */

export interface ToolResult {
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError?: boolean;
}
