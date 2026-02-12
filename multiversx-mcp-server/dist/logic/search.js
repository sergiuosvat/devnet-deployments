"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = searchProducts;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../utils/config");
async function searchProducts(query, collection, limit = 5) {
    const params = {
        search: query,
        size: limit,
        type: "NonFungibleESDT,SemiFungibleESDT",
        // We ideally filter by 'onSale' if the API supports it, or we filter results manually
    };
    if (collection) {
        params.collection = collection;
    }
    try {
        // 1. Query Public API for Tokens/NFTs
        // Note: The specific /nfts endpoint supports search.
        const url = `${config_1.config.api_url}/nfts`;
        const response = await axios_1.default.get(url, { params });
        const items = response.data;
        const products = [];
        for (const item of items) {
            // 2. Filter / Validate
            // In a real Passive Indexer, we would check if the current owner is a Whitelisted Contract
            // or if the item has a "sale" attribute.
            // For this MVP, we map the API response directly.
            // Heuristic: Check if basic metadata exists
            if (!item.identifier)
                continue;
            let description = "No description";
            if (item.attributes) {
                description = "Attributes present";
            }
            let price = "Not on sale (or auction)";
            if (item.price) {
                price = `${item.price} atomic units`;
            }
            let imageUrl = "";
            if (item.url) {
                imageUrl = item.url;
            }
            else if (item.thumbnailUrl) {
                imageUrl = item.thumbnailUrl;
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
                    token_identifier: item.identifier.split("-").slice(0, 2).join("-"),
                    trust_level: "public_api",
                },
            });
        }
        return products;
    }
    catch (error) {
        console.error("Search API Error:", error);
        return [];
    }
}
