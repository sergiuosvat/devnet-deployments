import { z } from "zod";
import { TokenManagementTransactionsFactory, TransactionsFactoryConfig, TransactionComputer } from "@multiversx/sdk-core";
import { ToolResult } from "./types";
import { loadNetworkConfig, createNetworkProvider } from "./networkConfig";
import { loadWalletConfig, loadWalletFromPem } from "./walletConfig";
import { DEFAULT_GAS_LIMIT_NFT } from "./constants";

const txComputer = new TransactionComputer();

/**
 * Create a new NFT/SFT/Meta-ESDT.
 * Requires MVX_WALLET_PEM to be set.
 */
export async function createNft(
    collectionIdentifier: string,
    name: string,
    royalties: number,
    quantity: string, // 1 for NFT, >1 for SFT/Meta-ESDT
    uris: string[] = []
): Promise<ToolResult> {
    const walletConfig = loadWalletConfig();

    // Validate royalties (0-10000, where 10000 = 100%)
    if (royalties < 0 || royalties > 10000) {
        return {
            content: [{ type: "text", text: "Royalties must be between 0 and 10000 (0% - 100%)." }],
        };
    }

    try {
        const config = loadNetworkConfig();
        const wallet = loadWalletFromPem(walletConfig.pemPath!);
        const api = createNetworkProvider(config);
        const account = await api.getAccount(wallet.address);

        const factoryConfig = new TransactionsFactoryConfig({ chainID: config.chainId });
        const factory = new TokenManagementTransactionsFactory({ config: factoryConfig });

        const tx = await factory.createTransactionForCreatingNFT(wallet.address, {
            tokenIdentifier: collectionIdentifier,
            name,
            royalties,
            initialQuantity: BigInt(quantity),
            attributes: new Uint8Array(), // Empty attributes for now
            uris,
            hash: "", // Empty hash
        });

        tx.nonce = account.nonce;
        tx.gasLimit = DEFAULT_GAS_LIMIT_NFT;

        const bytesToSign = txComputer.computeBytesForSigning(tx);
        const signature = await wallet.signer.sign(bytesToSign);
        tx.signature = signature;

        const txHash = await api.sendTransaction(tx);

        return {
            content: [
                {
                    type: "text",
                    text: `NFT/SFT creation transaction sent: ${config.explorerUrl}/transactions/${txHash}`,
                },
            ],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [{ type: "text", text: `Failed to create NFT: ${message}` }],
        };
    }
}

export const createNftToolName = "create-nft";
export const createNftToolDescription = "Create (mint) a new NFT/SFT/Meta-ESDT under an existing collection";
export const createNftParamScheme = {
    collectionIdentifier: z.string().describe("The collection identifier (e.g., COL-123456)"),
    name: z.string().describe("Name of the NFT"),
    royalties: z.number().min(0).max(10000).describe("Royalties (0-10000, where 10000 is 100%)"),
    quantity: z.string().describe("Quantity to mint (1 for NFT, >1 for SFT)"),
    uris: z.array(z.string()).optional().describe("Array of URIs (image, metadata, etc.)"),
};
