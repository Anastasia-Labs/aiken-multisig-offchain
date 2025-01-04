import { Effect } from "effect";
import {
    EndMultisigConfig,
    endMultiSigProgram,
    getUserAddressAndPKH,
} from "../src";
import { LucidContext } from "./common/lucidContext";
import { initiateMultiSigTestCase } from "./initiateMultiSigTestCase";
import { expect } from "vitest";

type EndMultiSigResult = {
    txHash: string;
    endConfig: EndMultisigConfig;
};

export const endMultiSigTestCase = (
    { lucid, users, emulator }: LucidContext,
): Effect.Effect<EndMultiSigResult, Error, never> => {
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
            const initiateMultiSigResult = yield* initiateMultiSigTestCase({
                lucid,
                users,
                emulator,
            });

            expect(initiateMultiSigResult).toBeDefined();
            expect(typeof initiateMultiSigResult.txHash).toBe("string"); // Assuming the initiateMultiSigResult is a transaction hash
            yield* Effect.sync(() => emulator.awaitBlock(10));
        }

        const endConfig: EndMultisigConfig = {
            signers: [initiator.pkh, signer1.pkh, signer2.pkh, signer3.pkh],
            threshold: 3n,
            funds: {
                policyId: "",
                assetName: "",
            },
            spending_limit: 10_000_000n,
            minimum_ada: 2_000_000n,
            recipient_address: recipient.address,
        };

        lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
        const endMultiSigFlow = Effect.gen(function* (_) {
            const endMultisigUnsigned = yield* endMultiSigProgram(
                lucid,
                endConfig,
            );

            const cboredTx = endMultisigUnsigned.toCBOR();
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

            const assembleTx = endMultisigUnsigned.assemble(partialSignatures);
            const completeSign = yield* Effect.promise(() =>
                assembleTx.complete()
            );

            const signTxHash = yield* Effect.promise(() =>
                completeSign.submit()
            );

            return signTxHash;
        });

        const multisigResult = yield* endMultiSigFlow.pipe(
            Effect.tapError((error) =>
                Effect.log(`Error end multisig: ${error}`)
            ),
            Effect.map((hash) => {
                return hash;
            }),
        );

        return {
            txHash: multisigResult,
            endConfig: endConfig,
        };
    });
};
