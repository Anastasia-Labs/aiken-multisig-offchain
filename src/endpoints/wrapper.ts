import { Effect } from "effect";
import { MultiSigConfig } from "../core/types.js";
import { initiateMultiSig } from "./initiateMultiSig.js";
import { LucidConfig, LucidEvolution } from "@lucid-evolution/lucid";

export async function createMultisig(
    lucid: LucidEvolution,
    config: MultiSigConfig,
) {
    return await initiateMultiSig(lucid, config).pipe(Effect.runPromise);
}
