# E2E Testing Guide: MultiversX MCP Server

This guide explains how to configure and execute end-to-end tests for the MultiversX MCP Server.

## Prerequisites

1.  **MultiversX Devnet Wallet**: You need a wallet on the Devnet with some xEGLD for transaction tests.
    *   Create one via the [MultiversX Wallet (Devnet)](https://devnet-wallet.multiversx.com/).
    *   Get funds from the [Devnet Faucet](https://r3d.multiversx.com/).
2.  **PEM File**: Export your wallet's private key to a `.pem` file.
    *   Place it in a secure location (e.g., `./wallets/e2e-test.pem`).

## Configuration

1.  **Copy the Template**:
    ```bash
    cp .env.example .env
    ```
2.  **Edit `.env`**:
    *   `MVX_NETWORK`: Set to `devnet`.
    *   `MVX_SIGNING_MODE`: Set to `signed` for full E2E verification.
    *   `MVX_WALLET_PEM`: Provide the absolute or relative path to your PEM file.

> [!IMPORTANT]
> The `.env` file and `*.pem` files are added to `.gitignore`. Never commit your real secret keys to the repository.

## Running Tests

### 1. Install Dependencies
```bash
npm install
npx playwright install
```

### 2. Run All E2E Tests
```bash
npx playwright test src/__tests__/e2e
```

### 3. Run Specific Scenarios
```bash
# Only read-only tests
npx playwright test src/__tests__/e2e/readOnly.spec.ts

# Transaction tests
npx playwright test src/__tests__/e2e/transactions.spec.ts
```

### 4. Debug Mode
Launch Playwright in UI mode to step through tests:
```bash
npx playwright test --ui
```

## Troubleshooting

*   **Insufficient Funds**: If transaction tests fail with "insufficient funds", check your Devnet balance.
*   **PEM Not Found**: Ensure the `MVX_WALLET_PEM` path in `.env` is correct.
*   **API Timeouts**: Devnet APIs can sometimes be slow. Playwright is configured with a default timeout, but you can increase it in `playwright.config.ts`.
