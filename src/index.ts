#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer, MCP_SERVER_NAME } from "./server";
import { createHttpServer } from "./http";

const HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3000;


/**
 * Main Entry Point
 */
async function main() {
    const mode = process.argv[2]; // 'http' or 'mcp' (default)

    if (mode === "http") {
        const app = createHttpServer();
        try {
            await app.listen({ port: HTTP_PORT, host: "0.0.0.0" });
            console.log(`HTTP Server running on port ${HTTP_PORT}`);
        } catch (err) {
            app.log.error(err);
            process.exit(1);
        }
    } else {
        // Default to MCP Stdio Transport
        const server = createMcpServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("MCP Server running on stdio");
    }
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
