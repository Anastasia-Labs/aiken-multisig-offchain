import {
    Assets,
    Constr,
    Data,
    LucidEvolution,
    mintingPolicyToId,
    RedeemerBuilder,
    toUnit,
    TransactionError,
    TxSignBuilder,
} from "@lucid-evolution/lucid";
import { Effect } from "effect";
import { EndSigConfig } from "../core/types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { tokenNameFromUTxO } from "../core/utils/assets.js";
import { multiSigScript } from "../core/validators/constants.js";
import { getSortedPublicKeyHashes } from "../core/utils.js";

export const endMultiSigProgram = (
    lucid: LucidEvolution,
    config: EndSigConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
    Effect.gen(function* (_) {
        const validators = getSignValidators(lucid, multiSigScript);
        const multisigPolicyId = mintingPolicyToId(validators.mintPolicy);

        const multisigAddress = validators.mintPolicyAddress;

        const multisigUTxOs = yield* Effect.promise(() =>
            lucid.utxosAt(multisigAddress)
        );
        if (!multisigUTxOs) {
            console.error("No UTxOs with that Address " + multisigAddress);
        }

        const multisig_token_name = tokenNameFromUTxO(
            multisigUTxOs,
            multisigPolicyId,
        );

        const multisigNFT = toUnit(
            multisigPolicyId,
            multisig_token_name,
        );

        const multisigUTxO = yield* Effect.promise(() =>
            lucid.utxoByUnit(
                multisigNFT,
            )
        );

        const removeMultiSigRedeemer: RedeemerBuilder = {
            kind: "selected",
            makeRedeemer: (inputIndices: bigint[]) => {
                // Construct the redeemer using the input indices
                return Data.to(
                    new Constr(2, [
                        BigInt(inputIndices[0]),
                    ]),
                );
            },
            // Specify the inputs relevant to the redeemer
            inputs: [multisigUTxO],
        };

        const endMultiSigRedeemer = Data.to(new Constr(1, []));

        const sorted_signers = getSortedPublicKeyHashes(config.signers_addr);

        const multisigValue = { lovelace: multisigUTxO.assets.lovelace };

        const mintingAssets: Assets = {
            [multisigNFT]: -1n,
        };

        const txBuilder = lucid
            .newTx()
            .collectFrom([multisigUTxO], removeMultiSigRedeemer)
            .mintAssets(mintingAssets, endMultiSigRedeemer)
            .pay.ToAddress(config.recipient_address, multisigValue)
            .attach.MintingPolicy(validators.mintPolicy)
            .attach.SpendingValidator(validators.spendValidator);

            const txWithSigners = sorted_signers.reduce(
                (builder, signer) => builder.addSignerKey(signer),
                txBuilder,
            );
            const tx = yield* _(txWithSigners.completeProgram());
            return tx;
           
    });
