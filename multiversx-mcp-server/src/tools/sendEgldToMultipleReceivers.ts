import { z } from "zod";
import { Address, Transaction, TransactionComputer } from "@multiversx/sdk-core";
import { ToolResult } from "./types";
import { loadNetworkConfig, createNetworkProvider } from "./networkConfig";
import { loadWalletConfig, loadWalletFromPem } from "./walletConfig";
import { DEFAULT_GAS_LIMIT_EGLD } from "./constants";

const txComputer = new TransactionComputer();

/**
 * Send EGLD to multiple receivers.
 * Creates separate transactions for each receiver and broadcasts them.
 * Requires MVX_WALLET_PEM to be set.
 */
export async function sendEgldToMultipleReceivers(
    amount: string,
    receivers: string[]
): Promise<ToolResult> {
    const walletConfig = loadWalletConfig();

    if (receivers.length === 0) {
        return {
            content: [{ type: "text", text: "No receivers provided." }],
        };
    }

    // Validate all addresses first
    const receiverAddrs: Address[] = [];
    for (const receiver of receivers) {
        try {
            receiverAddrs.push(Address.newFromBech32(receiver));
        } catch {
            return {
                content: [{ type: "text", text: `Invalid address: ${receiver}` }],
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

        for (const receiverAddr of receiverAddrs) {
            const tx = new Transaction({
                sender: wallet.address,
                receiver: receiverAddr,
                value: BigInt(amount),
                gasLimit: DEFAULT_GAS_LIMIT_EGLD,
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
                    text: `Sent ${amount} atomic EGLD to ${receivers.length} receivers.\n\nTransaction hashes:\n${hashes.map((h, i) => `${i + 1}. ${config.explorerUrl}/transactions/${h}`).join("\n")}`,
                },
            ],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [{ type: "text", text: `Failed to send batch EGLD: ${message}` }],
        };
    }
}

export const sendEgldToMultipleReceiversToolName = "send-egld-to-multiple";
export const sendEgldToMultipleReceiversToolDescription = "Send EGLD to multiple receiver addresses (airdrop)";
export const sendEgldToMultipleReceiversParamScheme = {
    amount: z.string().describe("Amount in atomic units to send to EACH receiver"),
    receivers: z.array(z.string()).describe("Array of bech32 receiver addresses"),
};
