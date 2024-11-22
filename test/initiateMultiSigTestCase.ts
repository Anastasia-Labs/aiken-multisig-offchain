import { Effect } from "effect";
import { initiateMultiSig, MultiSigConfig } from "../src";
import { LucidContext } from "./common/lucidContext";
import { multiSigScript } from "./common/constants";
import { getUserAddressAndPKH } from "../src/core/utils";

type MultiSigResult = {
    txHash: string;
    multiSigConfig: MultiSigConfig;
};

export const initiateMultiSigTestCase = (
    { lucid, users }: LucidContext,
): Effect.Effect<MultiSigResult, Error, never> => {
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

        const multisigConfig: MultiSigConfig = {
            signers: [initiator.pkh, signer1.pkh, signer2.pkh, signer3.pkh],
            threshold: 3n,
            funds: {
                policyId: "",
                assetName: "",
            },
            spendingLimit: 10_000_000n,
            totalFundsQty: 200_000_000n,
            minimum_ada: 2_000_000n,
            scripts: multiSigScript,
        };
        lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
        console.log(
            "utxos at initiator address",
            yield* Effect.promise(() => lucid.utxosAt(initiator.address)),
        );
        const initiateMultiSigFlow = Effect.gen(function* (_) {
            const initiateMultisigUnsigned = yield* initiateMultiSig(
                lucid,
                multisigConfig,
            );

            const partialSignatures: string[] = [];

            for (
                const signerSeed of [
                    users.initiator.seedPhrase,
                    users.signer1.seedPhrase,
                    users.signer2.seedPhrase,
                ]
            ) {
                lucid.selectWallet.fromSeed(signerSeed);
                const partialSignSigner = yield* Effect.promise(() =>
                    initiateMultisigUnsigned.partialSign
                        .withWallet()
                );
                partialSignatures.push(partialSignSigner);
            }

            const assembleTx = initiateMultisigUnsigned.assemble(
                partialSignatures,
            );
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
                Effect.log(`Error initiating multisig: ${error}`)
            ),
            Effect.map((hash) => {
                return hash;
            }),
        );

        return {
            txHash: multisigResult,
            multiSigConfig: multisigConfig,
        };
    });
};
