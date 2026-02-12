import { z } from "zod";
import { TokenManagementTransactionsFactory, TransactionsFactoryConfig, TransactionComputer } from "@multiversx/sdk-core";
import { ToolResult } from "./types";
import { loadNetworkConfig, createNetworkProvider } from "./networkConfig";
import { loadWalletConfig, loadWalletFromPem } from "./walletConfig";
import { ESDT_ISSUE_COST } from "./constants";

const txComputer = new TransactionComputer();

/**
 * Issue a new SFT collection.
 * Requires MVX_WALLET_PEM to be set.
 */
export async function issueSemiFungibleCollection(
    tokenName: string,
    tokenTicker: string
): Promise<ToolResult> {
    const walletConfig = loadWalletConfig();

    try {
        const config = loadNetworkConfig();
        const wallet = loadWalletFromPem(walletConfig.pemPath!);
        const api = createNetworkProvider(config);
        const account = await api.getAccount(wallet.address);

        const factoryConfig = new TransactionsFactoryConfig({ chainID: config.chainId });
        const factory = new TokenManagementTransactionsFactory({ config: factoryConfig });

        const tx = await factory.createTransactionForIssuingSemiFungible(wallet.address, {
            tokenName,
            tokenTicker,
            canFreeze: true,
            canWipe: true,
            canPause: true,
            canTransferNFTCreateRole: true,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: true,
        });

        tx.nonce = account.nonce;
        tx.value = ESDT_ISSUE_COST;

        const bytesToSign = txComputer.computeBytesForSigning(tx);
        const signature = await wallet.signer.sign(bytesToSign);
        tx.signature = signature;

        const txHash = await api.sendTransaction(tx);

        return {
            content: [
                {
                    type: "text",
                    text: `SFT collection issuance sent: ${config.explorerUrl}/transactions/${txHash}`,
                },
            ],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [{ type: "text", text: `Failed to issue SFT collection: ${message}` }],
        };
    }
}

export const issueSemiFungibleCollectionToolName = "issue-sft-collection";
export const issueSemiFungibleCollectionToolDescription = "Issue a new Semi-Fungible Token collection";
export const issueSemiFungibleCollectionParamScheme = {
    tokenName: z.string().min(3).max(20).describe("Collection name (3-20 characters)"),
    tokenTicker: z.string().min(3).max(10).describe("Collection ticker (3-10 uppercase)"),
};
