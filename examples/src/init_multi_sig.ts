import {
    getUserAddressAndPKH,
    initiateMultiSig,
    LucidEvolution,
    MultiSigConfig,
} from "@anastasia-labs/aiken-multisig-offchain";

export const runInit = async (
    lucid: LucidEvolution,
    INITIATOR_SEED: string,
    SIGNER_ONE_SEED: string,
    SIGNER_TWO_SEED: string,
    SIGNER_THREE_SEED: string,
): Promise<Error | void> => {
    if (!INITIATOR_SEED || !SIGNER_ONE_SEED || !SIGNER_TWO_SEED) {
        throw new Error("Missing required environment variables.");
    }

    const initiator = await getUserAddressAndPKH(lucid, INITIATOR_SEED);
    const signer1 = await getUserAddressAndPKH(lucid, SIGNER_ONE_SEED);
    const signer2 = await getUserAddressAndPKH(lucid, SIGNER_TWO_SEED);
    const signer3 = await getUserAddressAndPKH(lucid, SIGNER_THREE_SEED);

    console.log("initiator.address", initiator.address);
    console.log("initiator.address", signer1.address);
    console.log("initiator.address", signer2.address);
    console.log("initiator.address", signer3.address);

    const initConfig: MultiSigConfig = {
        signers_addr: [initiator.address, signer1.address, signer2.address],
        threshold: 2n,
        fund_policy_id: "", // For ADA, leave empty
        fund_asset_name: "", // For ADA, leave empty
        spending_limit: 10_000_000n,
        total_funds_qty: 100_000_000n,
    };

    // Initiate multisig
    try {
        lucid.selectWallet.fromSeed(INITIATOR_SEED);
        const initTxUnsigned = await initiateMultiSig(lucid, initConfig);

        const cboredTx = initTxUnsigned.toCBOR();
        const partialSignatures: string[] = [];

        for (
            const signerSeed of [
                INITIATOR_SEED,
                SIGNER_ONE_SEED,
                SIGNER_TWO_SEED,
            ]
        ) {
            lucid.selectWallet.fromSeed(signerSeed);
            const partialSigner = await lucid
                .fromTx(cboredTx)
                .partialSign
                .withWallet();
            partialSignatures.push(partialSigner);
        }

        const assembleTx = initTxUnsigned.assemble(
            partialSignatures,
        );

        const initTxSigned = await assembleTx.complete();
        const initTxHash = await initTxSigned.submit();
        console.log(`Submitting ...`);
        await lucid.awaitTx(initTxHash);

        console.log(`Multisig Contract Initiated Successfully: ${initTxHash}`);
    } catch (error) {
        console.error("Failed to initiate multisig:", error);
    }
};
