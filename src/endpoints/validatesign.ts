import {
  Address,
  Assets,
  Data,
  Lucid,
  LucidEvolution,
  TransactionError,
  TxSignBuilder,
  UTxO,
} from "@lucid-evolution/lucid";

import { Result, ValidateSignConfig } from "../core/types.js";
import { Effect } from "effect";
import { MultisigDatum, MultisigRedeemer } from "../core/contract.types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { parseSafeDatum } from "../core/utils.js";
import { getValidatorDatum } from "./getValidatorDatum.js";

// create a transaction that spends from the script address , respecting the spending limit
// so this should have datum and redeemer
// the config should have outref
// export const validateSign = async (
//   lucid: LucidEvolution,
//   config: ValidateSignConfig
// ): Promise<Result<TxSignBuilder>> => {

//   const validators = getSignValidators(lucid, config.scripts);

//   const scriptUtxo = (await lucid.utxosByOutRef([config.signOutRef]))[0];

//   if (!scriptUtxo)
//     return { type: "error", error: new Error("No UTxO with that TxOutRef") };

//   if (!scriptUtxo.datum)
//     return { type: "error", error: new Error("Missing Datum") };

//   const multisigRedeemer = Data.to<MultisigRedeemer>("Sign",MultisigRedeemer);
//   const withdrawalAmount = config.withdrawalAmount;
//   const recipientAddress = config.recipientAddress;
//   const inputValue = scriptUtxo.assets.toString();

//   const parsedDatum = await getValidatorDatum(lucid,config);
//    const datum: MultisigDatum = {

//     signers: parsedDatum[0].signers, // list of pub key hashes
//     threshold: parsedDatum[0].threshold,
//     funds: parsedDatum[0].funds,
//     spendingLimit:parsedDatum[0].spendingLimit,

//   };
//    const outputDatum = Data.to<MultisigDatum>(datum, MultisigDatum);

//   try {
//     const tx = await lucid
//             .newTx()
//             .collectFrom([scriptUtxo], multisigRedeemer)
//             .pay.ToContract(
//             validators.multisigValAddress,
//             { kind: "inline", value: outputDatum})//,{lovelace :5_000_000n}) // ,
//             .attach.SpendingValidator(validators.multisigVal)
//             .pay.ToAddress(recipientAddress, { lovelace: withdrawalAmount })
//             .addSigner(config.signersList[0])
//             .addSigner(config.signersList[1])
//             .addSigner(config.signersList[2])
//             .complete();
//     return { type: "ok", data: tx };
//   } catch (error) {
//     if (error instanceof Error) return { type: "error", error: error };
//     return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
//   }

// };

export const validateSign = (
  lucid: LucidEvolution,
  config: ValidateSignConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
  Effect.gen(function* () {
    const validators = getSignValidators(lucid, config.scripts);
    const walletAddress: Address = yield* Effect.promise(() =>
      lucid.wallet().address()
    );

    const walletUTxOs = yield* Effect.promise(() =>
      lucid.utxosAt(walletAddress)
    );

    const scriptUtxos = yield* Effect.promise(() =>
      lucid.utxosByOutRef([config.signOutRef])
    );

    if (!scriptUtxos) {
      console.error("No UTxO with that TxOutRef " + config.signOutRef);
    }

    const multisigRedeemer = Data.to<MultisigRedeemer>(
      "Sign",
      MultisigRedeemer,
    );

    const parsedDatum = yield* Effect.promise(() =>
      getValidatorDatum(lucid, config)
    );

    const multisigDatum: MultisigDatum = {
      signers: parsedDatum[0].signers, // list of pub key hashes
      threshold: parsedDatum[0].threshold,
      funds: parsedDatum[0].funds,
      spendingLimit: parsedDatum[0].spendingLimit,
    };
    const outputDatum = Data.to<MultisigDatum>(multisigDatum, MultisigDatum);

    // const extraUtxos = yield* Effect.promise(() => lucid.wallet().getUtxos());

    const tx = yield* lucid
      .newTx()
      .collectFrom(scriptUtxos, multisigRedeemer)
      .pay.ToContract(
        validators.spendValAddress,
        { kind: "inline", value: outputDatum },
      ) //,{lovelace :5_000_000n}) // ,
      .attach.SpendingValidator(validators.spendValidator)
      .pay.ToAddress(config.recipientAddress, {
        lovelace: config.withdrawalAmount,
      })
      .addSigner(config.signersList[0])
      .addSigner(config.signersList[1])
      .addSigner(config.signersList[2])
      .completeProgram();
    return tx;
  });
