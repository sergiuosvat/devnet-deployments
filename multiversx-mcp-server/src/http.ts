import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { searchProducts } from "./tools/searchProducts";
import { loadWhitelist } from "./utils/whitelistRegistry";
import { MULTIVERSX_UCP_MANIFEST } from "./ucp/manifest";
import { ToolResult } from "./tools/types";

interface ProductItem {
    id: string;
    name: string;
    description: string;
    image_url: string;
    availability: string;
    price: string;
}

export function createHttpServer() {
    const fastify = Fastify({ logger: false });

    const feedHandler = async (_request: FastifyRequest, _reply: FastifyReply) => {
        // 1. Fetch products from all whitelisted collections
        const whitelist = loadWhitelist();
        const allProducts: ProductItem[] = [];

        for (const collectionId of whitelist) {
            try {
                const result: ToolResult = await searchProducts("EGLD", collectionId, 20);
                const products = JSON.parse(result.content[0].text) as ProductItem[];
                allProducts.push(...products);
            } catch (e) {
                console.error(`Error fetching products for ${collectionId}:`, e);
            }
        }

        // 2. Map to Google Merchant Center Feed Schema (JSON)
        const feedItems = allProducts.map((p: ProductItem) => ({
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
        return MULTIVERSX_UCP_MANIFEST;
    });

    fastify.get("/health", async () => {
        return { status: "ok", service: "multiversx-mcp-server-http" };
    });

    return fastify;
}
