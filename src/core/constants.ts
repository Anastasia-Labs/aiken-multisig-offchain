import { mintingPolicyToId } from "@lucid-evolution/lucid";
import blueprint from "./compiled/multisig_validator.json" with {
    type: "json",
};
import { readMultiSigValidators } from "./compiled/validators.js";

const multisigValidator = readMultiSigValidators(blueprint, false, []);
const multiSigPolicyId = mintingPolicyToId(multisigValidator.mintMultiSig);

const multiSigScript = {
    spending: multisigValidator.spendMultiSig.script,
    minting: multisigValidator.mintMultiSig.script,
};

export { multiSigPolicyId, multiSigScript, multisigValidator };
