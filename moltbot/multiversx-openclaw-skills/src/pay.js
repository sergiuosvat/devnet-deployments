"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pay = pay;
const axios_1 = __importDefault(require("axios"));
const sdk_wallet_1 = require("@multiversx/sdk-wallet");
const sdk_core_1 = require("@multiversx/sdk-core");
const sdk_network_providers_1 = require("@multiversx/sdk-network-providers");
const fs_1 = require("fs");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const constants_1 = require("./constants");
function parseX402Header(header) {
    const parts = header.split(' ');
    if (parts[0] !== 'x402') {
        throw new Error('Invalid x402 header scheme. Expected "x402"');
    }
    const dict = {};
    const regex = /(\w+)="([^"]+)"/g;
    let match;
    const paramsOnly = parts.slice(1).join(' ');
    while ((match = regex.exec(paramsOnly)) !== null) {
        dict[match[1]] = match[2];
    }
    if (!dict['token'] || !dict['target'] || !dict['amount']) {
        throw new Error('Missing required x402 fields: token, target, amount');
    }
    return {
        token: dict['token'],
        target: dict['target'],
        amount: dict['amount'],
        uUri: dict['u_uri'] || ''
    };
}
async function pay(input) {
    const txComputer = new sdk_core_1.TransactionComputer();
    const request = parseX402Header(input.paymentHeader);
    // 1. Budget Check
    if (input.budgetCap) {
        const amount = new bignumber_js_1.default(request.amount);
        const cap = new bignumber_js_1.default(input.budgetCap);
        if (amount.gt(cap)) {
            throw new Error(`Payment amount ${request.amount} exceeds budget cap ${input.budgetCap}`);
        }
    }
    // 2. Setup Provider & Signer
    const mcpUrl = process.env.MULTIVERSX_MCP_URL || constants_1.DEFAULT_MCP_URL;
    const provider = new sdk_network_providers_1.ApiNetworkProvider(mcpUrl);
    const pemPath = input.walletPath || process.env.MULTIVERSX_PRIVATE_KEY;
    if (!pemPath)
        throw new Error("Wallet path not found");
    const pemContent = await fs_1.promises.readFile(pemPath, 'utf8');
    const signer = sdk_wallet_1.UserSigner.fromPem(pemContent);
    const senderAddress = new sdk_core_1.Address(signer.getAddress().bech32());
    // 3. Relayer Configuration (V3)
    const relayerUrl = input.relayerUrl || process.env.MULTIVERSX_RELAY_URL;
    if (!relayerUrl)
        throw new Error("Relayer URL not found");
    let relayerAddressStr = input.relayerAddress || process.env.MULTIVERSX_RELAYER_ADDRESS;
    // Dynamic Discovery: If address not provided, fetch from Relayer Config
    // Dynamic Discovery: If address not provided, fetch from Relayer Config
    if (!relayerAddressStr) {
        try {
            console.log(`[MultiversX:Pay] Fetching Relayer Address for ${senderAddress.toBech32()} from ${relayerUrl}...`);
            const relayerResp = await axios_1.default.get(`${relayerUrl}/relayer/address/${senderAddress.toBech32()}`);
            if (relayerResp.data && relayerResp.data.relayerAddress) {
                relayerAddressStr = relayerResp.data.relayerAddress;
            }
            else {
                throw new Error("Invalid config response structure: missing relayerAddress");
            }
        }
        catch (e) {
            let message = 'Unknown error';
            if (e instanceof Error)
                message = e.message;
            throw new Error(`Failed to discover Relayer Address from ${relayerUrl}: ${message}`);
        }
    }
    if (!relayerAddressStr) {
        throw new Error("Relayer Address could not be determined for Gasless V3 transactions.");
    }
    const relayerAddress = new sdk_core_1.Address(relayerAddressStr);
    // 4. Fetch Account State (Nonce)
    const account = await provider.getAccount({ bech32: () => senderAddress.toBech32() });
    // 5. Construct Transaction & Gas Logic
    let payload;
    let value;
    let gasLimit = 0;
    const token = request.token.toUpperCase();
    const isEsdt = token !== 'EGLD' && token !== 'XGLD';
    if (isEsdt) {
        // MultiESDTNFTTransfer Construction
        const destination = new sdk_core_1.Address(request.target);
        const destHex = destination.toHex();
        const numTransfers = '01';
        const tokenHex = Buffer.from(request.token).toString('hex');
        const nonceHex = '00';
        let amountHex = new bignumber_js_1.default(request.amount).toString(16);
        if (amountHex.length % 2 !== 0)
            amountHex = '0' + amountHex;
        const funcHex = Buffer.from('x402-pay').toString('hex');
        const tokenArgHex = Buffer.from(request.token).toString('hex');
        const dataString = `MultiESDTNFTTransfer@${destHex}@${numTransfers}@${tokenHex}@${nonceHex}@${amountHex}@${funcHex}@${tokenArgHex}`;
        payload = Buffer.from(dataString);
        value = 0n;
        // Gas Calculation
        const dataCost = constants_1.BASE_GAS_LIMIT + constants_1.GAS_PER_DATA_BYTE * payload.length;
        gasLimit = dataCost + constants_1.SC_CALL_MIN_GAS + constants_1.ESDT_TRANSFER_GAS;
    }
    else {
        // EGLD Transfer with SC Call
        const dataString = "x402-pay " + request.token;
        payload = Buffer.from(dataString);
        value = BigInt(request.amount);
        // Gas Calculation
        const dataCost = constants_1.BASE_GAS_LIMIT + constants_1.GAS_PER_DATA_BYTE * payload.length;
        gasLimit = dataCost + constants_1.SC_CALL_MIN_GAS;
    }
    // Relayed V3 Extra Gas
    gasLimit += constants_1.RELAYED_V3_EXTRA_GAS;
    const tx = new sdk_core_1.Transaction({
        nonce: BigInt(account.nonce),
        value: value,
        receiver: new sdk_core_1.Address(request.target),
        gasLimit: BigInt(gasLimit),
        chainID: process.env.MULTIVERSX_CHAIN_ID || constants_1.DEFAULT_CHAIN_ID,
        data: payload,
        sender: senderAddress,
        relayer: relayerAddress // Set Relayer for V3 logic (signature verification)
    });
    // 6. Sign
    const signature = await signer.sign(txComputer.computeBytesForSigning(tx));
    tx.signature = signature;
    // 7. Send to Relayer
    const response = await axios_1.default.post(`${relayerUrl}/transaction/send`, {
        transaction: tx.toPlainObject()
    });
    return response.data.txHash;
}
