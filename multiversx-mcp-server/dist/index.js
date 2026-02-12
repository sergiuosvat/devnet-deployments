#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const server_1 = require("./server");
const http_1 = require("./http");
const HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3000;
/**
 * Main Entry Point
 */
async function main() {
    const mode = process.argv[2]; // 'http' or 'mcp' (default)
    if (mode === "http") {
        const app = (0, http_1.createHttpServer)();
        try {
            await app.listen({ port: HTTP_PORT, host: "0.0.0.0" });
            console.log(`HTTP Server running on port ${HTTP_PORT}`);
        }
        catch (err) {
            app.log.error(err);
            process.exit(1);
        }
    }
    else {
        // Default to MCP Stdio Transport
        const server = (0, server_1.createMcpServer)();
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
        console.error("MCP Server running on stdio");
    }
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
