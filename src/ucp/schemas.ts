
import { z } from "zod";

// Define Zod schemas to allow runtime validation against official specs
// Based on common "Agentic Commerce" patterns found in research
export const UCPCapabilitySchema = z.object({
    endpoint: z.string().optional(),
    description: z.string(),
    schema: z.any().optional(),
    mcp_tool_name: z.string().optional(), // Extension for MCP mapping
});

export const UCPManifestSchema = z.object({
    ucp_version: z.string(),
    id: z.string(),
    name: z.string(),
    description: z.string(),
    capabilities: z.record(z.string(), UCPCapabilitySchema),
});

export type UCPManifest = z.infer<typeof UCPManifestSchema>;
export type UCPCapability = z.infer<typeof UCPCapabilitySchema>;
