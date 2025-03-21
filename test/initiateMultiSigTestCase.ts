import { Effect } from "effect";
import { initiateMultiSigProgram, MultiSigConfig } from "../src";
import { LucidContext } from "./service/lucidContext";
import { multiSigScript } from "../src/core/validators/constants";
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
        const recipient = yield* Effect.promise(() =>
            getUserAddressAndPKH(lucid, users.recipient.seedPhrase)
        );

        console.log("initiator: ", initiator.address);
        const multisigConfig: MultiSigConfig = {
            signers: [initiator.pkh, signer1.pkh, signer2.pkh, signer3.pkh],
            threshold: 3n,
            fund_policy_id: "",
            fund_asset_name: "",
            spending_limit: 10_000_000n,
            total_funds_qty: 200_000_000n,
        };

        lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

        const initiateMultiSigFlow = Effect.gen(function* (_) {
            const initiateMultisigUnsigned = yield* initiateMultiSigProgram(
                lucid,
                multisigConfig,
            );

            // console.log(
            //     "initiateMultisigUnsigned: ",
            //     initiateMultisigUnsigned.toJSON(),
            // );

            const cboredTx = initiateMultisigUnsigned.toCBOR();
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
