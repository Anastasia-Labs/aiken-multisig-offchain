import {
  Emulator,
  generateEmulatorAccount,
  Lucid,
  LucidEvolution,
  SignConfig,
  SpendingValidator,
  ValidateSignConfig,
  validatorToAddress,
} from "../src/index.js";
import { Address, getAddressDetails } from "@lucid-evolution/lucid";
import { beforeEach, expect, test } from "vitest";
import { Effect } from "effect";
import { validateSign } from "../src/endpoints/validatesign.js";
import { getValidatorUtxos } from "../src/endpoints/getValidatorUtxos.js";
import { getPublicKeyHash } from "../src/core/utils.js";
import { LucidContext, makeLucidContext } from "./common/lucidContext.js";
import Script from "./compiled/multisig_validator.json";
import { sign } from "../src/endpoints/sign.js";
import { signTestCase } from "./signTestCase.js";
import { multiSigScript } from "./common/constants.js";

type SignResult = {
  txHash: string;
  signConfig: SignConfig;
};

export const validateSignTestCase = (
  { lucid, users, emulator }: LucidContext,
): Effect.Effect<SignResult, Error, never> => {
  return Effect.gen(function* () {
    const initiatorAddress: Address = users.initiator.address;
    const signer1Address: Address = users.signer1.address;
    const signer2Address: Address = users.signer2.address;
    const recipientAddress: Address = users.recipient.address;

    // remove exclamatory
    const pkhInitiator = getAddressDetails(initiatorAddress).paymentCredential
      ?.hash!;
    const pkhSigner1 = getAddressDetails(signer1Address).paymentCredential
      ?.hash!;
    const pkhSigner2 = getAddressDetails(signer2Address).paymentCredential
      ?.hash!;
    const pkhUsingFn = getPublicKeyHash(initiatorAddress);

    //console.log("Pub key hash using fucntion", pkhUsingFn);

    const multiSigVal: SpendingValidator = {
      type: "PlutusV2",
      script: Script.validators[0].compiledCode,
    };
    const valAddress = validatorToAddress("Custom", multiSigVal);

    const signConfig: SignConfig = {
      signers: [pkhInitiator, pkhSigner1, pkhSigner2],
      threshold: 2n,
      funds: {
        policyId: "",
        assetName: "",
      },
      spendingLimit: 10_000_000n,
      scripts: multiSigScript,
    };
    lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

    if (emulator && lucid.config().network === "Custom") {
      const signResult = yield* signTestCase(
        { lucid, users, emulator },
      );
      expect(signResult).toBeDefined();
      expect(typeof signResult.txHash).toBe("string"); // Assuming the initResult is a transaction hash

      Effect.sync(() => emulator.awaitBlock(10));
    }
    const validatorUtxos = yield* getValidatorUtxos(lucid, signConfig);

    const validateSignConfig: ValidateSignConfig = {
      signOutRef: validatorUtxos[0].outRef,
      withdrawalAmount: 10_000_000n,
      recipientAddress: recipientAddress,
      signersList: [initiatorAddress, signer1Address, signer2Address],
      scripts: multiSigScript,
    };

    lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

    const validateSignFlow = Effect.gen(function* (_) {
      const validatesignTxUnSigned = yield* validateSign(
        lucid,
        validateSignConfig,
      );

      const partialSignInitiator = yield* Effect.promise(() =>
        validatesignTxUnSigned.partialSign
          .withWallet()
      );
      lucid.selectWallet.fromSeed(users.signer1.seedPhrase);
      const partialSignSigner1 = yield* Effect.promise(() =>
        validatesignTxUnSigned.partialSign
          .withWallet()
      );
      lucid.selectWallet.fromSeed(users.signer2.seedPhrase);
      const partialSignSigner2 = yield* Effect.promise(() =>
        validatesignTxUnSigned.partialSign
          .withWallet()
      );
      const assembleTx = validatesignTxUnSigned.assemble([
        partialSignInitiator,
        partialSignSigner1,
        partialSignSigner2,
      ]);
      const completeSign = yield* Effect.promise(() => assembleTx.complete());

      const signTxHash = yield* Effect.promise(() => completeSign.submit());

      return signTxHash;
    });

    if (emulator) yield* Effect.sync(() => emulator.awaitBlock(10));

    console.log(
      "utxos at recipient address",
      yield* Effect.promise(() => lucid.utxosAt(recipientAddress)),
    );
    console.log(
      "utxos at validator address",
      yield* Effect.promise(() => lucid.utxosAt(valAddress)),
    );

    const validateSignResult = yield* validateSignFlow.pipe(
      Effect.tapError((error) =>
        Effect.log(`Error creating Account: ${error}`)
      ),
      Effect.map((hash) => {
        return hash;
      }),
    );

    return {
      txHash: validateSignResult,
      signConfig: signConfig,
    };
  });
};

test<LucidContext>("Test 1 - Successful Sign Validation", async () => {
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
