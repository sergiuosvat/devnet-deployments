import { z } from "zod";
import axios from "axios";
import { ToolResult } from "../types";
import { loadNetworkConfig } from "../networkConfig";

/**
 * Searches for agents based on a query string.
 * It searches through Agent NFTs on the MultiversX network.
 */
interface NftItem {
    identifier: string;
    name: string;
    nonce: number;
    owner: string;
    url: string;
    collection: string;
    timestamp: number;
}

export async function searchAgents(
    query: string,
    minTrust?: number,
    limit: number = 5
): Promise<ToolResult> {
    const config = loadNetworkConfig();

    try {
        const params: Record<string, string | number> = {
            search: query,
            size: limit,
            type: "NonFungibleESDT",
        };

        const url = `${config.apiUrl}/nfts`;
        const response = await axios.get(url, { params });
        const items = response.data as NftItem[];

        // In a production environment, we would also filter by the specific Agent token collection.
        // For now, we return matching NFTs which can represent agents.
        let agents = items.map((item: NftItem) => ({
            id: item.identifier,
            name: item.name,
            nonce: item.nonce,
            owner: item.owner,
            uri: item.url,
            collection: item.collection,
            timestamp: item.timestamp,
            // Mock reputation for search results (ideally fetched from Reputation Registry)
            reputation_score: 85.0
        }));

        // Apply minTrust filter if provided
        if (minTrust !== undefined) {
            agents = agents.filter(a => a.reputation_score >= minTrust);
        }

        if (agents.length === 0) {
            return {
                content: [{ type: "text", text: `No agents found matching query: "${query}"` }]
            };
        }

        return {
            content: [{ type: "text", text: JSON.stringify(agents, null, 2) }]
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [{ type: "text", text: `Error searching for agents: ${message}` }]
        };
    }
}

export const searchAgentsToolName = "search-agents";
export const searchAgentsToolDescription = "Search for agents by name, capability, or keyword";
export const searchAgentsParamScheme = {
    query: z.string().describe("The search query (e.g., 'shopper', 'oracle', 'data collector')"),
    minTrust: z.number().optional().describe("Minimum reputation score (1-100)"),
    limit: z.number().optional().default(5).describe("Maximum number of agents to return"),
};
