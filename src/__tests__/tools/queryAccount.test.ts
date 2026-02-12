import { queryAccount } from "../../tools/queryAccount";
import { Address } from "@multiversx/sdk-core";
import BigNumber from "bignumber.js";

// Mock SDK
jest.mock("@multiversx/sdk-core", () => {
    return {
        Address: {
            newFromBech32: jest.fn().mockImplementation((addr) => {
                if (addr === "invalid") throw new Error("Invalid address");
                return {
                    toBech32: () => addr,
                    toString: () => addr,
                };
            }),
        },
    };
});

jest.mock("../../tools/networkConfig", () => ({
    loadNetworkConfig: jest.fn().mockReturnValue({ chainId: "D" }),
    createNetworkProvider: jest.fn().mockReturnValue({
        getAccount: jest.fn().mockResolvedValue({
            address: { toBech32: () => "erd1-addr" },
            balance: { toString: () => "1000000000000000000" }, // 1 EGLD
            nonce: 5,
        }),
    }),
}));

describe("query-account", () => {
    it("should return formatted account details", async () => {
        const result = await queryAccount("erd1-addr");
        const details = JSON.parse(result.content[0].text);

        expect(details.address).toBe("erd1-addr");
        expect(details.balance).toBe("1000000000000000000");
        expect(details.balanceFormatted).toBe("1 EGLD");
        expect(details.nonce).toBe(5);
    });

    it("should handle invalid address format", async () => {
        const result = await queryAccount("invalid");
        expect(result.content[0].text).toContain("Invalid address format");
    });

    it("should handle API errors", async () => {
        const { createNetworkProvider } = require("../../tools/networkConfig");
        (createNetworkProvider().getAccount as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

        const result = await queryAccount("erd1-addr");
        expect(result.content[0].text).toContain("Failed to query account: API Error");
    });
});
