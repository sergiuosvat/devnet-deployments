/**
 * Search for NFTs/SFTs (Products)
 */

import { z } from "zod";
import axios from "axios";
import { ToolResult } from "./types";
import { loadNetworkConfig } from "./networkConfig";
import { isWhitelisted } from "../utils/whitelistRegistry";

interface Product {
    id: string; // TokenIdentifier-Nonce
    name: string;
    description: string;
    price: string;
    image_url: string;
    availability: string;
    metadata: {
        nonce: number;
        token_identifier: string;
        trust_level: string;
        last_updated?: string;
    };
}

interface ApiNftItem {
    identifier: string;
    name: string;
    attributes: string;
    price: string;
    url: string;
    thumbnailUrl: string;
    collection: string;
    nonce: number;
}

/**
 * Search for NFTs/SFTs using the MultiversX API.
 * Uses axios directly as SDK doesn't expose full NFT search with all params easily.
 */
export async function searchProducts(
    query: string,
    collection?: string,
    limit: number = 5
): Promise<ToolResult> {
    const config = loadNetworkConfig();
    const params: Record<string, string | number> = {
        search: query,
        size: limit,
        type: "NonFungibleESDT,SemiFungibleESDT",
    };

    if (collection) {
        params.collection = collection;
    }

    try {
        const url = `${config.apiUrl}/nfts`;
        const response = await axios.get(url, { params });
        const items = response.data as ApiNftItem[];

        const products: Product[] = [];

        for (const item of items) {
            if (!item.identifier) continue;

            let description = "No description";
            if (item.attributes) {
                description = "Attributes present";
            }

            let price = "Not on sale";
            if (item.price) {
                price = `${item.price} atomic units`;
            }

            let imageUrl = "";
            if (item.url) {
                imageUrl = item.url;
            } else if (item.thumbnailUrl) {
                imageUrl = item.thumbnailUrl;
            }

            const collectionId = item.collection || item.identifier.split("-").slice(0, 2).join("-");
            if (!isWhitelisted(collectionId)) {
                // skip non-whitelisted items
                continue;
            }

            products.push({
                id: `${item.identifier}`,
                name: item.name,
                description: description,
                price: price,
                image_url: imageUrl,
                availability: "in_stock",
                metadata: {
                    nonce: item.nonce,
                    token_identifier: collectionId,
                    trust_level: "verified_marketplace",
                    last_updated: new Date().toISOString(),
                },
            });
        }

        return {
            content: [{ type: "text", text: JSON.stringify(products, null, 2) }],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ error: `Search API Error: ${message}`, results: [] }),
                },
            ],
        };
    }
}

export const searchProductsToolName = "search-products";
export const searchProductsToolDescription = "Search for NFTs/SFTs (products) on MultiversX";
export const searchProductsParamScheme = {
    query: z.string().describe("Search query string"),
    collection: z.string().optional().describe("Filter by collection identifier"),
    limit: z.number().optional().default(5).describe("Max results to return"),
};
