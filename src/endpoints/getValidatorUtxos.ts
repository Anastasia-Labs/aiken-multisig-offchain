import { LucidEvolution, UTxO } from "@lucid-evolution/lucid";
import { MultisigDatum, ReadableUTxO, SignConfig } from "../core";
import { parseSafeDatum } from "../core/utils";
import { getSignValidators } from "../core/utils/misc.js";

export const getValidatorUtxos = async (
    lucid: LucidEvolution,
    config: SignConfig
  ): Promise<ReadableUTxO<MultisigDatum>[]> => {
    const validators = getSignValidators(lucid, config.scripts);
  
    const validatorUtxos: UTxO[] = await lucid.utxosAt(
      validators.multisigValAddress
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