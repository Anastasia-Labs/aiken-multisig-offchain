import {
    getUserAddressAndPKH,
    LucidEvolution,
} from "@anastasia-labs/aiken-multisig-offchain";

export const runCborSubmit = async (
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
    console.log("signer1.address", signer1.address);
    console.log("signer2.address", signer2.address);
    console.log("signer3.address", signer3.address);

    // // Submit Endpoint multisig
    try {
        lucid.selectWallet.fromSeed(INITIATOR_SEED);

        const parsedTx = lucid.fromTx("Put your CBOR transaction here");

        const cboredTx = parsedTx.toCBOR();
        const partialSignatures: string[] = [];

        for (
            const signerSeed of [
                INITIATOR_SEED,
                SIGNER_ONE_SEED,
                SIGNER_TWO_SEED,
                SIGNER_THREE_SEED
            ]
        ) {
            lucid.selectWallet.fromSeed(signerSeed);
            const partialSigner = await lucid
                .fromTx(cboredTx)
                .partialSign
                .withWallet();
            partialSignatures.push(partialSigner);
        }

        const assembleTx = parsedTx.assemble(
            partialSignatures,
        );

        const cborTxSigned = await assembleTx.complete();
        const cborTxHash = await cborTxSigned.submit();

        console.log(`Submitting ...`);
        await lucid.awaitTx(cborTxHash);

        console.log(`Multisig Contract Signed and Submitted Successfully: ${cborTxHash}`);
    } catch (error) {
        console.error("Failed to Sign and Submit Multisig:", error);
    }
};
