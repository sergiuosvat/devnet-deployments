# Technical Specification: RelayedV3 Port

This document details the implementation of the RelayedV3 protocol (gas-sponsored transactions) in the MultiversX MCP server.

## Overview

RelayedV3 allows a **Sender** (user) to create a transaction and a **Relayer** (MCP Server) to pay for its gas. Unlike previous versions, V3 is integrated directly into the transaction structure.

## Transaction Structure

A RelayedV3 transaction is a standard `Transaction` object with the following specific fields set:

- `relayer`: The bech32 address of the relayer account.
- `relayerSignature`: The signature of the relayer over the entire transaction (including the sender's signature).
- `gasLimit`: Must be sufficient to cover both the inner operation and the relaying overhead.

## Signing Sequence

The `create-relayed-v3` tool follows this sequence:

1. **Input Validation**: Reconstructs the `innerTransaction` from the input plain object.
2. **Relayer Assignment**: Sets `tx.relayer = relayerAddress` (from the MCP server's PEM).
3. **Serialization**: The transaction is serialized into a signable JSON format using the SDK's `TransactionComputer.toPlainObject()`.
4. **Signing**: 
   - The relayer computes `bytesToSign` using `TransactionComputer.computeBytesForSigning(tx)`.
   - The relayer signs these bytes with their private key.
   - The resulting signature is stored in the `relayerSignature` field.

## Implementation Details

The implementation utilizes the `@multiversx/sdk-core` (v15+) `Transaction` and `TransactionComputer` classes.

```typescript
// Reconstruct and set relayer
const tx = Transaction.newFromPlainObject(innerTransaction);
tx.relayer = relayerWallet.address;

// Compute bytes and sign
const bytesToSign = txComputer.computeBytesForSigning(tx);
const signature = await relayerWallet.signer.sign(bytesToSign);

// Attach relayer signature
tx.relayerSignature = signature;
```

## Security Considerations

- **Gas Sponsoring**: The MCP server must ensure it only relays transactions to trusted recipients or implements rate limiting, as it pays the gas fees.
- **Relayer PEM**: The relayer's secret key must be stored securely (e.g., via environment variables not committed to Git).
