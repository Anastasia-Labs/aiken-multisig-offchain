import {
  LucidEvolution,
  MintingPolicy,
  ScriptType,
  SpendingValidator,
  validatorToAddress,
} from "@lucid-evolution/lucid";

import { CborHex, MultiSigValidators } from "../types.js";

export const getSignValidators = (
  lucid: LucidEvolution,
  scripts: { spending: CborHex; minting: CborHex },
): MultiSigValidators => {
  // let plutusVersion: ScriptType = "PlutusV3"; // "PlutusV2"

  const multisigPolicy: MintingPolicy = {
    type: "PlutusV3",
    script: scripts.minting,
  };

  const multisigVal: SpendingValidator = {
    type: "PlutusV3",
    script: scripts.spending,
  };

  const network = lucid.config().network;
  if (!network) {
    throw new Error("Network configuration is not defined");
  }

  const multisigPolicyAddress = validatorToAddress(network, multisigPolicy);
  const multisigValAddress = validatorToAddress(network, multisigVal);

  return {
    spendValidator: multisigVal,
    spendValAddress: multisigValAddress,
    mintPolicy: multisigPolicy,
    mintPolicyAddress: multisigPolicyAddress,
  };
};
