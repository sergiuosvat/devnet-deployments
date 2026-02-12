/**
 * Query full account details for a MultiversX address
 */

import { z } from "zod";
import { Address } from "@multiversx/sdk-core";
import BigNumber from "bignumber.js";
import { createNetworkProvider, loadNetworkConfig } from "./networkConfig";
import { ToolResult } from "./types";

export interface AccountDetails {
    address: string;
    balance: string;
    balanceFormatted: string;
    nonce: number;
}

/**
 * Query detailed account information.
 */
export async function queryAccount(address: string): Promise<ToolResult> {
    let addressObj: Address;
    try {
        addressObj = Address.newFromBech32(address);
    } catch {
        return {
            content: [
                {
                    type: "text",
                    text: "Invalid address format. Please provide a valid bech32 address (erd1...)",
                },
            ],
        };
    }

    try {
        const config = loadNetworkConfig();
        const api = createNetworkProvider(config);
        const account = await api.getAccount(addressObj);

        const balance = new BigNumber(account.balance.toString());
        const balanceFormatted = balance.dividedBy(new BigNumber(10).pow(18)).toString();

        const details: AccountDetails = {
            address: account.address.toBech32(),
            balance: account.balance.toString(),
            balanceFormatted: `${balanceFormatted} EGLD`,
            nonce: Number(account.nonce),
        };

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(details, null, 2),
                },
            ],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to query account: ${message}`,
                },
            ],
        };
    }
}

export const queryAccountToolName = "query-account";
export const queryAccountToolDescription =
    "Fetch detailed account information (balance, nonce, shard)";
export const queryAccountParamScheme = {
    address: z.string().describe("The bech32 address to query (erd1...)"),
};
