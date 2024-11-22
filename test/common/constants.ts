import { mintingPolicyToId } from "@lucid-evolution/lucid";
import { readMultiSigValidators } from "./validators";
import blueprint from "../compiled/multisig_validator.json" assert {
    type: "json",
};

const multisigValidator = readMultiSigValidators(blueprint, false, []);
const multiSigPolicyId = mintingPolicyToId(multisigValidator.mintMultiSig);

const multiSigScript = {
    spending: multisigValidator.spendMultiSig.script,
    minting: multisigValidator.mintMultiSig.script,
};

export { multiSigPolicyId, multiSigScript, multisigValidator };