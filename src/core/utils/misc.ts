import {
  LucidEvolution,
  MintingPolicy,
  SpendingValidator,
  validatorToAddress,
} from "@lucid-evolution/lucid";

import { CborHex, MultiSigValidators } from "../types.js";

export const getSignValidators = (
  lucid: LucidEvolution,
  scripts: { spending: CborHex; minting: CborHex },
): MultiSigValidators => {
  const multisigPolicy: MintingPolicy = {
    type: "PlutusV2",
    script: scripts.minting,
  };

  const multisigVal: SpendingValidator = {
    type: "PlutusV2",
    script: scripts.spending,
  };

  const network = lucid.config().network;
  if (!network) {
    throw Error("Invalid Network Selection");
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
