import { expect, test } from "vitest";
import { Effect } from "effect";
import { LucidContext, makeLucidContext } from "./common/lucidContext.js";
import { signTestCase } from "./signTestCase.js";

test<LucidContext>("Test 1 - Successful Sign", async () => {
  const program = Effect.gen(function* ($) {
    const context = yield* makeLucidContext();
    const result = yield* signTestCase(context);
    return result;
  });
  const result = await Effect.runPromise(program);

  expect(result.txHash).toBeDefined();
  expect(typeof result.txHash).toBe("string");
  expect(typeof result.signConfig).toBeDefined;
});

// wrap the test function with Effect and use Effect.runpromise(function)
