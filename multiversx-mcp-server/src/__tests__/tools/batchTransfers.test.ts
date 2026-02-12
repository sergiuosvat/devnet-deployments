import { sendEgldToMultipleReceivers } from "../../tools/sendEgldToMultipleReceivers";
import { sendTokensToMultipleReceivers } from "../../tools/sendTokensToMultipleReceivers";

// Mock SDK
jest.mock("@multiversx/sdk-core", () => {
    const original = jest.requireActual("@multiversx/sdk-core");
    return {
        ...original,
        Transaction: jest.fn().mockImplementation((args) => ({
            ...args,
            toPlainObject: () => ({
                ...args,
                value: args.value?.toString(),
                gasLimit: args.gasLimit?.toString(),
                nonce: Number(args.nonce),
                receiver: typeof args.receiver === "string" ? args.receiver : args.receiver?.toBech32?.(),
                sender: typeof args.sender === "string" ? args.sender : args.sender?.toBech32?.(),
            }),
        })),
        TransactionComputer: jest.fn().mockImplementation(() => ({
            computeBytesForSigning: jest.fn().mockReturnValue(Buffer.from("bytes")),
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
            ...args,
            identifier: args.identifier,
            nonce: BigInt(args.nonce || 0),
        })),
        TokenTransfer: jest.fn().mockImplementation((args) => ({
            ...args,
            token: args.token,
            amount: BigInt(args.amount),
        })),
        TokenTransfersDataBuilder: jest.fn().mockImplementation(() => ({
            buildDataPartsForESDTTransfer: jest.fn().mockReturnValue(["ESDTTransfer", "token", "amount"]),
            buildDataPartsForMultiESDTNFTTransfer: jest.fn().mockReturnValue(["MultiESDTNFTTransfer", "addr", "num", "token", "nonce", "amount"]),
        })),
    };
});

jest.mock("../../tools/networkConfig", () => ({
    loadNetworkConfig: jest.fn().mockReturnValue({ chainId: "D", explorerUrl: "https://devnet-explorer.multiversx.com" }),
    createNetworkProvider: jest.fn().mockReturnValue({
        getAccount: jest.fn().mockResolvedValue({
            address: { toBech32: () => "sender-addr" },
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

describe("Batch Transfer Tools", () => {
    describe("send-egld-to-multiple", () => {
        it("should send EGLD to multiple receivers", async () => {
            const receivers = [
                "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
                "erd1spy9qzmscc9502sc96899m5sz42z92czctpfs6y8v3zgr3qpuq00squ8sh"
            ];
            const result = await sendEgldToMultipleReceivers("1000000000000000000", receivers);
            expect(result.content[0].text).toContain("Sent 1000000000000000000 atomic EGLD to 2 receivers");
            expect(result.content[0].text).toContain("mock-tx-hash");
        });

        it("should return error for invalid receiver address", async () => {
            const receivers = ["invalid"];
            const result = await sendEgldToMultipleReceivers("1000", receivers);
            expect(result.content[0].text).toContain("Invalid address: invalid");
        });

        it("should return message if no receivers provided", async () => {
            const result = await sendEgldToMultipleReceivers("1000", []);
            expect(result.content[0].text).toContain("No receivers provided");
        });
    });

    describe("send-tokens-to-multiple", () => {
        it("should send multiple tokens to multiple receivers", async () => {
            const transfers = [
                {
                    receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
                    tokens: [{ identifier: "TOKEN-123456", amount: "100" }]
                }
            ];
            const result = await sendTokensToMultipleReceivers(transfers);
            expect(result.content[0].text).toContain("Sent tokens to 1 receivers");
            expect(result.content[0].text).toContain("mock-tx-hash");
        });

        it("should handle error for invalid address", async () => {
            const result = await sendTokensToMultipleReceivers([{ receiver: "invalid", tokens: [] }]);
            expect(result.content[0].text).toContain("Invalid address: invalid");
        });

        it("should handle multi-transfer pattern for multiple tokens", async () => {
            const transfers = [
                {
                    receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
                    tokens: [
                        { identifier: "TOKEN-123456", amount: "100" },
                        { identifier: "TOKEN-654321", amount: "200" }
                    ]
                }
            ];
            const result = await sendTokensToMultipleReceivers(transfers);
            expect(result.content[0].text).toContain("Sent tokens to 1 receivers");
        });
    });
});
