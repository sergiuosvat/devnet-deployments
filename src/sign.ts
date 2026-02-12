import { UserSigner } from '@multiversx/sdk-wallet';
import { Transaction, IPlainTransactionObject, TransactionComputer } from '@multiversx/sdk-core';
import { promises as fs } from 'fs';

interface SignInput {
    transaction: IPlainTransactionObject;
    walletPath?: string;
}

/**
 * Signs a transaction object using the local secure wallet.
 * 
 * @param input SignInput
 * @returns Signed Transaction object ready for broadcast
 */
export async function sign(input: SignInput): Promise<IPlainTransactionObject> {
    const pemPath = input.walletPath || process.env.MULTIVERSX_PRIVATE_KEY;
    if (!pemPath) throw new Error("Wallet path not found");

    const pemContent = await fs.readFile(pemPath, 'utf8');
    const signer = UserSigner.fromPem(pemContent);
    const userAddress = signer.getAddress();

    // Reconstruct transaction from plain object to ensure validity
    const tx = Transaction.newFromPlainObject(input.transaction);

    // Verify sender matches signer
    if (tx.sender.toBech32() !== userAddress.bech32()) {
        throw new Error(`Signer address ${userAddress.bech32()} does not match transaction sender ${tx.sender.toBech32()}`);
    }

    const txComputer = new TransactionComputer();
    const signature = await signer.sign(txComputer.computeBytesForSigning(tx));
    tx.signature = signature;

    return tx.toPlainObject();
}
