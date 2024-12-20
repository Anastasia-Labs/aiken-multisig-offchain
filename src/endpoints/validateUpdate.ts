import {
  Constr,
  Data,
  LucidEvolution,
  mintingPolicyToId,
  RedeemerBuilder,
  toUnit,
  TransactionError,
  TxSignBuilder,
} from "@lucid-evolution/lucid";

import { UpdateValidateConfig } from "../core/types.js";
import { Effect } from "effect";
import { MultisigDatum } from "../core/contract.types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { tokenNameFromUTxO } from "../core/utils/assets.js";
import { getMultisigDatum } from "../core/utils.js";

// adjust threshold
// add signers
// remove signer and adjust thershold
export const validateUpdate = (
  lucid: LucidEvolution,
  config: UpdateValidateConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
  Effect.gen(function* () {
    const validators = getSignValidators(lucid, config.scripts);

    const multisigPolicyId = mintingPolicyToId(validators.mintPolicy);
    const multisigAddress = validators.spendValAddress;

    const multisigUTxOs = yield* Effect.promise(() =>
      lucid.utxosAt(multisigAddress)
    );
    if (!multisigUTxOs) {
      console.error("No UTxOs with that Address " + multisigAddress);
    }

    const multisig_token_name = tokenNameFromUTxO(
      multisigUTxOs,
      multisigPolicyId,
    );

    const multisigNFT = toUnit(
      multisigPolicyId,
      multisig_token_name,
    );

    const multisigUTxO = yield* Effect.promise(() =>
      lucid.utxoByUnit(
        multisigNFT,
      )
    );

    const updateRedeemer: RedeemerBuilder = {
      kind: "selected",
      makeRedeemer: (inputIndices: bigint[]) => {
        // Construct the redeemer using the input indices
        const multisigIndex = inputIndices[0];
        const multisigOutIndex = 0n;

        return Data.to(
          new Constr(1, [
            new Constr(1, [
              BigInt(multisigIndex),
              BigInt(multisigOutIndex),
            ]),
          ]),
        );
      },
      // Specify the inputs relevant to the redeemer
      inputs: [multisigUTxO, multisigUTxOs[0]],
    };

    const parsedDatum = yield* Effect.promise(() =>
      getMultisigDatum([multisigUTxO])
    );
    const inputDatum: MultisigDatum = {
      signers: parsedDatum[0].signers, // list of pub key hashes
      threshold: parsedDatum[0].threshold,
      funds: parsedDatum[0].funds,
      spendingLimit: parsedDatum[0].spendingLimit,
      minimum_ada: parsedDatum[0].minimum_ada,
    };

    const outputDatum: MultisigDatum = {
      signers: config.new_signers, // list of pub key hashes
      threshold: config.new_threshold,
      funds: config.funds,
      spendingLimit: config.new_spendingLimit,
      minimum_ada: config.minimum_ada,
    };
    const outputDatumData = Data.to<MultisigDatum>(outputDatum, MultisigDatum);

    const totalInputLovelace = BigInt(multisigUTxO.assets.lovelace);

    const tx = yield* lucid
      .newTx()
      .collectFrom([multisigUTxO], updateRedeemer)
      .pay.ToContract(
        validators.spendValAddress,
        { kind: "inline", value: outputDatumData },
        {
          lovelace: totalInputLovelace,
          [multisigNFT]: 1n,
        },
      )
      .attach.SpendingValidator(validators.spendValidator)
      .addSignerKey(inputDatum.signers[0])
      .addSignerKey(inputDatum.signers[1])
      .addSignerKey(inputDatum.signers[2])
      .completeProgram({ localUPLCEval: false });

    return tx;
  });
