import { LucidEvolution, UTxO } from "@lucid-evolution/lucid";
import { MultisigDatum, ReadableUTxO, Result, SignConfig, ValidateSignConfig } from "../core";
import { parseSafeDatum } from "../core/utils";
import { getSignValidators } from "../core/utils/misc.js";

export const getValidatorDatum = async (
    lucid: LucidEvolution,
    config: ValidateSignConfig
  ): Promise<MultisigDatum[]> => {
    const validators = getSignValidators(lucid, config.scripts);
  
    const validatorUtxos: UTxO[] = await lucid.utxosAt(
      validators.multisigValAddress
    );
  
    return validatorUtxos.flatMap((utxo) => {
      const result = parseSafeDatum<MultisigDatum>(utxo.datum, MultisigDatum);
  
      if (result.type == "right") {
        return {
            signers: result.value.signers,
            threshold: result.value.threshold,
            funds: result.value.funds,
            spendingLimit: result.value.spendingLimit,
        };
      } else {
        return [];
      }
    });
  };