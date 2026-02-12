import fs from "fs";
import path from "path";

export interface MarketplaceConfig {
    name: string;
    contracts: string[];
    trust_level: string;
}

export interface ContractAbiConfig {
    address: string;
    abi: {
        function: string;
        args_order: string[];
    };
}

export interface Config {
    marketplaces: MarketplaceConfig[];
    contracts_config: { [key: string]: ContractAbiConfig };
    api_url: string;
}

// Load config once at module level
const configPath = path.join(__dirname, "../../src/config.json");
const rawConfig = fs.readFileSync(configPath, "utf-8");
export const config: Config = JSON.parse(rawConfig);

export default config;
