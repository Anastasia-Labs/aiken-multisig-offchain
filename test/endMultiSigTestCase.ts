import { Effect } from "effect";
import { Address, endMultiSig, getAddressDetails, SignConfig } from "../src";
import { LucidContext } from "./common/lucidContext";
import { multiSigScript } from "./common/constants";
import { initiateMultiSigTestCase } from "./initiateMultiSigTestCase";
import { expect } from "vitest";

type EndMultiSigResult = {
    txHash: string;
    signConfig: SignConfig;
};

export const endMultiSigTestCase = (
    { lucid, users, emulator }: LucidContext,
): Effect.Effect<EndMultiSigResult, Error, never> => {
    return Effect.gen(function* () {
        if (emulator && lucid.config().network === "Custom") {
            const initiateMultiSigResult = yield* initiateMultiSigTestCase({
                lucid,
                users,
                emulator,
            });

            expect(initiateMultiSigResult).toBeDefined();
            expect(typeof initiateMultiSigResult.txHash).toBe("string"); // Assuming the initiateMultiSigResult is a transaction hash
            yield* Effect.sync(() => emulator.awaitBlock(10));
        }

        lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

        const initiatorAddress: Address = users.initiator.address;
        const signer1Address: Address = users.signer1.address;
        const signer2Address: Address = users.signer2.address;

        const pkhInitiator = getAddressDetails(initiatorAddress)
            .paymentCredential
            ?.hash!;
        const pkhSigner1 = getAddressDetails(signer1Address).paymentCredential
            ?.hash!;
        const pkhSigner2 = getAddressDetails(signer2Address).paymentCredential
            ?.hash!;

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

        const initiateMultiSigFlow = Effect.gen(function* (_) {
            const initiateMultisigUnsigned = yield* endMultiSig(
                lucid,
                signConfig,
            );

            const partialSignInitiator = yield* Effect.promise(() =>
                initiateMultisigUnsigned.partialSign
                    .withWallet()
            );
            lucid.selectWallet.fromSeed(users.signer1.seedPhrase);
            const partialSignSigner1 = yield* Effect.promise(() =>
                initiateMultisigUnsigned.partialSign
                    .withWallet()
            );
            lucid.selectWallet.fromSeed(users.signer2.seedPhrase);
            const partialSignSigner2 = yield* Effect.promise(() =>
                initiateMultisigUnsigned.partialSign
                    .withWallet()
            );
            const assembleTx = initiateMultisigUnsigned.assemble([
                partialSignInitiator,
                partialSignSigner1,
                partialSignSigner2,
            ]);
            const completeSign = yield* Effect.promise(() =>
                assembleTx.complete()
            );

            const signTxHash = yield* Effect.promise(() =>
                completeSign.submit()
            );

            return signTxHash;
        });

        const multisigResult = yield* initiateMultiSigFlow.pipe(
            Effect.tapError((error) =>
                Effect.log(`Error end multisig: ${error}`)
            ),
            Effect.map((hash) => {
                return hash;
            }),
        );

        return {
            txHash: multisigResult,
            signConfig: signConfig,
        };
    });
};
