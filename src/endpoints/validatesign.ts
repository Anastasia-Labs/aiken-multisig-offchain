import {
    Data,
    TxSignBuilder,
    LucidEvolution,
    Assets,
    Lucid,
    TransactionError,
    UTxO,

  } from "@lucid-evolution/lucid";
  
import { Result,ValidateSignConfig } from "../core/types.js";
import { Effect } from "effect";  
import { MultisigDatum, MultisigRedeemer } from "../core/contracttypes.js";
import { getSignValidators } from "../core/utils/misc.js";
import { parseSafeDatum } from "../core/utils.js";
import { getValidatorDatum } from "./getValidatorDatum.js";

  
// create a transaction that spends from the script address , respecting the spending limit
// so this should have datum and redeemer
// the config should have outref
  export const validateSign = async (
    lucid: LucidEvolution,
    config: ValidateSignConfig
  ): Promise<Result<TxSignBuilder>> => {

    const validators = getSignValidators(lucid, config.scripts);

    const scriptUtxo = (await lucid.utxosByOutRef([config.signOutRef]))[0];

    if (!scriptUtxo)
      return { type: "error", error: new Error("No UTxO with that TxOutRef") };
  
    if (!scriptUtxo.datum)
      return { type: "error", error: new Error("Missing Datum") };

    const multisigRedeemer = Data.to<MultisigRedeemer>("Sign",MultisigRedeemer);
    const withdrawalAmount = config.withdrawalAmount;
    const recipientAddress = config.recipientAddress;
    const inputValue = scriptUtxo.assets.toString();

    const parsedDatum = await getValidatorDatum(lucid,config);
     const datum: MultisigDatum = {

      signers: parsedDatum[0].signers, // list of pub key hashes
      threshold: parsedDatum[0].threshold,
      funds: parsedDatum[0].funds,
      spendingLimit:parsedDatum[0].spendingLimit,
      
    };
     const outputDatum = Data.to<MultisigDatum>(datum, MultisigDatum);

    try {
      const tx = await lucid
              .newTx()
              .collectFrom([scriptUtxo], multisigRedeemer)
              .pay.ToContract(
              validators.multisigValAddress,
              { kind: "inline", value: outputDatum})//,{lovelace :5_000_000n}) // ,
              .attach.SpendingValidator(validators.multisigVal)
              .pay.ToAddress(recipientAddress, { lovelace: withdrawalAmount })
              .addSigner(config.signersList[0])
              .addSigner(config.signersList[1])
              .addSigner(config.signersList[2])
              .complete();
      return { type: "ok", data: tx };  
    } catch (error) {
      if (error instanceof Error) return { type: "error", error: error };
      return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
    }
    
  };

  export const validateSignEffect = (
    lucid: LucidEvolution,
    config: ValidateSignConfig
  ): Effect.Effect<TxSignBuilder, TransactionError , never> => Effect.gen(function* () {

    const validators = getSignValidators(lucid, config.scripts);

    const utxo = yield* Effect.promise(()=>lucid.utxosByOutRef([config.signOutRef])) ;
    const scriptUtxo = utxo[0];

    // if (!scriptUtxo)
    //   return { type: "error", error: new Error("No UTxO with that TxOutRef") };
  
    // if (!scriptUtxo.datum)
    //   return { type: "error", error: new Error("Missing Datum") };

    const multisigRedeemer = Data.to<MultisigRedeemer>("Sign",MultisigRedeemer);
    
    const withdrawalAmount = config.withdrawalAmount;
    const recipientAddress = config.recipientAddress;

 
    const parsedDatum = yield* Effect.promise(()=> getValidatorDatum(lucid,config));
    const datum: MultisigDatum = {

      signers: parsedDatum[0].signers, // list of pub key hashes
      threshold: parsedDatum[0].threshold,
      funds: parsedDatum[0].funds,
      spendingLimit:parsedDatum[0].spendingLimit,
      
    };
    const outputDatum = Data.to<MultisigDatum>(datum, MultisigDatum);

    const extraUtxos = yield* Effect.promise(()=> lucid.wallet().getUtxos());


    const tx = yield* lucid
              .newTx()
              .collectFrom([scriptUtxo], multisigRedeemer)
              .pay.ToContract(
              validators.multisigValAddress,
              { kind: "inline", value: outputDatum})//,{lovelace :5_000_000n}) // ,
              .attach.SpendingValidator(validators.multisigVal)
              .pay.ToAddress(recipientAddress, { lovelace: withdrawalAmount })
              .addSigner(config.signersList[0])
              .addSigner(config.signersList[1])
              .addSigner(config.signersList[2])
              .completeProgram();
    return tx;
  });