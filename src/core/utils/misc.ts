import {
    Constr,
    LucidEvolution,
    SpendingValidator,
    WithdrawalValidator,
    applyParamsToScript,
    validatorToAddress,
    validatorToRewardAddress,
    validatorToScriptHash,
  } from "@lucid-evolution/lucid";

  import { CborHex, MultiSigValidators } from "../types.js";
  
  export const getOfferValidators = (
    lucid: LucidEvolution,
    scripts: { multisig: CborHex }
  ): MultiSigValidators => {
    const multisigVal: SpendingValidator = {
      type: "PlutusV2",
      script: scripts.multisig,
    };
  
    const network = lucid.config().network;
    //const rewardAddress = validatorToRewardAddress(network, stakingVal);
    //const stakingCred = new Constr(0, [
    //  new Constr(1, [validatorToScriptHash(stakingVal)]),
    //]);
  
    // const directOfferVal: SpendingValidator = {
    //   type: "PlutusV2",
    //   script: applyParamsToScript(scripts.spending, [stakingCred]),
    // };
    const multisigValAddress = validatorToAddress(network, multisigVal);
  
    return {
        multisigVal: multisigVal,
        multisigValAddress: multisigValAddress,
    };
  };
  