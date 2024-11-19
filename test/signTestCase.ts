import {
  SignConfig,
  SpendingValidator,
  validatorToAddress,
} from "../src/index.js";
import { Address, getAddressDetails } from "@lucid-evolution/lucid";
import { expect, test } from "vitest";
import Script from "./compiled/multisig_validator.json";
import { sign } from "../src/endpoints/sign.js";
import { Effect } from "effect";
import { LucidContext, makeLucidContext } from "./common/lucidContext.js";
import { multiSigScript } from "./common/constants.js";

type SignResult = {
  txHash: string;
  signConfig: SignConfig;
};

export const signTestCase = (
  { lucid, users, emulator }: LucidContext,
): Effect.Effect<SignResult, Error, never> => {
  return Effect.gen(function* () {
    const initiatorAddress: Address = users.initiator.address;
    const signer1Address: Address = users.signer1.address;
    const signer2Address: Address = users.signer2.address;

    const pkhInitiator = getAddressDetails(initiatorAddress).paymentCredential
      ?.hash!;
    const pkhSigner1 = getAddressDetails(signer1Address).paymentCredential
      ?.hash!;
    const pkhSigner2 = getAddressDetails(signer2Address).paymentCredential
      ?.hash!;

    const multiSigVal: SpendingValidator = {
      type: "PlutusV2",
      script: Script.validators[0].compiledCode,
    };
    const valAddress = validatorToAddress("Custom", multiSigVal);

    const signConfig: SignConfig = {
      signers: [pkhInitiator, pkhSigner1, pkhSigner2],
      threshold: 3n,
      funds: {
        policyId: "",
        assetName: "",
      },
      spendingLimit: 10_000_000n,
      scripts: multiSigScript,
    };
    lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

    const signFlow = Effect.gen(function* (_) {
      const signResult = yield* sign(
        lucid,
        signConfig,
      );
      const signSigned = yield* Effect.promise(() =>
        signResult.sign.withWallet().complete()
      );

      const signTxHash = yield* Effect.promise(() => signSigned.submit());

      return signTxHash;
    });
    if (emulator) yield* Effect.sync(() => emulator.awaitBlock(10));

    console.log(
      "utxos at initiator address",
      yield* Effect.promise(() => lucid.utxosAt(initiatorAddress)),
    );
    console.log(
      "utxos at validator address",
      yield* Effect.promise(() => lucid.utxosAt(valAddress)),
    );

    const signResult = yield* signFlow.pipe(
      Effect.tapError((error) =>
        Effect.log(`Error creating Account: ${error}`)
      ),
      Effect.map((hash) => {
        return hash;
      }),
    );

    return {
      txHash: signResult,
      signConfig: signConfig,
    };
  });
};
