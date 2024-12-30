import { ValidateSignConfig, validatorToAddress } from "../src/index.js";
import { expect, test } from "vitest";
import { Effect } from "effect";
import { validateSignProgram } from "../src/endpoints/validateSign.js";
import { LucidContext, makeLucidContext } from "./common/lucidContext.js";
import { initiateMultiSigTestCase } from "./initiateMultiSigTestCase.js";
import { getUserAddressAndPKH } from "../src/core/utils.js";

type SignResult = {
  txHash: string;
  signConfig: ValidateSignConfig;
};

export const validateSignTestCase = (
  { lucid, users, emulator }: LucidContext,
): Effect.Effect<SignResult, Error, never> => {
  return Effect.gen(function* () {
    const initiator = yield* Effect.promise(() =>
      getUserAddressAndPKH(lucid, users.initiator.seedPhrase)
    );

    const signer1 = yield* Effect.promise(() =>
      getUserAddressAndPKH(lucid, users.signer1.seedPhrase)
    );

    const signer2 = yield* Effect.promise(() =>
      getUserAddressAndPKH(lucid, users.signer2.seedPhrase)
    );

    const signer3 = yield* Effect.promise(() =>
      getUserAddressAndPKH(lucid, users.signer3.seedPhrase)
    );

    const recipient = yield* Effect.promise(() =>
      getUserAddressAndPKH(lucid, users.recipient.seedPhrase)
    );

    if (emulator && lucid.config().network === "Custom") {
      const signResult = yield* initiateMultiSigTestCase(
        { lucid, users, emulator },
      );
      expect(signResult).toBeDefined();
      expect(typeof signResult.txHash).toBe("string"); // Assuming the initResult is a transaction hash

      Effect.sync(() => emulator.awaitBlock(10));
    }

    const validateSignConfig: ValidateSignConfig = {
      withdrawal_amount: 5_000_000n,
      recipient_address: recipient.address,
      signers_list: [initiator.pkh, signer1.pkh, signer2.pkh, signer3.pkh],
    };

    lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
    const validateSignFlow = Effect.gen(function* (_) {
      const signTxUnsigned = yield* validateSignProgram(
        lucid,
        validateSignConfig,
      );

      const cboredTx = signTxUnsigned.toCBOR();
      const partialSignatures: string[] = [];

      for (
        const signerSeed of [
          users.initiator.seedPhrase,
          users.signer1.seedPhrase,
          users.signer2.seedPhrase,
          users.signer3.seedPhrase,
        ]
      ) {
        lucid.selectWallet.fromSeed(signerSeed);
        const partialSigner = yield* lucid
          .fromTx(cboredTx)
          .partialSign
          .withWalletEffect();
        partialSignatures.push(partialSigner);
      }
      const assembleTx = signTxUnsigned.assemble(partialSignatures);
      const completeSign = yield* Effect.promise(() => assembleTx.complete());

      const signTxHash = yield* Effect.promise(() => completeSign.submit());

      return signTxHash;
    });

    if (emulator) yield* Effect.sync(() => emulator.awaitBlock(10));

    const validateSignResult = yield* validateSignFlow.pipe(
      Effect.tapError((error) =>
        Effect.log(`Error Validating Successful Sign: ${error}`)
      ),
      Effect.map((hash) => {
        return hash;
      }),
    );

    return {
      txHash: validateSignResult,
      signConfig: validateSignConfig,
    };
  });
};

test<LucidContext>("Test 2 - Successful Sign Validation", async () => {
  const program = Effect.gen(function* ($) {
    const context = yield* makeLucidContext();
    const result = yield* validateSignTestCase(context);
    return result;
  });
  const result = await Effect.runPromise(program);

  expect(result.txHash).toBeDefined();
  expect(typeof result.txHash).toBe("string");
  expect(typeof result.signConfig).toBeDefined;
});
