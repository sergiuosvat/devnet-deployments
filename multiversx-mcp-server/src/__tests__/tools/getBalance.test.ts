import { getBalance } from "../../tools/getBalance";

// Mock SDK Core and Network Config
jest.mock("@multiversx/sdk-core", () => {
    return {
        Address: {
            newFromBech32: jest.fn().mockImplementation((addr) => {
                if (addr === "invalid") throw new Error("Invalid address");
                return { toBech32: () => addr };
            }),
        },
    };
});

// Mock network config and provider
jest.mock("../../tools/networkConfig", () => ({
    loadNetworkConfig: jest.fn().mockReturnValue({}),
    createNetworkProvider: jest.fn().mockImplementation(() => ({
        getAccount: jest.fn().mockResolvedValue({
            address: { toBech32: () => "erd1..." },
            balance: { toString: () => "1000000000000000000" }, // 1 EGLD
            nonce: 0,
            shard: 1,
        }),
    })),
}));

describe("getBalance", () => {
    it("should return formatted balance for valid address", async () => {
        const result = await getBalance("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const text = result.content[0].text;
        expect(text).toContain("1 EGLD");
        expect(text).toContain("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    });

    it("should return error for invalid address", async () => {
        const result = await getBalance("invalid");
        expect(result.content[0].text).toContain("Invalid address");
    });
});
