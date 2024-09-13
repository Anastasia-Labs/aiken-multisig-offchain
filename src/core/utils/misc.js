import { validatorToAddress, } from "@lucid-evolution/lucid";
export const getSignValidators = (lucid, scripts) => {
    const multisigVal = {
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
