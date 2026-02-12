# API Reference: MultiversX MCP Tools

This document provides detailed specifications for all tools available in the MultiversX MCP server.

---

## 1. Account & Balance

### `get-balance`
Retrieve the EGLD balance of a specific address.

**Parameters:**
- `address` (string): Valid MultiversX bech32 address (erd1...).

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Balance for erd1...: 10.5 EGLD"
    }
  ]
}
```

### `query-account`
Fetch detailed account information.

**Parameters:**
- `address` (string): Valid MultiversX bech32 address.

**Example Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"address\":\"erd1...\",\"nonce\":42,\"balance\":\"10500000000000000000\",\"username\":\"alice.elrond\"}"
    }
  ]
}
```

---

## 2. Transfers

### `send-egld`
Transfer EGLD to another address.

**Parameters:**
- `receiver` (string): Receiver's bech32 address.
- `amount` (string): Amount in atomic units (18 decimals).

### `send-tokens`
Transfer ESDT tokens to another address.

**Parameters:**
- `receiver` (string): Receiver's address.
- `tokenIdentifier` (string): The token ID (e.g., ABC-123456).
- `amount` (string): Amount in atomic units.
- `nonce` (number, optional): Token nonce (for NFTs/SFTs).

---

## 3. Token Management

### `issue-fungible-token`
Issue a new fungible ESDT token.

**Parameters:**
- `tokenName` (string): 3-20 chars.
- `tokenTicker` (string): 3-10 UPPERCASE chars.
- `initialSupply` (string): Total supply in atomic units.
- `numDecimals` (number): 0-18.

### `create-nft`
Mint an NFT or SFT into an existing collection.

**Parameters:**
- `collectionIdentifier` (string): Collection ID.
- `name` (string): NFT name.
- `royalties` (number): 0-10000 (0-100%).
- `quantity` (string): Mint quantity (1 for NFT, >1 for SFT).
- `uris` (string[]): List of metadata/image URIs.

---

## 4. Advanced Tools

### `create-relayed-v3`
Prepare and sign a RelayedV3 transaction where the relayer sponsors the gas.

**Parameters:**
- `innerTransaction` (object): A plain object representation of the transaction to be relayed.

### `search-products`
Search for NFTs/SFTs with metadata filtering.

**Parameters:**
- `query` (string): Search terms.
- `collection` (string, optional): Filter by collection.
- `limit` (number, optional): Max results.
