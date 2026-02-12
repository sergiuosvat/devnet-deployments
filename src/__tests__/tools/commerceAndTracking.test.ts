import { trackTransaction } from "../../tools/trackTransaction";
import { searchProducts } from "../../tools/searchProducts";
import { isWhitelisted } from "../../utils/whitelistRegistry";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../utils/whitelistRegistry", () => ({
    isWhitelisted: jest.fn().mockReturnValue(true)
}));

jest.mock("../../tools/networkConfig", () => ({
    loadNetworkConfig: jest.fn().mockReturnValue({ apiUrl: "https://api.multiversx.com", chainId: "1" }),
    createNetworkProvider: jest.fn().mockReturnValue({
        getTransaction: jest.fn().mockResolvedValue({
            status: { toString: () => "success" },
            receiver: { toString: () => "erd1-marketplace" }
        })
    })
}));

describe("Commerce and Tracking Tools", () => {
    describe("track-transaction", () => {
        it("should return success for a completed transaction", async () => {
            const result = await trackTransaction("hash");
            const status = JSON.parse(result.content[0].text);
            expect(status.status).toBe("success");
            expect(status.trusted).toBe(true);
        });

        it("should handle 404 from API as pending", async () => {
            const { createNetworkProvider } = require("../../tools/networkConfig");
            (createNetworkProvider().getTransaction as jest.Mock).mockRejectedValue({
                response: { status: 404 }
            });

            const result = await trackTransaction("hash");
            const status = JSON.parse(result.content[0].text);
            expect(status.status).toBe("pending");
        });

        it("should handle general errors", async () => {
            const { createNetworkProvider } = require("../../tools/networkConfig");
            (createNetworkProvider().getTransaction as jest.Mock).mockRejectedValue(new Error("Network Error"));

            const result = await trackTransaction("hash");
            expect(result.content[0].text).toContain("Error tracking transaction: Network Error");
        });
    });

    describe("search-products", () => {
        it("should return products matching the query", async () => {
            mockedAxios.get.mockResolvedValue({
                data: [
                    {
                        identifier: "COL-1-01",
                        name: "Product 1",
                        attributes: "attr",
                        price: "100",
                        url: "url1",
                        collection: "COL-1",
                        nonce: 1
                    }
                ]
            });

            const result = await searchProducts("query");
            const products = JSON.parse(result.content[0].text);
            expect(products).toHaveLength(1);
            expect(products[0].name).toBe("Product 1");
        });

        it("should filter out non-whitelisted collections", async () => {
            (isWhitelisted as jest.Mock).mockReturnValueOnce(false);
            mockedAxios.get.mockResolvedValue({
                data: [{ identifier: "COL-FAKE-01", collection: "COL-FAKE" }]
            });

            const result = await searchProducts("query");
            const products = JSON.parse(result.content[0].text);
            expect(products).toHaveLength(0);
        });

        it("should handle API errors gracefully", async () => {
            mockedAxios.get.mockRejectedValue(new Error("Search API Down"));
            const result = await searchProducts("query");
            const errorResponse = JSON.parse(result.content[0].text);
            expect(errorResponse.error).toContain("Search API Error: Search API Down");
        });
    });
});
