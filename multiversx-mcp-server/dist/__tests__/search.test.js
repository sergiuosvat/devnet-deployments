"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const search_1 = require("../logic/search");
const axios_1 = __importDefault(require("axios"));
// Mock axios
jest.mock("axios");
const mockedAxios = axios_1.default;
describe("searchProducts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should return a list of products when API returns valid data", async () => {
        const mockResponse = {
            data: [
                {
                    identifier: "EGLD-123456-01",
                    name: "EGLD NFT",
                    attributes: "some attributes",
                    price: "1000000000000000000",
                    url: "http://image.com/1.png",
                    nonce: 1,
                },
            ],
        };
        mockedAxios.get.mockResolvedValue(mockResponse);
        const result = await (0, search_1.searchProducts)("EGLD");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("EGLD-123456-01");
        expect(result[0].name).toBe("EGLD NFT");
        expect(result[0].metadata.trust_level).toBe("public_api");
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
    it("should handle collection filtering", async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });
        await (0, search_1.searchProducts)("Ape", "APES-123456");
        expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("/nfts"), expect.objectContaining({
            params: expect.objectContaining({ collection: "APES-123456" }),
        }));
    });
    it("should return empty array on API failure", async () => {
        mockedAxios.get.mockRejectedValue(new Error("API Error"));
        const result = await (0, search_1.searchProducts)("EGLD");
        expect(result).toEqual([]);
    });
    it("should handle missing optional fields (attributes, price, url)", async () => {
        const mockResponse = {
            data: [
                {
                    identifier: "NO-ATTR-01",
                    name: "No Attributes",
                    nonce: 2,
                    // attributes missing
                    // price missing
                    // url missing, but thumbnail present
                    thumbnailUrl: "http://thumb.com/1.png",
                },
                {
                    identifier: "NO-IMG-02",
                    name: "No Image",
                    nonce: 3,
                    // url and thumbnail missing
                }
            ],
        };
        mockedAxios.get.mockResolvedValue(mockResponse);
        const result = await (0, search_1.searchProducts)("incomplete");
        expect(result).toHaveLength(2);
        // Check first item (Thumbnail fallback)
        expect(result[0].description).toBe("No description");
        expect(result[0].price).toBe("Not on sale (or auction)");
        expect(result[0].image_url).toBe("http://thumb.com/1.png");
        // Check second item (No image)
        expect(result[1].image_url).toBe("");
    });
    it("should skip items without identifier", async () => {
        const mockResponse = {
            data: [
                {
                    name: "Invalid Item", // No identifier
                },
            ],
        };
        mockedAxios.get.mockResolvedValue(mockResponse);
        const result = await (0, search_1.searchProducts)("Invalid");
        expect(result).toHaveLength(0);
    });
});
