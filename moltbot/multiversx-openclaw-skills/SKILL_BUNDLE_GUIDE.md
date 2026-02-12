# MultiversX OpenClaw Skills Guide

This guide provides a comprehensive reference for the **MultiversX OpenClaw Skills Bundle**, enabling AI agents to interact with the MultiversX blockchain.

## 1. Installation

Install the package in your OpenClaw agent environment:
```bash
npm install multiversx-openclaw-skills
```

## 2. Configuration

Set the following environment variables:
| Variable | Description | Required |
| :--- | :--- | :--- |
| `MULTIVERSX_PRIVATE_KEY` | Path to the `wallet.pem` file. | Yes |
| `MULTIVERSX_MCP_URL` | URL of the Shared MCP Server. | No (Default: `http://localhost:3000`) |
| `MULTIVERSX_RELAY_URL` | URL of the Relayer Service (for V3 transactions). | Yes (for `pay`) |
| `MULTIVERSX_RELAYER_ADDRESS` | Public address of the relayer (if not auto-discovered). | No |
| `MULTIVERSX_VALIDATION_REGISTRY` | Address of the Validation SC. | Yes (for `prove`) |

## 3. Skill API Reference

### 3.1. Pay (x402 Settlement)
Handles parsing of `x402` headers and executing payments via **Relayed V3** (Gasless).

```typescript
import { pay } from 'multiversx-openclaw-skills/src/pay';

const txHash = await pay({
  paymentHeader: 'x402 token="USDC-1234" target="erd1..." amount="5000000"',
  relayerUrl: "https://relay.multiversx.com" 
});
```
**Features:**
- **Auto-Discovery**: Automatically fetches the Relayer's address if not configured.
- **Gasless**: The agent pays 0 gas; the Relayer pays the network fee.
- **Token Support**: Automatically uses `MultiESDTNFTTransfer` for ESDT tokens.

### 3.2. Query (MCP Data)
Fetches contextual data about accounts or the economy.

```typescript
import { query } from 'multiversx-openclaw-skills/src/query';

const account = await query({
  endpoint: 'accounts/erd1...'
});
console.log(`Balance: ${account.balance}`);
```

### 3.3. Prove (Validation)
Submits a cryptographic proof of work to the chain to boost reputation.

```typescript
import { prove } from 'multiversx-openclaw-skills/src/prove';

const hash = await prove({
  jobId: "job-uuid-1234",
  resultHash: "sha256-hash-of-result"
});
```

### 3.4. Sign (Secure Enclave)
Signs raw transaction objects. useful for custom flows.

```typescript
import { sign } from 'multiversx-openclaw-skills/src/sign';

const signedTx = await sign({
  transaction: plainTransactionObject
});
```

## 4. Prompt Engineering (LLM Usage)

When exposing these skills to an LLM, use the following descriptions:

> **Skill: Pay**
> "Use this to settle an 'x402' Payment Required challenge. Input the full header string. The system will handle gas and signing."

> **Skill: Prove**
> "Call this after completing a job to register your work on-chain. Requires the Job ID and a hash of your output."

## 5. Troubleshooting

- **Error: "Relayer Address not found"**: Ensure `MULTIVERSX_RELAY_URL` is reachable and supports the `/config` endpoint, or set `MULTIVERSX_RELAYER_ADDRESS` manually.
- **Error: "Signer does not match sender"**: The `sender` field in your transaction MUST match the address generated from `MULTIVERSX_PRIVATE_KEY` pem.
