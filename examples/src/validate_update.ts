import {
    getUserAddressAndPKH,
    LucidEvolution,
    UpdateValidateConfig,
    validateUpdate,
} from "@anastasia-labs/aiken-multisig-offchain";

export const runUpdate = async (
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

    const updateConfig: UpdateValidateConfig = {
        new_signers_addr: [
            initiator.address,
            signer1.address,
            signer2.address,
            signer3.address,
        ],
        new_threshold: 3n,
        fund_policy_id: "",
        fund_asset_name: "",
        new_spending_limit: 15_000_000n,
    };
    // Update multisig
    try {
        lucid.selectWallet.fromSeed(INITIATOR_SEED);
        const updateTxUnsigned = await validateUpdate(lucid, updateConfig);

        const cboredTx = updateTxUnsigned.toCBOR();
        const partialSignatures: string[] = [];

        for (
            const signerSeed of [
                INITIATOR_SEED,
                SIGNER_ONE_SEED,
                SIGNER_TWO_SEED,
                SIGNER_THREE_SEED,
            ]
        ) {
            lucid.selectWallet.fromSeed(signerSeed);
            const partialSigner = await lucid
                .fromTx(cboredTx)
                .partialSign
                .withWallet();
            partialSignatures.push(partialSigner);
        }

        const assembleTx = updateTxUnsigned.assemble(partialSignatures);
        const completeSign = await assembleTx.complete();
        const updateTxHash = await completeSign.submit();

        console.log(`Submitting ...`);
        await lucid.awaitTx(updateTxHash);

        console.log(`Multisig Contract Updated Successfully: ${updateTxHash}`);
    } catch (error) {
        console.error("Failed to Update multisig:", error);
    }
};
