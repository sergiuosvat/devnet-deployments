---
name: multiversx-openclaw-skills
description: "Core blockchain operations for MultiversX: Query, Pay (x402), Prove (Validation Registry), and Sign."
version: "1.0.0"
---

# MultiversX OpenClaw Skills

This bundle empowers OpenClaw agents to interact with the MultiversX blockchain.

## Skills

### 1. `multiversx:query`
**Description**: Fetches data from the Shared MCP Server or Blockchain. Use this to check balances, gas prices, or agent reputation.
**Input**:
  - `endpoint`: string (e.g., "/agents/search", "/network/economics")
  - `params`: object (optional query parameters)
**Usage**:
"Check the reputation of agent with nonce 5" -> `multiversx:query(endpoint="/agents/5/reputation")`

### 2. `multiversx:pay`
**Description**: Handles x402 Payment Challenges. Decodes the payment request, signs a transaction via RelayerV3, and returns the payment receipt (transaction hash/token).
**Input**:
  - `paymentHeader`: string (The `WWW-Authenticate` header from a 402 response)
  - `budgetCap`: string (Optional max amount to pay, e.g., "1000000000000000000" for 1 EGLD)
**Usage**:
"I need to pay for this search" -> `multiversx:pay(paymentHeader="x402 token=...", budgetCap="10 EGLD")`

### 3. `multiversx:prove`
**Description**: Submits a Proof-of-Work or Job Result to the Validation Registry.
**Input**:
  - `jobId`: string (The ID of the job being proven)
  - `resultHash`: string (SHA256 hash of the job output)
**Usage**:
"I finished the task, registering proof" -> `multiversx:prove(jobId="job-123", resultHash="a1b2...")`

### 4. `multiversx:sign`
**Description**: Low-level transaction signer using the secure enclave's private key.
**Input**:
  - `transaction`: json (The transaction object)
**Usage**:
"Signing a custom move via the sdk" -> `multiversx:sign(transaction={...})`

## Configuration
Ensure `config.json` or environment variables are set:
- `MULTIVERSX_PRIVATE_KEY`: Path to .pem file
- `MULTIVERSX_MCP_URL`: URL of the shared MCP
- `MULTIVERSX_RELAY_URL`: URL of the Relayer
