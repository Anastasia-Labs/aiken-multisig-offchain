import {
    LucidEvolution,
    SpendingValidator,
    validatorToAddress,
  } from "@lucid-evolution/lucid";

  import { CborHex, MultiSigValidators } from "../types.js";
  
  export const getSignValidators = (
    lucid: LucidEvolution,
    scripts: { multisig: CborHex }
  ): MultiSigValidators => {
    const multisigVal: SpendingValidator = {
      type: "PlutusV2",
      script: scripts.multisig,
    };
  
    const network = lucid.config().network;
    const multisigValAddress = validatorToAddress(network, multisigVal);
  
    return {
        multisigVal: multisigVal,
        multisigValAddress: multisigValAddress,
    };
  };
  