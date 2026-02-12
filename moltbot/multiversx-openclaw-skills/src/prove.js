"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prove = prove;
const sdk_wallet_1 = require("@multiversx/sdk-wallet");
const sdk_core_1 = require("@multiversx/sdk-core");
const fs_1 = require("fs");
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
/**
 * Submits a proof to the Validation Registry Smart Contract.
 *
 * @param input ProveInput
 * @returns Transaction Hash
 */
async function prove(input) {
    const txComputer = new sdk_core_1.TransactionComputer();
    const RELAYED_V3_EXTRA_GAS = 50000n;
    const pemPath = input.walletPath || process.env.MULTIVERSX_PRIVATE_KEY;
    if (!pemPath)
        throw new Error("Wallet path not found");
    const pemContent = await fs_1.promises.readFile(pemPath, 'utf8');
    const signer = sdk_wallet_1.UserSigner.fromPem(pemContent);
    // Default Registry Address if not provided (should be in config/env)
    const registryAddress = input.registryAddress || process.env.MULTIVERSX_VALIDATION_REGISTRY;
    if (!registryAddress)
        throw new Error("Validation Registry Address not configured");
    // Construct Data: submit_proof@<job_id_hex>@<hash>
    const jobIdHex = Buffer.from(input.jobId).toString('hex');
    const data = `submit_proof@${jobIdHex}@${input.resultHash}`;
    const tx = new sdk_core_1.Transaction({
        nonce: 0n,
        value: 0n,
        receiver: new sdk_core_1.Address(registryAddress),
        gasLimit: BigInt(constants_1.PROVE_GAS_LIMIT),
        chainID: process.env.MULTIVERSX_CHAIN_ID || constants_1.DEFAULT_CHAIN_ID,
        data: Buffer.from(data),
        sender: new sdk_core_1.Address(signer.getAddress().bech32())
    });
    const mcpUrl = process.env.MULTIVERSX_MCP_URL || constants_1.DEFAULT_MCP_URL;
    // Fetch Nonce
    try {
        const nonceResp = await axios_1.default.get(`${mcpUrl}/accounts/${signer.getAddress().bech32()}`);
        tx.nonce = BigInt(nonceResp.data.nonce || 0);
    }
    catch (e) {
        console.warn("Could not fetch nonce, using 0");
        tx.nonce = 0n;
    }
    // Broadcast via MCP or Relayer
    try {
        const signature = await signer.sign(txComputer.computeBytesForSigning(tx));
        tx.signature = signature;
        const response = await axios_1.default.post(`${mcpUrl}/transactions`, tx.toPlainObject());
        return response.data.txHash;
    }
    catch (err) {
        // Fallback to Relayer if MCP doesn't support direct broadcast
        const relayerUrl = process.env.MULTIVERSX_RELAY_URL;
        if (relayerUrl) {
            console.log("[MultiversX:Prove] Falling back to Relayer...");
            // Discover Relayer Address for V3
            let relayerAddressStr = process.env.MULTIVERSX_RELAYER_ADDRESS;
            if (!relayerAddressStr) {
                try {
                    const relayerResp = await axios_1.default.get(`${relayerUrl}/relayer/address/${signer.getAddress().bech32()}`);
                    relayerAddressStr = relayerResp.data.relayerAddress;
                }
                catch (e) {
                    console.warn("Could not discover relayer address for V3 fallback");
                }
            }
            if (relayerAddressStr) {
                tx.relayer = new sdk_core_1.Address(relayerAddressStr);
                tx.gasLimit += RELAYED_V3_EXTRA_GAS;
                // Re-sign with relayer field and updated gas
                const signatureRelayed = await signer.sign(txComputer.computeBytesForSigning(tx));
                tx.signature = signatureRelayed;
            }
            const response = await axios_1.default.post(`${relayerUrl}/relay`, {
                transaction: tx.toPlainObject()
            });
            return response.data.txHash;
        }
        throw err;
    }
}
