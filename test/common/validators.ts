import {
    applyDoubleCborEncoding,
    MintingPolicy,
    SpendingValidator,
} from "@lucid-evolution/lucid";
import { Script } from "@lucid-evolution/lucid";

export type Validators = {
    spendMultiSig: SpendingValidator;
    mintMultiSig: MintingPolicy;
};

export function readMultiSigValidators(
    blueprint: any,
    params: boolean,
    policyIds: string[],
): Validators {
    const getValidator = (title: string): Script => {
        const validator = blueprint.validators.find((v) => v.title === title);
        if (!validator) throw new Error(`Validator not found: ${title}`);

        let script = applyDoubleCborEncoding(validator.compiledCode);

        // if (params && policyIds) {
        //     script = applyParamsToScript(script, policyIds);
        // }

        return {
            type: "PlutusV2",
            script: script,
        };
    };

    return {
        spendMultiSig: getValidator("multisig.multisig_validator"),
        mintMultiSig: getValidator("multisig.multisig_policy"),
    };
}
