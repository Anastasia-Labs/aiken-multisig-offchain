import {
    getUserAddressAndPKH,
    initiateMultiSigPromise,
    LucidEvolution,
    MultiSigConfig,
} from "@anastasia-labs/aiken-multisig-offchain";

export const run = async (
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

    const initConfig: MultiSigConfig = {
        signers: [initiator.pkh, signer1.pkh, signer2.pkh, signer3.pkh],
        threshold: 2n,
        funds: { policyId: "", assetName: "" },
        spending_limit: 10_000_000n,
        total_funds_qty: 100_000_000n,
        minimum_ada: 2_000_000n,
    };

    // Initiate multisig
    try {
        const initTxUnsigned = await initiateMultiSigPromise(lucid, initConfig);

        const initTxSigned = await initTxUnsigned.sign.withWallet().complete();

        const initTxHash = await initTxSigned.submit();

        console.log(`Multisig Contract Initiated: ${initTxHash}`);
    } catch (error) {
        console.error("Failed to initiate multisig:", error);
    }
};
