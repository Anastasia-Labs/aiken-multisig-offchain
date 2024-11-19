import { Effect } from "effect";
import {
    Address,
    getAddressDetails,
    initiateMultiSig,
    MultiSigConfig,
} from "../src";
import { LucidContext } from "./common/lucidContext";
import { multiSigScript } from "./common/constants";

type MultiSigResult = {
    txHash: string;
    multiSigConfig: MultiSigConfig;
};

export const initiateMultiSigTestCase = (
    { lucid, users }: LucidContext,
): Effect.Effect<MultiSigResult, Error, never> => {
    return Effect.gen(function* () {
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

        const multisigConfig: MultiSigConfig = {
            signers: [pkhInitiator, pkhSigner1, pkhSigner2],
            threshold: 3n,
            funds: {
                policyId: "",
                assetName: "",
            },
            spendingLimit: 10_000_000n,
            totalFundsQty: 1_000_000_000n,
            scripts: multiSigScript,
        };

        const initiateMultiSigFlow = Effect.gen(function* (_) {
            const initiateMultisigUnsigned = yield* initiateMultiSig(
                lucid,
                multisigConfig,
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
