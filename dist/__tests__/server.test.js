"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock the SDK Server class BEFORE imports
const mockSetRequestHandler = jest.fn();
jest.mock("@modelcontextprotocol/sdk/server/index.js", () => {
    return {
        Server: jest.fn().mockImplementation(() => {
            return {
                setRequestHandler: mockSetRequestHandler,
                connect: jest.fn(),
            };
        }),
    };
});
const server_1 = require("../server");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const search_1 = require("../logic/search"); // No .js needed due to mapper
const checkout_1 = require("../logic/checkout");
const tracking_1 = require("../logic/tracking");
// Mock Logic
jest.mock("../logic/search");
jest.mock("../logic/checkout");
jest.mock("../logic/tracking");
describe("MCP Server Integration", () => {
    let server;
    beforeEach(() => {
        jest.clearAllMocks();
        server = (0, server_1.createMcpServer)();
    });
    it("should list all available tools", async () => {
        // Find the handler for ListToolsRequestSchema
        const call = mockSetRequestHandler.mock.calls.find((c) => c[0] === types_js_1.ListToolsRequestSchema);
        expect(call).toBeDefined();
        const handler = call[1];
        const result = await handler();
        expect(result.tools).toHaveLength(3);
        expect(result.tools[0].name).toBe("search_products");
    });
    it("should route search_products correctly", async () => {
        const call = mockSetRequestHandler.mock.calls.find((c) => c[0] === types_js_1.CallToolRequestSchema);
        const handler = call[1];
        search_1.searchProducts.mockResolvedValue([{ id: "test" }]);
        const response = await handler({
            params: {
                name: "search_products",
                arguments: { query: "test" }
            }
        });
        expect(search_1.searchProducts).toHaveBeenCalledWith("test", undefined, undefined);
        expect(JSON.parse(response.content[0].text)).toEqual([{ id: "test" }]);
    });
    it("should route create_purchase_transaction correctly", async () => {
        const call = mockSetRequestHandler.mock.calls.find((c) => c[0] === types_js_1.CallToolRequestSchema);
        const handler = call[1];
        checkout_1.createPurchaseTransaction.mockResolvedValue({ data: "tx" });
        const response = await handler({
            params: {
                name: "create_purchase_transaction",
                arguments: { token_identifier: "T", nonce: 1, quantity: 1 }
            }
        });
        expect(checkout_1.createPurchaseTransaction).toHaveBeenCalledWith("T", 1, 1, undefined);
        expect(JSON.parse(response.content[0].text)).toEqual({ data: "tx" });
    });
    it("should route track_order correctly", async () => {
        const call = mockSetRequestHandler.mock.calls.find((c) => c[0] === types_js_1.CallToolRequestSchema);
        const handler = call[1];
        tracking_1.trackOrder.mockResolvedValue({ status: "success" });
        const response = await handler({
            params: {
                name: "track_order",
                arguments: { transaction_hash: "hash" }
            }
        });
        expect(tracking_1.trackOrder).toHaveBeenCalledWith("hash");
        expect(JSON.parse(response.content[0].text)).toEqual({ status: "success" });
    });
    it("should throw on unknown tool", async () => {
        const call = mockSetRequestHandler.mock.calls.find((c) => c[0] === types_js_1.CallToolRequestSchema);
        const handler = call[1];
        await expect(handler({
            params: {
                name: "unknown_tool",
                arguments: {}
            }
        })).rejects.toThrow("Unknown tool: unknown_tool");
    });
});
