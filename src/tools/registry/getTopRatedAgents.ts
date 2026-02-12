import { z } from "zod";
import { ToolResult } from "../types";
import { loadNetworkConfig, createNetworkProvider } from "../networkConfig";
import { REGISTRY_ADDRESSES } from "../../utils/registryConfig";

interface NftItem {
    identifier: string;
    name: string;
    nonce: number;
    url: string;
}

/**
 * Returns a list of agents with the highest reputation scores.
 */
export async function getTopRatedAgents(
    category: string,
    limit: number = 5
): Promise<ToolResult> {
    const config = loadNetworkConfig();
    const api = createNetworkProvider(config);

    try {
        // In a real production scenario with many agents, this would use an indexer.
        // For now, we fetch a few and query their reputation.
        // Fetch recent agent NFTs to find active agents
        const items: NftItem[] = await api.doGetGeneric(
            `nfts?size=20&type=NonFungibleESDT`
        );

        const agentRatings = [];

        for (const item of items) {
            try {
                const nonce = item.nonce;
                const scoreResponse = await api.doGetGeneric(`accounts/${REGISTRY_ADDRESSES.REPUTATION}/vm-values/reputationScore?args=${nonce}`);

                let score = 0;
                if (scoreResponse?.data?.data?.returnData?.[0]) {
                    // BigUint decoding (approximate to number for sorting)
                    const hex = Buffer.from(scoreResponse.data.data.returnData[0], "base64").toString("hex");
                    score = parseInt(hex, 16) || 0;
                }

                agentRatings.push({
                    id: item.identifier,
                    name: item.name,
                    nonce: nonce,
                    reputation_score: score,
                    uri: item.url
                });
            } catch {
                // Skip if reputation fetch fails
            }
        }

        // Sort by score descending
        const topAgents = agentRatings
            .sort((a, b) => b.reputation_score - a.reputation_score)
            .slice(0, limit);

        return {
            content: [{ type: "text", text: JSON.stringify(topAgents, null, 2) }]
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [{ type: "text", text: `Error fetching top rated agents: ${message}` }]
        };
    }
}

export const getTopRatedAgentsToolName = "get-top-rated-agents";
export const getTopRatedAgentsToolDescription = "Get the highest rated agents from the registry";
export const getTopRatedAgentsParamScheme = {
    category: z.string().describe("Agent category (e.g. 'shopping', 'finance') or 'all'"),
    limit: z.number().optional().default(5).describe("Maximum number of agents to return"),
};
