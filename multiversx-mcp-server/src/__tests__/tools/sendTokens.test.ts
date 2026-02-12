import { sendTokens } from "../../tools/sendTokens";

// Mock SDK
jest.mock("@multiversx/sdk-core", () => {
    return {
        Transaction: jest.fn().mockImplementation((args) => ({
            ...args,
            signature: undefined,
        })),
        TransactionComputer: jest.fn().mockImplementation(() => ({
            computeBytesForSigning: jest.fn().mockReturnValue(Buffer.from("mock-bytes")),
        })),
        Address: {
            newFromBech32: jest.fn().mockImplementation((addr) => {
                if (addr === "invalid") throw new Error("Invalid address");
                return {
                    toBech32: () => addr,
                    toString: () => addr,
                };
            }),
        },
        Token: jest.fn().mockImplementation((args) => ({
            identifier: args.identifier,
            nonce: BigInt(args.nonce || 0),
        })),
        TokenTransfer: jest.fn().mockImplementation((args) => ({
            token: args.token,
            amount: BigInt(args.amount),
        })),
        TokenTransfersDataBuilder: jest.fn().mockImplementation(() => ({
            buildDataPartsForESDTTransfer: jest.fn().mockReturnValue(["ESDTTransfer", "token", "amount"]),
        })),
    };
});

jest.mock("../../tools/networkConfig", () => ({
    loadNetworkConfig: jest.fn().mockReturnValue({ chainId: "D", explorerUrl: "https://devnet-explorer.multiversx.com" }),
    createNetworkProvider: jest.fn().mockReturnValue({
        getAccount: jest.fn().mockResolvedValue({
            nonce: 10,
        }),
        sendTransaction: jest.fn().mockResolvedValue("mock-tx-hash"),
    }),
}));

const mockWalletConfig = {
    pemPath: "test.pem",
};

jest.mock("../../tools/walletConfig", () => ({
    loadWalletConfig: jest.fn().mockImplementation(() => mockWalletConfig),
    loadWalletFromPem: jest.fn().mockReturnValue({
        address: { toBech32: () => "sender-addr" },
        signer: { sign: jest.fn().mockResolvedValue(Buffer.from("signature")) },
    }),
}));

describe("send-tokens", () => {
    it("should send ESDT tokens successfully", async () => {
        const result = await sendTokens("erd1-receiver", "USDC-123", "1000000");
        expect(result.content[0].text).toContain("Transaction sent");
        expect(result.content[0].text).toContain("mock-tx-hash");
    });

    it("should handle invalid receiver address", async () => {
        const result = await sendTokens("invalid", "USDC-123", "1000");
        expect(result.content[0].text).toContain("Invalid receiver address format");
    });

    it("should handle error during transaction sending", async () => {
        const { createNetworkProvider } = require("../../tools/networkConfig");
        (createNetworkProvider().sendTransaction as jest.Mock).mockRejectedValueOnce(new Error("Send failed"));

        const result = await sendTokens("erd1-receiver", "USDC-123", "1000");
        expect(result.content[0].text).toContain("Failed to send tokens: Send failed");
    });
});
