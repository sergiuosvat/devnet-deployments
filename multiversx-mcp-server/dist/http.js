"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpServer = createHttpServer;
const fastify_1 = __importDefault(require("fastify"));
const searchProducts_1 = require("./tools/searchProducts");
const whitelistRegistry_1 = require("./utils/whitelistRegistry");
const manifest_1 = require("./ucp/manifest");
function createHttpServer() {
    const fastify = (0, fastify_1.default)({ logger: false });
    const feedHandler = async (_request, _reply) => {
        // 1. Fetch products from all whitelisted collections
        const whitelist = (0, whitelistRegistry_1.loadWhitelist)();
        const allProducts = [];
        for (const collectionId of whitelist) {
            try {
                const result = await (0, searchProducts_1.searchProducts)("EGLD", collectionId, 20);
                const products = JSON.parse(result.content[0].text);
                allProducts.push(...products);
            }
            catch (e) {
                console.error(`Error fetching products for ${collectionId}:`, e);
            }
        }
        // 2. Map to Google Merchant Center Feed Schema (JSON)
        const feedItems = allProducts.map((p) => ({
            id: p.id,
            title: p.name,
            description: p.description,
            link: `https://xexchange.com/nft/${p.id}`,
            image_link: p.image_url,
            availability: p.availability,
            price: {
                value: p.price.split(" ")[0],
                currency: "EGLD"
            },
            brand: "MultiversX",
            condition: "new"
        }));
        return { items: feedItems };
    };
    fastify.get("/feed.json", feedHandler);
    fastify.get("/.well-known/acp/products.json", feedHandler);
    fastify.get("/.well-known/ucp", async () => {
        return manifest_1.MULTIVERSX_UCP_MANIFEST;
    });
    fastify.get("/health", async () => {
        return { status: "ok", service: "multiversx-mcp-server-http" };
    });
    return fastify;
}
