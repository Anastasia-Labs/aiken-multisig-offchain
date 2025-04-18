import {
    applyDoubleCborEncoding,
    MintingPolicy,
    SpendingValidator,
} from "@lucid-evolution/lucid";
import { Script } from "@lucid-evolution/lucid";

export type Validators = {
    spendMultiSig: SpendingValidator;
    mintMultiSig: MintingPolicy;
    alwaysFails: SpendingValidator;
};

export function readMultiSigValidators(
    blueprint: any,
    _params: boolean,
    _policyIds: string[],
): Validators {
    const getValidator = (title: string): Script => {
        const validator = blueprint.validators.find((v: { title: string }) =>
            v.title === title
        );
        if (!validator) throw new Error(`Validator not found: ${title}`);
        // console.log(`Validator found: ${title}`);

        let script = applyDoubleCborEncoding(validator.compiledCode);

        // if (params && policyIds) {
        //     script = applyParamsToScript(script, policyIds);
        // }

        return {
            type: "PlutusV3",
            script: script,
        };
    };

    return {
        spendMultiSig: getValidator("multisig.multisig.spend"),
        mintMultiSig: getValidator("multisig.multisig.mint"),
        alwaysFails: getValidator("always_fails_validator.always_fails.else"),
    };
}
