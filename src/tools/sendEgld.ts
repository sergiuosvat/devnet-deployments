/**
 * Send EGLD to a receiver address
 */

import { z } from "zod";
import { Address, Transaction, TransactionComputer } from "@multiversx/sdk-core";
import { ToolResult } from "./types";
import { loadNetworkConfig, createNetworkProvider } from "./networkConfig";
import { loadWalletConfig, loadWalletFromPem } from "./walletConfig";
import { DEFAULT_GAS_LIMIT_EGLD } from "./constants";

const txComputer = new TransactionComputer();

/**
 * Create and sign/broadcast an EGLD transfer transaction.
 * Requires MVX_WALLET_PEM to be set.
 */
export async function sendEgld(receiver: string, amount: string): Promise<ToolResult> {
    let receiverAddr: Address;
    try {
        receiverAddr = Address.newFromBech32(receiver);
    } catch {
        return {
            content: [
                {
                    type: "text",
                    text: "Invalid receiver address format.",
                },
            ],
        };
    }

    const config = loadNetworkConfig();
    const walletConfig = loadWalletConfig();

    try {
        const wallet = loadWalletFromPem(walletConfig.pemPath!);
        const api = createNetworkProvider(config);
        const account = await api.getAccount(wallet.address);

        const tx = new Transaction({
            sender: wallet.address,
            receiver: receiverAddr,
            value: BigInt(amount),
            gasLimit: DEFAULT_GAS_LIMIT_EGLD,
            chainID: config.chainId,
            nonce: account.nonce,
        });

        // Sign the transaction using TransactionComputer
        const bytesToSign = txComputer.computeBytesForSigning(tx);
        const signature = await wallet.signer.sign(bytesToSign);
        tx.signature = signature;

        // Send the transaction
        const txHash = await api.sendTransaction(tx);

        return {
            content: [
                {
                    type: "text",
                    text: `Transaction sent: ${config.explorerUrl}/transactions/${txHash}`,
                },
            ],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to send EGLD: ${message}`,
                },
            ],
        };
    }
}

export const sendEgldToolName = "send-egld";
export const sendEgldToolDescription = "Send EGLD to a receiver address";
export const sendEgldParamScheme = {
    receiver: z.string().describe("The bech32 address of the receiver (erd1...)"),
    amount: z.string().describe("The amount in atomic units (1 EGLD = 10^18 atomic units)"),
};
