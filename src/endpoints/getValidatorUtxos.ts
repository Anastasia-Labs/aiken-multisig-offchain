import { LucidEvolution, UTxO } from "@lucid-evolution/lucid";
import { parseSafeDatum } from "../core/utils.js";
import { getSignValidators } from "../core/utils/misc.js";
import { Effect } from "effect";
import { ReadableUTxO, SignConfig } from "../core/types.js";
import { MultisigDatum } from "../core/contract.types.js";

export const getValidatorUtxos = (
  lucid: LucidEvolution,
  config: SignConfig,
): Effect.Effect<ReadableUTxO<MultisigDatum>[], Error, never> => {
  return Effect.gen(function* (_) {
    const validators = getSignValidators(lucid, config.scripts);

    const validatorUtxos: UTxO[] = yield* Effect.promise(() =>
      lucid.utxosAt(validators.spendValAddress)
    );

    return validatorUtxos.flatMap((utxo) => {
      const result = parseSafeDatum<MultisigDatum>(utxo.datum, MultisigDatum);

      if (result.type === "right") {
        return [{
          outRef: {
            txHash: utxo.txHash,
            outputIndex: utxo.outputIndex,
          },
          datum: result.value,
          assets: utxo.assets,
        }];
      } else {
        return [];
      }
    });
  });
};

// Usage example:
const getUtxos = async (lucid: LucidEvolution, config: SignConfig) => {
  const utxos = await Effect.runPromise(getValidatorUtxos(lucid, config));
  return utxos;
};
