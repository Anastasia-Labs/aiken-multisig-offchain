import {
    endMultiSig,
    getUserAddressAndPKH,
    LucidEvolution,
    SignConfig,
    UpdateValidateConfig,
    validateUpdate,
} from "@anastasia-labs/aiken-multisig-offchain";

export const runEnd = async (
    lucid: LucidEvolution,
    INITIATOR_SEED: string,
    SIGNER_ONE_SEED: string,
    SIGNER_TWO_SEED: string,
    SIGNER_THREE_SEED: string,
    RECIPIENT_SEED: string,
): Promise<Error | void> => {
    if (!INITIATOR_SEED || !SIGNER_ONE_SEED || !SIGNER_TWO_SEED) {
        throw new Error("Missing required environment variables.");
    }

    const initiator = await getUserAddressAndPKH(lucid, INITIATOR_SEED);
    const signer1 = await getUserAddressAndPKH(lucid, SIGNER_ONE_SEED);
    const signer2 = await getUserAddressAndPKH(lucid, SIGNER_TWO_SEED);
    const signer3 = await getUserAddressAndPKH(lucid, SIGNER_THREE_SEED);
    const recipient = await getUserAddressAndPKH(lucid, RECIPIENT_SEED);

    console.log("initiator: ", initiator.address);
    const initiatorUTxOs = await lucid.utxosAt(initiator.address);
    console.log("initiatorUTxOs: ", initiatorUTxOs);

    console.log("signer1: ", signer1.address);
    const signer1UTxOs = await lucid.utxosAt(signer1.address);
    console.log("signer1UTxOs: ", signer1UTxOs);

    console.log("signer2: ", signer2.address);
    const signer2UTxOs = await lucid.utxosAt(signer2.address);
    console.log("signer2UTxOs: ", signer2UTxOs);

    console.log("signer3: ", signer3.address);
    const signer3UTxOs = await lucid.utxosAt(signer3.address);
    console.log("signer3UTxOs: ", signer3UTxOs);

    const signConfig: SignConfig = {
        signers: [initiator.pkh, signer1.pkh, signer2.pkh, signer3.pkh],
        threshold: 3n,
        funds: {
            policyId: "",
            assetName: "",
        },
        spending_limit: 10_000_000n,
        minimum_ada: 2_000_000n,
        recipient_address: recipient.address,
    };
    // Sign multisig
    try {
        lucid.selectWallet.fromSeed(INITIATOR_SEED);
        const signTxUnsigned = await endMultiSig(lucid, signConfig);

        const cboredTx = signTxUnsigned.toCBOR();
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

        const assembleTx = signTxUnsigned.assemble(partialSignatures);

        const completeSign = await assembleTx.complete();

        const signTxHash = await completeSign.submit();

        console.log(`Multisig Contract Ended Successfully: ${signTxHash}`);
    } catch (error) {
        console.error("Failed to End multisig:", error);
    }
};