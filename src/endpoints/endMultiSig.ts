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
import { multiSigScript } from "../core/constants.js";

export const endMultiSig = (
    lucid: LucidEvolution,
    config: SignConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
    Effect.gen(function* () {
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
            spendingLimit: config.spending_limit,
            minimum_ada: config.minimum_ada,
        };

        const multisigValue = { lovelace: multisigUTxO.assets.lovelace };

        const mintingAssets: Assets = {
            [multisigNFT]: -1n,
        };

        const tx = yield* lucid
            .newTx()
            .collectFrom([multisigUTxO], removeMultiSigRedeemer)
            .mintAssets(mintingAssets, endMultiSigRedeemer)
            .pay.ToAddress(config.recipient_address, multisigValue)
            .attach.MintingPolicy(validators.mintPolicy)
            .attach.SpendingValidator(validators.spendValidator)
            .addSignerKey(multisigDatum.signers[0])
            .addSignerKey(multisigDatum.signers[1])
            .addSignerKey(multisigDatum.signers[2])
            .completeProgram({ localUPLCEval: false });

        return tx;
    });
