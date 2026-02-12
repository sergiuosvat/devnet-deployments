import { createNft } from "../../tools/createNft";

// Mock SDK
jest.mock("@multiversx/sdk-core", () => {
    return {
        TransactionsFactoryConfig: jest.fn(),
        TransactionComputer: jest.fn().mockImplementation(() => ({
            computeBytesForSigning: jest.fn().mockReturnValue(Buffer.from("mock-bytes")),
        })),
        TokenManagementTransactionsFactory: jest.fn().mockImplementation(() => ({
            createTransactionForCreatingNFT: jest.fn().mockResolvedValue({}),
        })),
    };
});

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

describe("createNft", () => {
    it("should mint NFT in signed mode", async () => {
        const result = await createNft("COL-123", "NFT Name", 500, "1");
        expect(result.content[0].text).toContain("NFT/SFT creation transaction sent");
        expect(result.content[0].text).toContain("mock-tx-hash");
    });
});
