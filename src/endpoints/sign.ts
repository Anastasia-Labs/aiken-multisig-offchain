import {
  Data,
  TxSignBuilder,
  LucidEvolution,
  selectUTxOs,
  TransactionError,
} from "@lucid-evolution/lucid";

import { Effect } from "effect";
import { Result, SignConfig } from "../core/types.js";

import { MultisigDatum } from "../core/contract.types.js";
import { getSignValidators } from "../core/utils/misc.js";

// creates a transaction which transfers ADA to the script
// export const sign = async (
//   lucid: LucidEvolution,
//   config: SignConfig // it doesnt need to be all the fields in datum may be outref 
// ): Promise<Result<TxSignBuilder>> => {
//   const validators = getSignValidators(lucid, config.scripts);

//   const multisigDatum: MultisigDatum = {

//     signers: config.signers, // list of pub key hashes
//     threshold: config.threshold.valueOf(),
//     funds: config.funds,
//     spendingLimit:config.spendingLimit.valueOf(),
    
//   };

//   const datum = Data.to<MultisigDatum>(multisigDatum, MultisigDatum);

//   const walletUTxOs = await lucid.wallet().getUtxos();

//   const feeUTxOs = selectUTxOs(walletUTxOs, { lovelace: BigInt(2_000_000) });

//   try {
//     const tx = await lucid
//       .newTx()
//       .collectFrom(feeUTxOs)
//       .pay.ToContract(
//         validators.multisigValAddress,
//         { kind: "inline", value: datum }//,{lovelace : 20_000_000n}
//         //config.offer
//       )
//       .complete();

//     return { type: "ok", data: tx };
//   } catch (error) {
//     if (error instanceof Error) return { type: "error", error: error };
//     return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
    
//   }
// };

export const signEffect = (
  lucid: LucidEvolution,
  config: SignConfig // it doesnt need to be all the fields in datum may be outref 
): Effect.Effect<TxSignBuilder, TransactionError , never> => Effect.gen(function* ()  { 
  const validators = getSignValidators(lucid, config.scripts);

  const multisigDatum: MultisigDatum = {

    signers: config.signers, // list of pub key hashes
    threshold: config.threshold.valueOf(),
    funds: config.funds,
    spendingLimit:config.spendingLimit.valueOf(),
    
  };
  const datum = Data.to<MultisigDatum>(multisigDatum, MultisigDatum);

  const walletUTxOs = yield* Effect.promise(()=>lucid.wallet().getUtxos());
  const feeUTxOs = selectUTxOs(walletUTxOs, { lovelace: BigInt(2_000_000) });

  const tx =  yield* lucid
      .newTx()
      .collectFrom(feeUTxOs)
      .pay.ToContract(
        validators.multisigValAddress,
        { kind: "inline", value: datum },
      )
      .completeProgram();
      return tx
});

