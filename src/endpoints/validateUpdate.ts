import {
  Data,
  LucidEvolution,
  TransactionError,
  TxSignBuilder,
} from "@lucid-evolution/lucid";

import { UpdateValidateConfig } from "../core/types.js";
import { Effect } from "effect";
import { MultisigDatum, MultisigRedeemer } from "../core/contract.types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { getUpdateValidatorDatum } from "./getUpdateValidatorDatum.js";

// adjust threshold
// add signers
// remove signer and adjust thershold
// export const validateUpdate = async (
//   lucid: LucidEvolution,
//   config: UpdateValidateConfig
// ): Promise<Result<TxSignBuilder>> => {

//   const validators = getSignValidators(lucid, config.scripts);

//   const scriptUtxo = (await lucid.utxosByOutRef([config.signOutRef]))[0];

//   if (!scriptUtxo)
//     return { type: "error", error: new Error("No UTxO with that TxOutRef") };

//   if (!scriptUtxo.datum)
//     return { type: "error", error: new Error("Missing Datum") };

//   const multisigRedeemer = Data.to<MultisigRedeemer>("Update",MultisigRedeemer);

//   const parsedDatum = await getUpdateValidatorDatum(lucid,config);

//    const inputDatum: MultisigDatum = {

//     signers: parsedDatum[0].signers, // list of pub key hashes
//     threshold: parsedDatum[0].threshold,
//     funds: parsedDatum[0].funds,
//     spendingLimit:parsedDatum[0].spendingLimit,

//   };

//   //console.log("Input datum", inputDatum);
//    const outputDatum: MultisigDatum = {

//     signers: config.new_signers, // list of pub key hashes
//     threshold: config.new_threshold,
//     funds: config.funds,
//     spendingLimit:config.new_spendingLimit,

//   };
//    const outputDatumData = Data.to<MultisigDatum>(outputDatum, MultisigDatum);

//   try {
//     const tx = await lucid
//             .newTx()
//             .collectFrom([scriptUtxo], multisigRedeemer)
//             .pay.ToContract(
//             validators.multisigValAddress,
//             { kind: "inline", value: outputDatumData})//,{lovelace :5_000_000n}) // ,
//             .attach.SpendingValidator(validators.multisigVal)
//             .addSignerKey(inputDatum.signers[0])
//             .addSignerKey(inputDatum.signers[1])
//             .addSignerKey(inputDatum.signers[2])
//             .complete();

//     return { type: "ok", data: tx };
//   } catch (error) {

//     if (error instanceof Error) return { type: "error", error: error };
//     return { type: "error", error: new Error(`${JSON.stringify(error)}`) };

//   }

// };

export const validateUpdateEffect = (
  lucid: LucidEvolution,
  config: UpdateValidateConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
  Effect.gen(function* () {
    const validators = getSignValidators(lucid, config.scripts);

    const utxo = yield* Effect.promise(() =>
      lucid.utxosByOutRef([config.signOutRef])
    );
    const scriptUtxo = utxo[0];

    // if (!scriptUtxo)
    //   return { type: "error", error: new Error("No UTxO with that TxOutRef") };

    // if (!scriptUtxo.datum)
    //   return { type: "error", error: new Error("Missing Datum") };

    const multisigRedeemer = Data.to<MultisigRedeemer>(
      "Update",
      MultisigRedeemer,
    );

    const parsedDatum = yield* Effect.promise(() =>
      getUpdateValidatorDatum(lucid, config)
    );
    //console.log("Parsed Input Datum", parsedDatum);
    const inputDatum: MultisigDatum = {
      signers: parsedDatum[0].signers, // list of pub key hashes
      threshold: parsedDatum[0].threshold,
      funds: parsedDatum[0].funds,
      spendingLimit: parsedDatum[0].spendingLimit,
    };

    //console.log("Input datum", inputDatum);
    const outputDatum: MultisigDatum = {
      signers: config.new_signers, // list of pub key hashes
      threshold: config.new_threshold,
      funds: config.funds,
      spendingLimit: config.new_spendingLimit,
    };
    const outputDatumData = Data.to<MultisigDatum>(outputDatum, MultisigDatum);
    const tx = yield* lucid
      .newTx()
      .collectFrom([scriptUtxo], multisigRedeemer)
      .pay.ToContract(
        validators.spendValAddress,
        { kind: "inline", value: outputDatumData },
      )
      .attach.SpendingValidator(validators.spendValidator)
      .addSignerKey(inputDatum.signers[0])
      .addSignerKey(inputDatum.signers[1])
      .addSignerKey(inputDatum.signers[2])
      .completeProgram();

    return tx;
  });
