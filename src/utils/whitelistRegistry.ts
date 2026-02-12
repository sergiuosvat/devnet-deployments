import * as fs from "fs";
import * as path from "path";

let cachedWhitelist: string[] | null = null;

/**
 * Load whitelisted marketplace/contract addresses from whitelists.json.
 */
export function loadWhitelist(): string[] {
    try {
        const filePath = path.resolve(process.cwd(), "whitelists.json");
        if (!fs.existsSync(filePath)) {
            console.warn(`Whitelist file not found at ${filePath}. Using empty list.`);
            cachedWhitelist = [];
            return cachedWhitelist;
        }

        const data = fs.readFileSync(filePath, "utf-8");
        const list = JSON.parse(data);

        if (!Array.isArray(list)) {
            console.error("Invalid whitelist format: expected an array of strings.");
            cachedWhitelist = [];
            return cachedWhitelist;
        }

        cachedWhitelist = list;
        return cachedWhitelist;
    } catch (error) {
        console.error("Error loading whitelist:", error instanceof Error ? error.message : "Unknown error");
        cachedWhitelist = [];
        return cachedWhitelist;
    }
}

/**
 * Check if an address is whitelisted.
 * @param address The bech32 address to check.
 */
export function isWhitelisted(address: string): boolean {
    if (cachedWhitelist === null) {
        loadWhitelist();
    }
    return cachedWhitelist?.includes(address) || false;
}

/**
 * Reset the cached whitelist (primarily for testing).
 */
export function resetWhitelistCache(): void {
    cachedWhitelist = null;
}
