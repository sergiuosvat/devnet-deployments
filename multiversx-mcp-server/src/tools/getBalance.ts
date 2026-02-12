/**
 * Get EGLD balance for a MultiversX address
 */

import { z } from "zod";
import { Address } from "@multiversx/sdk-core";
import BigNumber from "bignumber.js";
import { createNetworkProvider, loadNetworkConfig } from "./networkConfig";

import { ToolResult } from "./types";

/**
 * Get the EGLD balance for a given address.
 */
export async function getBalance(address: string): Promise<ToolResult> {
    let addressObj: Address;
    try {
        addressObj = Address.newFromBech32(address);
    } catch {
        return {
            content: [
                {
                    type: "text",
                    text: "Invalid address. Please provide a valid bech32 address (erd1...)",
                },
            ],
        };
    }

    try {
        const config = loadNetworkConfig();
        const api = createNetworkProvider(config);
        const account = await api.getAccount(addressObj);

        const balance = new BigNumber(account.balance.toString());
        const formattedBalance = balance.dividedBy(new BigNumber(10).pow(18)).toString();

        return {
            content: [
                {
                    type: "text",
                    text: `The balance for ${addressObj.toBech32()} is ${formattedBalance} EGLD.`,
                },
            ],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to fetch balance: ${message}`,
                },
            ],
        };
    }
}

export const getBalanceToolName = "get-balance";
export const getBalanceToolDescription = "Get the EGLD balance for a MultiversX address";
export const getBalanceParamScheme = {
    address: z.string().describe("The bech32 representation of the address (erd1...)"),
};
