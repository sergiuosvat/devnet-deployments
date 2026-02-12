import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables for the test process
dotenv.config();

export async function createE2eClient(extraEnv: Record<string, string> = {}) {
    const transport = new StdioClientTransport({
        command: "npx",
        args: ["ts-node", path.join(process.cwd(), "src/index.ts")],
        env: { ...process.env, MVX_NETWORK: process.env.MVX_NETWORK || "devnet", ...extraEnv }
    });

    const client = new Client(
        { name: "e2e-test-client", version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    return { client, transport };
}
