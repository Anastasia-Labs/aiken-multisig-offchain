import {
    Data,
    TxSignBuilder,
    LucidEvolution,
    Assets,
    Lucid,

  } from "@lucid-evolution/lucid";
  
  import { Result, UpdateValidateConfig, ValidateSignConfig } from "../core/types.js";
  
  import { MultisigDatum, MultisigRedeemer } from "../core/contracttypes.js";
  import { getSignValidators } from "../core/utils/misc.js";
  import { parseSafeDatum } from "../core/utils.js";
  import { getValidatorDatum } from "./getValidatorDatum.js";
import { getUpdateValidatorDatum } from "./getUpdateValidatorDatum.js";

  
// adjust threshold
// add signers 
// remove signer and adjust thershold
  export const updateMultisig = async (
    lucid: LucidEvolution,
    config: UpdateValidateConfig
  ): Promise<Result<TxSignBuilder>> => {

    const validators = getSignValidators(lucid, config.scripts);

    const scriptUtxo = (await lucid.utxosByOutRef([config.signOutRef]))[0];

    if (!scriptUtxo)
      return { type: "error", error: new Error("No UTxO with that TxOutRef") };
  
    if (!scriptUtxo.datum)
      return { type: "error", error: new Error("Missing Datum") };

    const multisigRedeemer = Data.to<MultisigRedeemer>("Update",MultisigRedeemer);

// Calculate remaining value
    //const rawDatum = Data.from(scriptUtxo.datum) ;
    //console.log("Raw datum", rawDatum);
    const parsedDatum = await getUpdateValidatorDatum(lucid,config);
    console.log("Parsed Input Datum", parsedDatum);
     const inputDatum: MultisigDatum = {

      signers: parsedDatum[0].signers, // list of pub key hashes
      threshold: parsedDatum[0].threshold,
      funds: parsedDatum[0].funds,
      spendingLimit:parsedDatum[0].spendingLimit,
      
    };
     const inputDatumData = Data.to<MultisigDatum>(inputDatum, MultisigDatum);
    console.log("Input datum", inputDatum);
     const outputDatum: MultisigDatum = {

      signers: config.new_signers, // list of pub key hashes
      threshold: config.new_threshold,
      funds: config.funds,
      spendingLimit:config.new_spendingLimit,
      
    };
     const outputDatumData = Data.to<MultisigDatum>(outputDatum, MultisigDatum);

    try {
      const tx = await lucid
              .newTx()
              //.collectFrom(extraUtxos)
              .collectFrom([scriptUtxo], multisigRedeemer)
              .pay.ToContract(
              validators.multisigValAddress,
              { kind: "inline", value: outputDatumData})//,{lovelace :5_000_000n}) // ,
              .attach.SpendingValidator(validators.multisigVal)
              .addSigner(inputDatum.signers[0])
              .addSigner(inputDatum.signers[1])
              .addSigner(inputDatum.signers[2])
              // .addSigner(config.old_signers[0])
              // .addSigner(config.old_signers[1])
              // .addSigner(config.old_signers[2])
              .complete();

      return { type: "ok", data: tx };  
    } catch (error) {
      console.log("Error in TX",error);
      if (error instanceof Error) return { type: "error", error: error };
      return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
      
    }
    
  }

// Sign                                                 validatesign
// initiator ---------> Script address               -------------->  Spending from the script 
//                                                                     checks spending resourceLimits, thres
//                                                                     redeemer == sign
//             ada   1. pay to the contract 
//                         with datum
// address