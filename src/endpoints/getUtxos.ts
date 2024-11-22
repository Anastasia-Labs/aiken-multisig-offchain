import { LucidEvolution, UTxO } from "@lucid-evolution/lucid";

import { getSignValidators } from "../core/utils/misc.js";
import { parseSafeDatum } from "../core/utils.js";
import { MultisigDatum } from "../core/contract.types.js";
import { Config, ReadableUTxO } from "../core/types.js";

export const getUtxos = async (
  lucid: LucidEvolution,
  config: Config,
): Promise<ReadableUTxO<MultisigDatum>[]> => {
  const validators = getSignValidators(lucid, config.scripts);

  const validatorUtxos: UTxO[] = await lucid.utxosAt(
    validators.spendValAddress,
  );

  return validatorUtxos.flatMap((utxo) => {
    const result = parseSafeDatum<MultisigDatum>(utxo.datum, MultisigDatum);

    if (result.type == "right") {
      return {
        outRef: {
          txHash: utxo.txHash,
          outputIndex: utxo.outputIndex,
        },
        datum: result.value,
        assets: utxo.assets,
      };
    } else {
      return [];
    }
  });
};
