import { Effect } from "effect";
import { expect, test } from "vitest";
import { endMultiSigTestCase } from "./endMultiSigTestCase";
import { LucidContext, makeLucidContext } from "./service/lucidContext";

test<LucidContext>("Test 4 - End Multisig", async () => {
    const program = Effect.gen(function* ($) {
        const context = yield* makeLucidContext();
        const result = yield* endMultiSigTestCase(context);
        return result;
    });
    const result = await Effect.runPromise(program);
    expect(result.txHash).toBeDefined();
    expect(typeof result.txHash).toBe("string");
    expect(typeof result.endConfig).toBeDefined;
});
