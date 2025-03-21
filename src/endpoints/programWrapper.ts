// yourSDK.ts

import { Effect } from "effect";
import { initiateMultiSigProgram } from "./initiateMultiSig.js";
import { LucidEvolution, TxSignBuilder } from "@lucid-evolution/lucid";
import {
    EndSigConfig,
    MultiSigConfig,
    UpdateValidateConfig,
    ValidateSignConfig,
} from "../core/types.js";
import { endMultiSigProgram } from "./endMultiSig.js";
import { validateSignProgram } from "./validateSign.js";
import { validateUpdateProgram } from "./validateUpdate.js";

export async function initiateMultiSig(
    lucid: LucidEvolution,
    config: MultiSigConfig,
): Promise<TxSignBuilder> {
    return Effect.runPromise(
        initiateMultiSigProgram(lucid, config),
    );
}

export async function validateSign(
    lucid: LucidEvolution,
    config: ValidateSignConfig,
): Promise<TxSignBuilder> {
    return Effect.runPromise(
        validateSignProgram(lucid, config),
    );
}

export async function validateUpdate(
    lucid: LucidEvolution,
    config: UpdateValidateConfig,
): Promise<TxSignBuilder> {
    return Effect.runPromise(
        validateUpdateProgram(lucid, config),
    );
}

export async function endMultiSig(
    lucid: LucidEvolution,
    config: EndSigConfig,
): Promise<TxSignBuilder> {
    return Effect.runPromise(
        endMultiSigProgram(lucid, config),
    );
}
