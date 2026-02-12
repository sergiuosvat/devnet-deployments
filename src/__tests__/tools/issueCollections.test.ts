import { issueNftCollection } from "../../tools/issueNftCollection";
import { issueSemiFungibleCollection } from "../../tools/issueSemiFungibleCollection";
import { issueMetaEsdtCollection } from "../../tools/issueMetaEsdtCollection";

// Mock SDK
jest.mock("@multiversx/sdk-core", () => {
    return {
        TransactionsFactoryConfig: jest.fn(),
        TransactionComputer: jest.fn().mockImplementation(() => ({
            computeBytesForSigning: jest.fn().mockReturnValue(Buffer.from("mock-bytes")),
        })),
        TokenManagementTransactionsFactory: jest.fn().mockImplementation(() => ({
            createTransactionForIssuingNonFungible: jest.fn().mockResolvedValue({}),
            createTransactionForIssuingSemiFungible: jest.fn().mockResolvedValue({}),
            createTransactionForRegisteringMetaESDT: jest.fn().mockResolvedValue({}),
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

describe("Collection Issuance Tools", () => {
    it("should issue NFT collection", async () => {
        const result = await issueNftCollection("My NFTs", "MNFT");
        expect(result.content[0].text).toContain("NFT collection issuance sent");
        expect(result.content[0].text).toContain("mock-tx-hash");
    });

    it("should issue SFT collection", async () => {
        const result = await issueSemiFungibleCollection("My SFTs", "MSFT");
        expect(result.content[0].text).toContain("SFT collection issuance sent");
        expect(result.content[0].text).toContain("mock-tx-hash");
    });

    it("should issue Meta-ESDT collection", async () => {
        const result = await issueMetaEsdtCollection("My Meta", "MMTA", 18);
        expect(result.content[0].text).toContain("Meta-ESDT collection issuance sent");
        expect(result.content[0].text).toContain("mock-tx-hash");
    });

    it("should handle wallet missing error", async () => {
        const { loadWalletFromPem } = require("../../tools/walletConfig");
        (loadWalletFromPem as jest.Mock).mockImplementationOnce(() => {
            throw new Error("PEM path missing");
        });

        const result = await issueNftCollection("Test", "TST");
        expect(result.content[0].text).toContain("Failed to issue NFT collection");
    });
});
