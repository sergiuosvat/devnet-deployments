import { z } from "zod";
import { Address, Token, TokenTransfer, TokenTransfersDataBuilder, Transaction, TransactionComputer } from "@multiversx/sdk-core";
import { ToolResult } from "./types";
import { loadNetworkConfig, createNetworkProvider } from "./networkConfig";
import { loadWalletConfig, loadWalletFromPem } from "./walletConfig";
import { DEFAULT_GAS_LIMIT_MULTI_TRANSFER } from "./constants";

const txComputer = new TransactionComputer();

/**
 * Token transfer definition
 */
interface TokenAmount {
    identifier: string;
    nonce?: number;
    amount: string;
}

/**
 * Receiver transfer definition
 */
interface ReceiverTransfer {
    receiver: string;
    tokens: TokenAmount[];
}

/**
 * Send tokens to multiple receivers.
 * Each receiver can receive multiple different tokens in one transaction per receiver.
 * Requires MVX_WALLET_PEM to be set.
 */
export async function sendTokensToMultipleReceivers(
    transfers: ReceiverTransfer[]
): Promise<ToolResult> {
    const walletConfig = loadWalletConfig();

    if (transfers.length === 0) {
        return {
            content: [{ type: "text", text: "No transfers provided." }],
        };
    }

    // Validate all addresses first
    const validatedTransfers: { receiver: Address; tokens: TokenAmount[] }[] = [];
    for (const transfer of transfers) {
        try {
            const receiverAddr = Address.newFromBech32(transfer.receiver);
            validatedTransfers.push({ receiver: receiverAddr, tokens: transfer.tokens });
        } catch {
            return {
                content: [{ type: "text", text: `Invalid address: ${transfer.receiver}` }],
            };
        }
    }

    try {
        const config = loadNetworkConfig();
        const wallet = loadWalletFromPem(walletConfig.pemPath!);
        const api = createNetworkProvider(config);
        const account = await api.getAccount(wallet.address);

        const hashes: string[] = [];
        let currentNonce = account.nonce;
        const builder = new TokenTransfersDataBuilder();

        for (const transfer of validatedTransfers) {
            // Build token transfers for this receiver
            const tokenTransfers = transfer.tokens.map((t) => {
                const token = new Token({
                    identifier: t.identifier,
                    nonce: BigInt(t.nonce || 0),
                });
                return new TokenTransfer({ token, amount: BigInt(t.amount) });
            });

            // Build data field - for multiple tokens use MultiESDTNFTTransfer pattern
            let data: Uint8Array;
            if (tokenTransfers.length === 1 && tokenTransfers[0].token.nonce === 0n) {
                // Single fungible token - use simple ESDT transfer
                const dataParts = builder.buildDataPartsForESDTTransfer(tokenTransfers[0]);
                data = new TextEncoder().encode(dataParts.join("@"));
            } else {
                // Multiple tokens or NFT/SFT - use MultiESDTNFTTransfer
                const dataParts = builder.buildDataPartsForMultiESDTNFTTransfer(
                    transfer.receiver,
                    tokenTransfers
                );
                data = new TextEncoder().encode(dataParts.join("@"));
            }

            const tx = new Transaction({
                sender: wallet.address,
                receiver: tokenTransfers.length === 1 && tokenTransfers[0].token.nonce === 0n
                    ? transfer.receiver
                    : wallet.address, // MultiESDTNFTTransfer sends to self, receiver in data
                data,
                gasLimit: DEFAULT_GAS_LIMIT_MULTI_TRANSFER * BigInt(tokenTransfers.length),
                chainID: config.chainId,
                nonce: currentNonce,
            });

            const bytesToSign = txComputer.computeBytesForSigning(tx);
            const signature = await wallet.signer.sign(bytesToSign);
            tx.signature = signature;

            const txHash = await api.sendTransaction(tx);
            hashes.push(txHash);
            currentNonce++;
        }

        return {
            content: [
                {
                    type: "text",
                    text: `Sent tokens to ${transfers.length} receivers.\n\nTransaction hashes:\n${hashes.map((h, i) => `${i + 1}. ${config.explorerUrl}/transactions/${h}`).join("\n")}`,
                },
            ],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [{ type: "text", text: `Failed to send batch tokens: ${message}` }],
        };
    }
}

export const sendTokensToMultipleReceiversToolName = "send-tokens-to-multiple";
export const sendTokensToMultipleReceiversToolDescription = "Send multiple tokens to multiple receivers (batch ESDT/NFT/SFT transfers)";
export const sendTokensToMultipleReceiversParamScheme = {
    transfers: z.array(
        z.object({
            receiver: z.string().describe("Bech32 receiver address"),
            tokens: z.array(
                z.object({
                    identifier: z.string().describe("Token identifier (e.g., USDC-c76f1f)"),
                    nonce: z.number().optional().describe("Token nonce for NFT/SFT (0 for fungible)"),
                    amount: z.string().describe("Amount to transfer in atomic units"),
                })
            ),
        })
    ).describe("Array of transfers, each with receiver address and list of tokens to send"),
};
