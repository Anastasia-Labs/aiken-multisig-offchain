// import {
//     getAddressDetails,
//     InitiateMultiSig,
//     initiateMultiSig,
//     Lucid,
//     Maestro,
//     MultiSigConfig,
//     TxSignBuilder,
//     walletFromSeed,
// } from "@anastasia-labs/aiken-multisig-offchain";
// // import { createMultisig } from "../../src/endpoints";
// // ^ You also might hit ESM vs CJS issues here if your library is pure ESM
// import { Effect } from "effect";

// const API_KEY = process.env.API_KEY!;
// const INITIATOR_SEED = process.env.INITIATOR_SEED!;
// const SIGNER_ONE_SEED = process.env.SIGNER_ONE_SEED!;
// const SIGNER_TWO_SEED = process.env.SIGNER_TWO_SEED!;

// if (!API_KEY || !INITIATOR_SEED || !SIGNER_ONE_SEED || !SIGNER_TWO_SEED) {
//     throw new Error("Missing required environment variables.");
// }

// // Create Lucid instance (remove top-level await)
// const lucid = await Lucid(
//     new Maestro({
//         network: "Preprod",
//         apiKey: API_KEY,
//         turboSubmit: false,
//     }),
//     "Preprod",
// );

// const initPrivKey = walletFromSeed(INITIATOR_SEED);
// const signer1PrivKey = walletFromSeed(SIGNER_ONE_SEED);
// const signer2PrivKey = walletFromSeed(SIGNER_TWO_SEED);

// lucid.selectWallet.fromPrivateKey(initPrivKey.paymentKey);

// const initiatorPkh = getAddressDetails(initPrivKey.address)
//     .paymentCredential?.hash!;
// const signer1Pkh = getAddressDetails(signer1PrivKey.address)
//     .paymentCredential?.hash!;
// const signer2Pkh = getAddressDetails(signer2PrivKey.address)
//     .paymentCredential?.hash!;

// const initConfig: MultiSigConfig = {
//     signers: [initiatorPkh, signer1Pkh, signer2Pkh],
//     threshold: 2n,
//     funds: { policyId: "", assetName: "" },
//     spending_limit: 10_000_000n,
//     total_funds_qty: 90_000_000n,
//     minimum_ada: 2_000_000n,
// };

// // Helper function to sign a Tx
// const signTransaction = async (
//     txUnsigned: TxSignBuilder,
//     privateKey: string,
// ) => {
//     lucid.selectWallet.fromPrivateKey(privateKey);
//     return await txUnsigned.partialSign.withWallet();
// };

// // Initiate multisig
// try {
//     const initTxUnsigned: TxSignBuilder = await Effect.runPromise(
//         initiateMultiSig(lucid, initConfig),
//     );

//     const partialSignatures: string[] = [];
//     partialSignatures.push(
//         await signTransaction(initTxUnsigned, initPrivKey.paymentKey),
//     );
//     partialSignatures.push(
//         await signTransaction(initTxUnsigned, signer1PrivKey.paymentKey),
//     );
//     partialSignatures.push(
//         await signTransaction(initTxUnsigned, signer2PrivKey.paymentKey),
//     );

//     const assembleTx = initTxUnsigned.assemble(partialSignatures);
//     const completeTx = await assembleTx.complete();
//     const txHash = await completeTx.submit();

//     console.log(`Multisig Contract Initiated: ${txHash}`);
// } catch (error) {
//     console.error("Failed to initiate multisig:", error);
// }
