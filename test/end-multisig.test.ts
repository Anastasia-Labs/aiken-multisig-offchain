import { Effect } from "effect";
import { LucidContext, makeLucidContext } from "./common/lucidContext";
import { expect, test } from "vitest";
import { endMultiSigTestCase } from "./endMultiSigTestCase";

test<LucidContext>("Test 1 - Successful Sign", async () => {
    const program = Effect.gen(function* ($) {
        const context = yield* makeLucidContext();
        const result = yield* endMultiSigTestCase(context);
        return result;
    });
    const result = await Effect.runPromise(program);

    expect(result.txHash).toBeDefined();
    expect(typeof result.txHash).toBe("string");
    expect(typeof result.signConfig).toBeDefined;
});
