import { Effect } from "effect";
import {
    endMultiSig,
    generatePrivateKey,
    getUserAddressAndPKH,
    SignConfig,
    walletFromSeed,
} from "../src";
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

        const signConfig: SignConfig = {
            signers: [initiator.pkh, signer1.pkh, signer2.pkh, signer3.pkh],
            threshold: 3n,
            funds: {
                policyId: "",
                assetName: "",
            },
            spendingLimit: 10_000_000n,
            minimum_ada: 2_000_000n,
            recipientAddress: recipient.address,
            scripts: multiSigScript,
        };

        // lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
        const endMultiSigFlow = Effect.gen(function* (_) {
            const endMultisigUnsigned = yield* endMultiSig(
                lucid,
                signConfig,
            );

            const partialSignatures: string[] = [];

            // for (
            //     const signerSeed of [
            //         users.initiator.seedPhrase,
            //         users.signer1.seedPhrase,
            //         users.signer2.seedPhrase,
            //     ]
            // ) {
            //     const { pkh } = yield* Effect.promise(() =>
            //         getUserAddressAndPKH(lucid, signerSeed)
            //     );
            //     console.log("Current Signer PKH:", pkh);

            // lucid.selectWallet.fromSeed(signerSeed);
            //     const privateKey = yield* Effect.promise(() =>)lucid.wallet.
            // const partialSignSigner = yield* Effect.promise(() =>
            //     endMultisigUnsigned.partialSign
            //         .withPrivateKey()
            // );
            //     partialSignatures.push(partialSignSigner);
            //     console.log("partialSignatures:", partialSignatures);
            // }

            // lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
            const privKey = walletFromSeed(users.initiator.seedPhrase);

            const partialSignSigner = yield* Effect.promise(() =>
                endMultisigUnsigned.partialSign
                    .withPrivateKey(privKey.paymentKey)
            );

            // lucid.selectWallet.fromSeed(users.signer1.seedPhrase);
            const privKey1 = walletFromSeed(users.signer1.seedPhrase);
            const partialSignSigner2 = yield* Effect.promise(() =>
                endMultisigUnsigned.partialSign
                    .withPrivateKey(privKey1.paymentKey)
            );
            // lucid.selectWallet.fromSeed(users.signer2.seedPhrase);
            const privKey2 = walletFromSeed(users.signer2.seedPhrase);
            const partialSignSigner3 = yield* Effect.promise(() =>
                endMultisigUnsigned.partialSign
                    .withPrivateKey(privKey2.paymentKey)
            );

            console.log("partialSignSigner:", partialSignSigner);
            console.log("partialSignSigner2:", partialSignSigner2);
            console.log("partialSignSigner3:", partialSignSigner3);

            const assembleTx = endMultisigUnsigned.assemble([
                partialSignSigner,
                partialSignSigner2,
                partialSignSigner3,
            ]);
            const completeSign = yield* Effect.promise(() =>
                assembleTx.complete()
            );
            console.log("partialSignatures:", partialSignatures.length);
            console.dir(completeSign.toJSON(), { depth: null });

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
            signConfig: signConfig,
        };
    });
};
