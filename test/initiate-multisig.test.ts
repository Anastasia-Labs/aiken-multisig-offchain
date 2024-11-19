import { Effect } from "effect";
import { LucidContext, makeLucidContext } from "./common/lucidContext";
import { initiateMultiSigTestCase } from "./initiateMultiSigTestCase";
import { expect, test } from "vitest";

test<LucidContext>("Test 1 - Successful Sign", async () => {
    const program = Effect.gen(function* ($) {
        const context = yield* makeLucidContext();
        const result = yield* initiateMultiSigTestCase(context);
        return result;
    });
    const result = await Effect.runPromise(program);

    expect(result.txHash).toBeDefined();
    expect(typeof result.txHash).toBe("string");
    expect(typeof result.multiSigConfig).toBeDefined;
});
