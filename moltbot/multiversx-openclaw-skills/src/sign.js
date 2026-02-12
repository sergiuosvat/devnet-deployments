"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sign = sign;
const sdk_wallet_1 = require("@multiversx/sdk-wallet");
const sdk_core_1 = require("@multiversx/sdk-core");
const fs_1 = require("fs");
/**
 * Signs a transaction object using the local secure wallet.
 *
 * @param input SignInput
 * @returns Signed Transaction object ready for broadcast
 */
async function sign(input) {
    const pemPath = input.walletPath || process.env.MULTIVERSX_PRIVATE_KEY;
    if (!pemPath)
        throw new Error("Wallet path not found");
    const pemContent = await fs_1.promises.readFile(pemPath, 'utf8');
    const signer = sdk_wallet_1.UserSigner.fromPem(pemContent);
    const userAddress = signer.getAddress();
    // Reconstruct transaction from plain object to ensure validity
    const tx = sdk_core_1.Transaction.newFromPlainObject(input.transaction);
    // Verify sender matches signer
    if (tx.sender.toBech32() !== userAddress.bech32()) {
        throw new Error(`Signer address ${userAddress.bech32()} does not match transaction sender ${tx.sender.toBech32()}`);
    }
    const txComputer = new sdk_core_1.TransactionComputer();
    const signature = await signer.sign(txComputer.computeBytesForSigning(tx));
    tx.signature = signature;
    return tx.toPlainObject();
}
