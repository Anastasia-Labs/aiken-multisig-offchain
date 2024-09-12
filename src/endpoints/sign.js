import { Data, selectUTxOs, fromText, } from "@lucid-evolution/lucid";
import { MultisigDatum } from "../core/contracttypes.js";
import { getOfferValidators } from "../core/utils/misc.js";
export const sign = async (lucid, config) => {
    const validators = getOfferValidators(lucid, config.scripts);
    const pubKey1 = "..."; // Public key hash as a hex string
    const pubKey2 = "...";
    const pubKey3 = "...";
    //const toBuyValue: Value = fromAssets(config.toBuy);
    //const ownAddress: Address = await lucid.wallet().address();
    const multisigDatum = {
        signers: [pubKey1, pubKey2, pubKey3].map(key => fromText(key)), // list of pub key hashes
        threshold: 3n,
        funds: {
            policyId: "", // Empty string for ADA
            assetName: fromText(""), // Empty string for ADA
        },
        spendingLimit: 10000000n,
    };
    const datum = Data.to(multisigDatum, MultisigDatum);
    const walletUTxOs = await lucid.wallet().getUtxos();
    const feeUTxOs = selectUTxOs(walletUTxOs, { lovelace: BigInt(2_000_000) });
    try {
        const tx = await lucid
            .newTx()
            .collectFrom(feeUTxOs)
            .pay.ToContract(validators.multisigValAddress, { kind: "inline", value: datum })
            .complete();
        return { type: "ok", data: tx };
    }
    catch (error) {
        if (error instanceof Error)
            return { type: "error", error: error };
        return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
    }
};
//endpoints
// 1. sign
//       =>construct a config (SignConfig) 
// 2. update threshold
// Function to create a multisig UTXO
// Function to spend from the multisig UTXO
// Function to update the multisig UTXO
//1. any wallet address  
//2. compiled validator in .json file 
//3. validator address
// no need to create wallets for SDK, it is either created and stored in file
//
