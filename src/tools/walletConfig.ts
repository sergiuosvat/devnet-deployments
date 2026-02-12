/**
 * Wallet management for PEM-based signing
 */

import { UserSecretKey, UserSigner } from "@multiversx/sdk-wallet";
import { Address } from "@multiversx/sdk-core";
import * as fs from "fs";

export interface WalletConfig {
    pemPath?: string;
    walletsDir?: string;
}

export interface LoadedWallet {
    secretKey: UserSecretKey;
    signer: UserSigner;
    address: Address;
}

/**
 * Load wallet configuration from environment variables.
 * MVX_WALLET_PEM: Path to PEM file (required for signing transactions)
 */
export function loadWalletConfig(): WalletConfig {
    return {
        pemPath: process.env.MVX_WALLET_PEM,
        walletsDir: process.env.MVX_WALLET_DIR,
    };
}

/**
 * Load wallet from PEM file.
 * @throws Error if PEM file cannot be read or parsed
 */
export function loadWalletFromPem(pemPath: string): LoadedWallet {
    if (!pemPath) {
        throw new Error("MVX_WALLET_PEM environment variable is not set.");
    }

    const pemContent = fs.readFileSync(pemPath, "utf-8");
    const secretKey = UserSecretKey.fromPem(pemContent);
    const signer = new UserSigner(secretKey);
    const publicKey = secretKey.generatePublicKey();
    const address = Address.newFromBech32(publicKey.toAddress().bech32());

    return {
        secretKey,
        signer,
        address,
    };
}

/**
 * Load all wallets from a directory (for multi-shard support).
 */
export function loadWalletsFromDir(dirPath: string): LoadedWallet[] {
    if (!fs.existsSync(dirPath)) {
        return [];
    }

    const wallets: LoadedWallet[] = [];
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        if (file.endsWith(".pem")) {
            try {
                const w = loadWalletFromPem(dirPath + "/" + file);
                wallets.push(w);
            } catch (e) {
                console.warn(`Failed to load wallet ${file}:`, e);
            }
        }
    }
    return wallets;
}

/**
 * Get the address from a loaded wallet as bech32 string.
 */
export function getWalletAddress(wallet: LoadedWallet): string {
    return wallet.address.toBech32();
}
