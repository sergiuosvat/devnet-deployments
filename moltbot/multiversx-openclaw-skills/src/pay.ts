import axios from 'axios';
import { UserSigner } from '@multiversx/sdk-wallet';
import { Transaction, Address, TransactionComputer } from '@multiversx/sdk-core';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers';
import { promises as fs } from 'fs';
import BigNumber from 'bignumber.js';
import {
    DEFAULT_MCP_URL,
    DEFAULT_CHAIN_ID,
    BASE_GAS_LIMIT,
    GAS_PER_DATA_BYTE,
    SC_CALL_MIN_GAS,
    ESDT_TRANSFER_GAS,
    RELAYED_V3_EXTRA_GAS
} from './constants';

interface PayInput {
    paymentHeader: string;
    budgetCap?: string;
    walletPath?: string;
    relayerUrl?: string;
    relayerAddress?: string; // Optional: If missing, will try to fetch from relayerUrl
}

interface PaymentRequest {
    token: string;
    target: string;
    amount: string;
    uUri: string;
}

function parseX402Header(header: string): PaymentRequest {
    const parts = header.split(' ');
    if (parts[0] !== 'x402') {
        throw new Error('Invalid x402 header scheme. Expected "x402"');
    }

    const dict: Record<string, string> = {};
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

export async function pay(input: PayInput): Promise<string> {
    const txComputer = new TransactionComputer();
    const request = parseX402Header(input.paymentHeader);

    // 1. Budget Check
    if (input.budgetCap) {
        const amount = new BigNumber(request.amount);
        const cap = new BigNumber(input.budgetCap);
        if (amount.gt(cap)) {
            throw new Error(`Payment amount ${request.amount} exceeds budget cap ${input.budgetCap}`);
        }
    }

    // 2. Setup Provider & Signer
    const mcpUrl = process.env.MULTIVERSX_MCP_URL || DEFAULT_MCP_URL;
    const provider = new ApiNetworkProvider(mcpUrl);

    const pemPath = input.walletPath || process.env.MULTIVERSX_PRIVATE_KEY;
    if (!pemPath) throw new Error("Wallet path not found");

    const pemContent = await fs.readFile(pemPath, 'utf8');
    const signer = UserSigner.fromPem(pemContent);
    const senderAddress = new Address(signer.getAddress().bech32());

    // 3. Relayer Configuration (V3)
    const relayerUrl = input.relayerUrl || process.env.MULTIVERSX_RELAY_URL;
    if (!relayerUrl) throw new Error("Relayer URL not found");

    let relayerAddressStr = input.relayerAddress || process.env.MULTIVERSX_RELAYER_ADDRESS;

    // Dynamic Discovery: If address not provided, fetch from Relayer Config
    // Dynamic Discovery: If address not provided, fetch from Relayer Config
    if (!relayerAddressStr) {
        try {
            console.log(`[MultiversX:Pay] Fetching Relayer Address for ${senderAddress.toBech32()} from ${relayerUrl}...`);
            const relayerResp = await axios.get(`${relayerUrl}/relayer/address/${senderAddress.toBech32()}`);
            if (relayerResp.data && relayerResp.data.relayerAddress) {
                relayerAddressStr = relayerResp.data.relayerAddress;
            } else {
                throw new Error("Invalid config response structure: missing relayerAddress");
            }
        } catch (e: unknown) {
            let message = 'Unknown error';
            if (e instanceof Error) message = e.message;
            throw new Error(`Failed to discover Relayer Address from ${relayerUrl}: ${message}`);
        }
    }

    if (!relayerAddressStr) {
        throw new Error("Relayer Address could not be determined for Gasless V3 transactions.");
    }
    const relayerAddress = new Address(relayerAddressStr);


    // 4. Fetch Account State (Nonce)
    const account = await provider.getAccount({ bech32: () => senderAddress.toBech32() });

    // 5. Construct Transaction & Gas Logic
    let payload: Buffer;
    let value: bigint;
    let gasLimit = 0;

    const token = request.token.toUpperCase();
    const isEsdt = token !== 'EGLD' && token !== 'XGLD';

    if (isEsdt) {
        // MultiESDTNFTTransfer Construction
        const destination = new Address(request.target);
        const destHex = destination.toHex();
        const numTransfers = '01';
        const tokenHex = Buffer.from(request.token).toString('hex');
        const nonceHex = '00';

        let amountHex = new BigNumber(request.amount).toString(16);
        if (amountHex.length % 2 !== 0) amountHex = '0' + amountHex;

        const funcHex = Buffer.from('x402-pay').toString('hex');
        const tokenArgHex = Buffer.from(request.token).toString('hex');

        const dataString = `MultiESDTNFTTransfer@${destHex}@${numTransfers}@${tokenHex}@${nonceHex}@${amountHex}@${funcHex}@${tokenArgHex}`;
        payload = Buffer.from(dataString);
        value = 0n;

        // Gas Calculation
        const dataCost = BASE_GAS_LIMIT + GAS_PER_DATA_BYTE * payload.length;
        gasLimit = dataCost + SC_CALL_MIN_GAS + ESDT_TRANSFER_GAS;

    } else {
        // EGLD Transfer with SC Call
        const dataString = "x402-pay " + request.token;
        payload = Buffer.from(dataString);
        value = BigInt(request.amount);

        // Gas Calculation
        const dataCost = BASE_GAS_LIMIT + GAS_PER_DATA_BYTE * payload.length;
        gasLimit = dataCost + SC_CALL_MIN_GAS;
    }

    // Relayed V3 Extra Gas
    gasLimit += RELAYED_V3_EXTRA_GAS;

    const tx = new Transaction({
        nonce: BigInt(account.nonce),
        value: value,
        receiver: new Address(request.target),
        gasLimit: BigInt(gasLimit),
        chainID: process.env.MULTIVERSX_CHAIN_ID || DEFAULT_CHAIN_ID,
        data: payload,
        sender: senderAddress,
        relayer: relayerAddress // Set Relayer for V3 logic (signature verification)
    });

    // 6. Sign
    const signature = await signer.sign(txComputer.computeBytesForSigning(tx));
    tx.signature = signature;

    // 7. Send to Relayer
    const response = await axios.post(`${relayerUrl}/transaction/send`, {
        transaction: tx.toPlainObject()
    });

    return response.data.txHash;
}
