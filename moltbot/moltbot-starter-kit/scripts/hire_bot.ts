import * as dotenv from 'dotenv';
import axios from 'axios';
import { promises as fs } from 'fs';
import * as path from 'path';
import { UserSigner } from '@multiversx/sdk-wallet';
import {
    Address,
    Transaction,
    TransactionComputer,
    Abi,
    DevnetEntrypoint,
    Logger,
} from '@multiversx/sdk-core';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers';
import { Facilitator } from '../src/facilitator';
import { CONFIG } from '../src/config';
import * as validationAbiJson from '../src/abis/validation-registry.abi.json';
import * as reputationAbiJson from '../src/abis/reputation-registry.abi.json';

dotenv.config();

const colors = {
    employer: '\x1b[36m', // Cyan
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
};

function log(message: string, isError = false) {
    const prefix = isError ? colors.red : colors.employer;
    console.log(`${prefix} [CUSTOMER]${colors.reset} ${message}`);
}

async function monitorTx(
    txHash: string,
    provider: ApiNetworkProvider,
): Promise<string> {
    const maxTime = 120000;
    const start = Date.now();

    while (Date.now() - start < maxTime) {
        try {
            const tx = await provider.getTransaction(txHash);
            const status = tx.status.toString().toLowerCase();
            log(`Monitoring ${txHash.substring(0, 10)}...: ${status}`);

            if (status === 'success' || status === 'successful') return txHash;
            if (status === 'fail' || status === 'failed' || status === 'invalid')
                throw new Error(`Tx failed: ${status}`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            if (!message.includes('404')) {
                log(`Monitor error: ${message}`, true);
            }
        }
        await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error('Transaction monitoring timed out');
}

async function waitForJobVerification(jobId: string): Promise<void> {
    const registry = new Address(CONFIG.ADDRESSES.VALIDATION_REGISTRY);
    const maxRetries = 60;

    log(`⏳ Waiting for bot to submit proof for job ${jobId}...`);

    const entrypoint = new DevnetEntrypoint({ url: CONFIG.API_URL });
    const validationAbi = Abi.create(validationAbiJson);
    const controller = entrypoint.createSmartContractController(validationAbi);

    for (let i = 0; i < maxRetries; i++) {
        process.stdout.write('.');
        try {
            const results = await controller.query({
                contract: registry,
                function: 'get_job_data',
                arguments: [Buffer.from(jobId, 'hex')],
            });

            if (results && results.length > 0 && results[0]) {
                const jobData = results[0];
                const hasProof = jobData.proof && jobData.proof.length > 0;
                const isPending = jobData.status.name === 'Pending';

                if (hasProof && isPending) {
                    console.log('');
                    log('✅ Job proof detected and status is Pending!');
                    return;
                }
            }
        } catch (e) {
            Logger.error(e);
        }
        await new Promise(r => setTimeout(r, 5000));
    }
    console.log('');
    throw new Error('Job verification timed out');
}

async function getAgentNonce(address: string): Promise<number> {
    try {
        const searchAddr = new Address(address);
        log(`🔍 Looking for Agent Nonce for ${address}...`);

        const response = await axios.post(`${CONFIG.API_URL}/vm-values/query`, {
            scAddress: CONFIG.ADDRESSES.IDENTITY_REGISTRY,
            funcName: 'get_agent_id',
            args: [],
        });

        const returnData = response.data?.data?.data?.returnData || [];
        for (let i = 0; i < returnData.length; i += 2) {
            if (i + 1 < returnData.length) {
                const nonceB64 = returnData[i];
                const addressB64 = returnData[i + 1];

                const nonceBuf = Buffer.from(nonceB64, 'base64');
                const nonce = nonceBuf.length === 0 ? 0n : BigInt('0x' + nonceBuf.toString('hex'));
                const addr = new Address(Buffer.from(addressB64, 'base64')).toBech32();

                if (addr === searchAddr.toBech32()) {
                    log(`✅ Found Agent Nonce: ${nonce}`);
                    return Number(nonce);
                }
            }
        }
        return 0;
    } catch (error) {
        log(`Error fetching agent nonce: ${error}`, true);
        return 0;
    }
}

async function submitReputation(
    jobId: string,
    agentNonce: number,
    rating: number,
    provider: ApiNetworkProvider,
    signer: UserSigner,
    sender: string,
): Promise<void> {
    log(`⭐ Submitting ${rating}-star review for Agent #${agentNonce}...`);
    const registry = new Address(CONFIG.ADDRESSES.REPUTATION_REGISTRY);
    const senderAddr = new Address(sender);

    const entrypoint = new DevnetEntrypoint({ url: CONFIG.API_URL });
    const reputationAbi = Abi.create(reputationAbiJson);
    const factory = entrypoint.createSmartContractTransactionsFactory(reputationAbi);

    const account = await provider.getAccount({ bech32: () => sender });

    const tx = await factory.createTransactionForExecute(senderAddr, {
        contract: registry,
        function: 'giveFeedbackSimple',
        arguments: [Buffer.from(jobId, 'hex'), BigInt(agentNonce), BigInt(rating)],
        gasLimit: 10_000_000n,
    });

    tx.nonce = BigInt(account.nonce);
    const computer = new TransactionComputer();
    tx.signature = await signer.sign(computer.computeBytesForSigning(tx));

    const txHash = await provider.sendTransaction(tx);
    log(`✅ Review submitted! TxHash: ${txHash}`);
    await monitorTx(txHash, provider);
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 MOLTBOT HIRING FLOW DEMO');
    console.log('='.repeat(60) + '\n');

    // 1. Load Employer Wallet
    const employerPemPath = path.resolve('grace.pem');
    const pemContent = await fs.readFile(employerPemPath, 'utf8');
    const signer = UserSigner.fromPem(pemContent);
    const employerAddr = signer.getAddress().bech32();

    log(`Customer Address: ${employerAddr}`);

    // 2. Prepare Job
    const facilitator = new Facilitator();

    // Grab worker address from its pem
    const workerPemPath = path.resolve('wallet.pem');
    const workerPemContent = await fs.readFile(workerPemPath, 'utf8');
    const workerSigner = UserSigner.fromPem(workerPemContent);
    const workerAddr = workerSigner.getAddress().bech32();

    const agentNonce = await getAgentNonce(workerAddr);
    if (agentNonce === 0) {
        throw new Error(`Could not find agent ID for worker address ${workerAddr}. Is the bot registered?`);
    }

    // Load config for service info
    let serviceId = 1;
    try {
        const configPath = path.resolve('config.json');
        const botConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
        serviceId = botConfig.services?.[0]?.service_id || 1;
    } catch (e) {
        log('Config file not found or invalid, defaulting to service ID 1');
    }

    log(`🎯 Hiring Agent #${agentNonce} (Service ${serviceId})`);

    const preparation = await facilitator.prepare({
        agentNonce: agentNonce,
        serviceId: serviceId.toString(),
        employerAddress: employerAddr,
        payload: 'https://pastebin.com/raw/itiqT0Hg',
    });

    log(`📝 Job prepared: ${preparation.jobId}`);

    // Use the clean data field from preparation
    const settlementData = preparation.data;

    // 3. Settle Job
    const provider = new ApiNetworkProvider(CONFIG.API_URL);
    const account = await provider.getAccount({ bech32: () => employerAddr });

    const tx = new Transaction({
        nonce: BigInt(account.nonce),
        value: BigInt(preparation.amount),
        receiver: Address.newFromBech32(preparation.registryAddress),
        sender: Address.newFromBech32(employerAddr),
        gasPrice: 1_000_000_000n,
        gasLimit: 30_000_000n,
        data: Buffer.from(settlementData),
        chainID: CONFIG.CHAIN_ID,
    });

    const computer = new TransactionComputer();
    const bytesToSign = computer.computeBytesForSigning(tx);
    const signature = await signer.sign(bytesToSign);

    const settlementPayload = {
        nonce: Number(tx.nonce),
        value: tx.value.toString(),
        receiver: tx.receiver.toBech32(),
        sender: tx.sender.toBech32(),
        gasPrice: Number(tx.gasPrice),
        gasLimit: Number(tx.gasLimit),
        data: settlementData,
        chainID: tx.chainID,
        version: tx.version,
        options: tx.options,
        signature: Buffer.from(signature).toString('hex'),
    };

    log('📤 Sending settlement transaction...');
    const settlement = await facilitator.settle(settlementPayload);
    log(`✅ Settlement broadcasted! TxHash: ${settlement.txHash}`);

    await monitorTx(settlement.txHash, provider);
    log('💰 Payment settled. Bot should now pick up the job.');

    // 4. Wait for Proof
    await waitForJobVerification(preparation.jobId);

    // 5. Submit Review
    await submitReputation(
        preparation.jobId,
        agentNonce,
        5, // 5-star rating
        provider,
        signer,
        employerAddr,
    );

    console.log('\n' + '='.repeat(60));
    console.log(`${colors.green}🎉 HIRE FLOW DEMO COMPLETED SUCCESSFULLY!${colors.reset}`);
    console.log('='.repeat(60) + '\n');
}

main().catch(err => {
    console.error('\n❌ Error in demo:', err);
    process.exit(1);
});
