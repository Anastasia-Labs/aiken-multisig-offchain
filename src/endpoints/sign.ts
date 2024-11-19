import {
  Address,
  Data,
  LucidEvolution,
  selectUTxOs,
  TransactionError,
  TxSignBuilder,
} from "@lucid-evolution/lucid";

import { Effect } from "effect";
import { SignConfig } from "../core/types.js";

import { MultisigDatum } from "../core/contract.types.js";
import { getSignValidators } from "../core/utils/misc.js";

// creates a transaction which transfers ADA to the script
export const sign = (
  lucid: LucidEvolution,
  config: SignConfig, // It doesnt need to be all the fields in datum may be outref
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
  Effect.gen(function* () {
    const validators = getSignValidators(lucid, config.scripts);
    const walletAddress: Address = yield* Effect.promise(() =>
      lucid.wallet().address()
    );

    const walletUTxOs = yield* Effect.promise(() =>
      lucid.utxosAt(walletAddress)
    );

    const multisigDatum: MultisigDatum = {
      signers: config.signers, // list of pub key hashes
      threshold: config.threshold.valueOf(),
      funds: config.funds,
      spendingLimit: config.spendingLimit.valueOf(),
    };
    const datum = Data.to<MultisigDatum>(multisigDatum, MultisigDatum);

    const feeUTxOs = selectUTxOs(walletUTxOs, { lovelace: BigInt(2_000_000) });

    const tx = yield* lucid
      .newTx()
      .collectFrom(feeUTxOs)
      .pay.ToContract(
        validators.spendValAddress,
        { kind: "inline", value: datum },
      )
      .completeProgram();

    return tx;
  });

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
