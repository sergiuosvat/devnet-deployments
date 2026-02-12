import { sendEgld } from "../../tools/sendEgld";

// Mock SDK
jest.mock("@multiversx/sdk-core", () => ({
    Address: {
        newFromBech32: jest.fn().mockImplementation((addr) => ({ toBech32: () => addr })),
    },
    Transaction: jest.fn().mockImplementation((args) => ({
        toPlainObject: () => ({
            ...args,
            value: args.value.toString(),
            gasLimit: args.gasLimit.toString(),
            nonce: Number(args.nonce),
            receiver: args.receiver.toBech32(),
            sender: args.sender ? args.sender.toBech32() : undefined
        }),
    })),
    TransactionComputer: jest.fn().mockImplementation(() => ({
        computeBytesForSigning: jest.fn().mockReturnValue(Buffer.from("bytes")),
    })),
}));

jest.mock("../../tools/networkConfig", () => ({
    loadNetworkConfig: jest.fn().mockReturnValue({ chainId: "D", explorerUrl: "https://devnet-explorer.multiversx.com" }),
    createNetworkProvider: jest.fn().mockReturnValue({
        getAccount: jest.fn().mockResolvedValue({
            address: { toBech32: () => "sender-addr" },
            nonce: 0,
        }),
        sendTransaction: jest.fn().mockResolvedValue("mock-tx-hash"),
    }),
}));

const mockWalletConfig: { pemPath?: string } = {
    pemPath: undefined,
};

jest.mock("../../tools/walletConfig", () => ({
    loadWalletConfig: jest.fn().mockImplementation(() => mockWalletConfig),
    loadWalletFromPem: jest.fn().mockReturnValue({
        address: { toBech32: () => "sender-addr" },
        signer: { sign: jest.fn().mockResolvedValue(Buffer.from("signature")) },
    }),
}));

describe("sendEgld", () => {
    beforeEach(() => {
        mockWalletConfig.pemPath = "test.pem";
    });

    it("should sign and send transaction", async () => {
        const result = await sendEgld("erd1receiver", "1000000000000000000");
        expect(result.content[0].text).toContain("Transaction sent");
        expect(result.content[0].text).toContain("mock-tx-hash");
    });

    it("should handle errors during send", async () => {
        const { loadWalletFromPem } = require("../../tools/walletConfig");
        (loadWalletFromPem as jest.Mock).mockImplementationOnce(() => {
            throw new Error("PEM error");
        });

        const result = await sendEgld("erd1receiver", "1000000000000000000");
        expect(result.content[0].text).toContain("Failed to send EGLD: PEM error");
    });
});
