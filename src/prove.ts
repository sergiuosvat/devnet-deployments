import { UserSigner } from '@multiversx/sdk-wallet';
import { Transaction, Address, TransactionComputer } from '@multiversx/sdk-core';
import { promises as fs } from 'fs';
import axios from 'axios';
import { DEFAULT_MCP_URL, DEFAULT_CHAIN_ID, PROVE_GAS_LIMIT } from './constants';

interface ProveInput {
    jobId: string;
    resultHash: string; // SHA256 hex string
    registryAddress?: string;
    walletPath?: string;
}

/**
 * Submits a proof to the Validation Registry Smart Contract.
 * 
 * @param input ProveInput
 * @returns Transaction Hash
 */
export async function prove(input: ProveInput): Promise<string> {
    const txComputer = new TransactionComputer();
    const RELAYED_V3_EXTRA_GAS = 50_000n;
    const pemPath = input.walletPath || process.env.MULTIVERSX_PRIVATE_KEY;
    if (!pemPath) throw new Error("Wallet path not found");

    const pemContent = await fs.readFile(pemPath, 'utf8');
    const signer = UserSigner.fromPem(pemContent);

    // Default Registry Address if not provided (should be in config/env)
    const registryAddress = input.registryAddress || process.env.MULTIVERSX_VALIDATION_REGISTRY;
    if (!registryAddress) throw new Error("Validation Registry Address not configured");

    // Construct Data: submit_proof@<job_id_hex>@<hash>
    const jobIdHex = Buffer.from(input.jobId).toString('hex');
    const data = `submit_proof@${jobIdHex}@${input.resultHash}`;

    const tx = new Transaction({
        nonce: 0n,
        value: 0n,
        receiver: new Address(registryAddress),
        gasLimit: BigInt(PROVE_GAS_LIMIT),
        chainID: process.env.MULTIVERSX_CHAIN_ID || DEFAULT_CHAIN_ID,
        data: Buffer.from(data),
        sender: new Address(signer.getAddress().bech32())
    });

    const mcpUrl = process.env.MULTIVERSX_MCP_URL || DEFAULT_MCP_URL;

    // Fetch Nonce
    try {
        const nonceResp = await axios.get(`${mcpUrl}/accounts/${signer.getAddress().bech32()}`);
        tx.nonce = BigInt(nonceResp.data.nonce || 0);
    } catch (e) {
        console.warn("Could not fetch nonce, using 0");
        tx.nonce = 0n;
    }

    // Broadcast via MCP or Relayer
    try {
        const signature = await signer.sign(txComputer.computeBytesForSigning(tx));
        tx.signature = signature;
        const response = await axios.post(`${mcpUrl}/transactions`, tx.toPlainObject());
        return response.data.txHash;
    } catch (err: unknown) {
        // Fallback to Relayer if MCP doesn't support direct broadcast
        const relayerUrl = process.env.MULTIVERSX_RELAY_URL;
        if (relayerUrl) {
            console.log("[MultiversX:Prove] Falling back to Relayer...");
            // Discover Relayer Address for V3
            let relayerAddressStr = process.env.MULTIVERSX_RELAYER_ADDRESS;
            if (!relayerAddressStr) {
                try {
                    const relayerResp = await axios.get(`${relayerUrl}/relayer/address/${signer.getAddress().bech32()}`);
                    relayerAddressStr = relayerResp.data.relayerAddress;
                } catch (e) {
                    console.warn("Could not discover relayer address for V3 fallback");
                }
            }

            if (relayerAddressStr) {
                tx.relayer = new Address(relayerAddressStr);
                tx.gasLimit += RELAYED_V3_EXTRA_GAS;
                // Re-sign with relayer field and updated gas
                const signatureRelayed = await signer.sign(txComputer.computeBytesForSigning(tx));
                tx.signature = signatureRelayed;
            }

            const response = await axios.post(`${relayerUrl}/relay`, {
                transaction: tx.toPlainObject()
            });
            return response.data.txHash;
        }
        throw err;
    }
}
