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
const index_1 = require("./tools/index");
function createHttpServer() {
    const fastify = (0, fastify_1.default)({ logger: false });
    // Existing feed handlers...
    const feedHandler = async (_request, _reply) => {
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
    // --- New REST Endpoints for Moltbot and Skills ---
    fastify.get("/accounts/:address/balance", async (request) => {
        const { address } = request.params;
        const trimmedAddress = address.trim();
        console.log(`[HTTP] getBalance for: "${trimmedAddress}" (original: "${address}")`);
        const result = await (0, index_1.getBalance)(trimmedAddress);
        const text = result.content[0].type === 'text' ? result.content[0].text : '';
        const match = text.match(/is ([\d.]+) EGLD/);
        return { balance: match ? match[1] : "0", raw: text };
    });
    return fastify;
}
