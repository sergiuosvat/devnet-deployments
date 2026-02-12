import config from "../config.json";

/**
 * Contract addresses for MX-8004 Registries
 */

export const REGISTRY_ADDRESSES = {
    // Identity Registry (Agent NFT Collection Owner / Manifest Indexer)
    IDENTITY: process.env.MVX_REGISTRY_IDENTITY || config.registry_config.identity,

    // Reputation Registry (Trust scores and job totals)
    REPUTATION: process.env.MVX_REGISTRY_REPUTATION || config.registry_config.reputation,

    // Validation Registry (Job proofs and verification status)
    // Note: In some deployments, Reputation and Validation might be the same contract or linked.
    VALIDATION: process.env.MVX_REGISTRY_VALIDATION || config.registry_config.validation,
};
