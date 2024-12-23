import { UpdateValidateConfig, validatorToAddress } from "../src/index.js";
import { expect, test } from "vitest";
import { Effect } from "effect";
import { getUserAddressAndPKH } from "../src/core/utils.js";
import { validateUpdate } from "../src/endpoints/validateUpdate.js";
import { LucidContext, makeLucidContext } from "./common/lucidContext.js";
import { initiateMultiSigTestCase } from "./initiateMultiSigTestCase.js";

type UpdateSignResult = {
  txHash: string;
  updateConfig: UpdateValidateConfig;
};

export const updateTestCase = (
  { lucid, users, emulator }: LucidContext,
): Effect.Effect<UpdateSignResult, Error, never> => {
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

    if (emulator && lucid.config().network === "Custom") {
      const signResult = yield* initiateMultiSigTestCase(
        { lucid, users, emulator },
      );
      expect(signResult).toBeDefined();
      expect(typeof signResult.txHash).toBe("string"); // Assuming the initResult is a transaction hash

      Effect.sync(() => emulator.awaitBlock(10));
    }

    const updateValidatorConfig: UpdateValidateConfig = {
      new_signers: [
        initiator.pkh,
        signer1.pkh,
        signer2.pkh,
        signer3.pkh,
      ],
      new_threshold: 2n,
      funds: {
        policyId: "",
        assetName: "",
      },
      new_spending_limit: 20_000_000n,
      minimum_ada: 2_000_000n,
    };

    lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

    const UpdateSignFlow = Effect.gen(function* (_) {
      const signTxUnSigned = yield* validateUpdate(
        lucid,
        updateValidatorConfig,
      );

      const cboredTx = signTxUnSigned.toCBOR();
      const partialSignatures: string[] = [];

      for (
        const signerSeed of [
          users.initiator.seedPhrase,
          users.signer1.seedPhrase,
          users.signer2.seedPhrase,
        ]
      ) {
        lucid.selectWallet.fromSeed(signerSeed);
        const partialSigner = yield* lucid
          .fromTx(cboredTx)
          .partialSign
          .withWalletEffect();
        partialSignatures.push(partialSigner);
      }

      const assembleTx = signTxUnSigned.assemble(partialSignatures);
      const completeSign = yield* Effect.promise(() => assembleTx.complete());

      const signTxHash = yield* Effect.promise(() => completeSign.submit());

      return signTxHash;
    });
    if (emulator) yield* Effect.sync(() => emulator.awaitBlock(10));

    const signResult = yield* UpdateSignFlow.pipe(
      Effect.tapError((error) =>
        Effect.log(`Error creating Account: ${error}`)
      ),
      Effect.map((hash) => {
        return hash;
      }),
    );

    return {
      txHash: signResult,
      updateConfig: updateValidatorConfig,
    };
  });
};

test<LucidContext>(
  "Test 3 - Successful Update Validation",
  async () => {
    const program = Effect.gen(function* ($) {
      const context = yield* makeLucidContext();
      const result = yield* updateTestCase(context);
      return result;
    });
    const result = await Effect.runPromise(program);

    expect(result.txHash).toBeDefined();
    expect(typeof result.txHash).toBe("string");
    expect(typeof result.updateConfig).toBeDefined;
  },
);
