"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackOrder = trackOrder;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../utils/config");
async function trackOrder(txHash) {
    if (!txHash) {
        return { status: "unknown", details: "No hash provided" };
    }
    try {
        const url = `${config_1.config.api_url}/transactions/${txHash}`;
        const response = await axios_1.default.get(url);
        const tx = response.data;
        // Map MultiversX status to UCP status
        // MvX: pending, success, fail, invalid
        switch (tx.status) {
            case "pending":
            case "reward-reverted": // Edge case where it's technically determining
                return {
                    status: "pending",
                    details: "Transaction is broadcasting or processing.",
                    retry_after: 5
                };
            case "success":
                return {
                    status: "success",
                    details: "Order processed successfully on-chain."
                };
            case "fail":
            case "invalid":
                return {
                    status: "failed",
                    details: `Transaction failed. Error: ${tx.operations?.[0]?.message || "Unknown error"}`
                };
            default:
                // Handle "received" or other interim states
                return {
                    status: "pending",
                    details: `Current status: ${tx.status}`,
                    retry_after: 2
                };
        }
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
            // 404 means Propogation Delay (Hasn't hit API yet) -> Return Pending per spec
            return {
                status: "pending",
                details: "Transaction not yet indexed by API (Propagation Delay).",
                retry_after: 5
            };
        }
        return {
            status: "unknown",
            details: `API Error: ${error.message}`
        };
    }
}
