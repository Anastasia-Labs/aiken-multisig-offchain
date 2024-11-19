import {
    Address,
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
import { MultisigDatum } from "../core/contract.types.js";
import { Effect } from "effect";
import { SignConfig } from "../core/types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { tokenNameFromUTxO } from "../core/utils/assets.js";

export const endMultiSig = (
    lucid: LucidEvolution,
    config: SignConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
    Effect.gen(function* () {
        const initiatorAddress: Address = yield* Effect.promise(() =>
            lucid.wallet().address()
        );

        const validators = getSignValidators(lucid, config.scripts);
        const multisigPolicyId = mintingPolicyToId(validators.mintPolicy);

        const multisigAddress = validators.mintPolicyAddress;

        const multisigUTxOs = yield* Effect.promise(() =>
            lucid.config().provider.getUtxos(multisigAddress)
        );

        const initiatorUTxOs = yield* Effect.promise(() =>
            lucid.utxosAt(initiatorAddress)
        );
        if (!initiatorUTxOs || !initiatorUTxOs.length) {
            console.error(
                "No UTxO found at user address: " + initiatorAddress,
            );
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
                const multisigIndex = inputIndices[0];
                const multisigOutIndex = inputIndices[0];

                return Data.to(
                    new Constr(1, [
                        new Constr(2, [
                            BigInt(multisigIndex),
                            BigInt(multisigOutIndex),
                        ]),
                    ]),
                );
            },
            // Specify the inputs relevant to the redeemer
            inputs: [multisigUTxO],
        };

        const endMultiSigRedeemer: RedeemerBuilder = {
            kind: "selected",
            makeRedeemer: (inputIndices: bigint[]) => {
                // Construct the redeemer using the input indices
                const multisigIndex = inputIndices[0];

                return Data.to(
                    new Constr(1, [
                        BigInt(multisigIndex),
                    ]),
                );
            },
            // Specify the inputs relevant to the redeemer
            inputs: [multisigUTxO],
        };

        const multisigDatum: MultisigDatum = {
            signers: config.signers, // list of pub key hashes
            threshold: config.threshold,
            funds: config.funds,
            spendingLimit: config.spendingLimit,
        };

        const multisigValue = { lovelace: multisigUTxO.assets.lovelace };

        const mintingAssets: Assets = {
            [multisigNFT]: -1n,
        };

        const tx = yield* lucid
            .newTx()
            .collectFrom([multisigUTxO], removeMultiSigRedeemer)
            .mintAssets(mintingAssets, endMultiSigRedeemer)
            .pay.ToAddress(initiatorAddress, multisigValue)
            .attach.MintingPolicy(validators.mintPolicy)
            .attach.SpendingValidator(validators.spendValidator)
            .addSignerKey(multisigDatum.signers[0])
            .addSignerKey(multisigDatum.signers[1])
            .addSignerKey(multisigDatum.signers[2])
            .completeProgram();

        return tx;
    });
