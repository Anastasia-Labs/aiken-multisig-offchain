import {
    Address,
    Data,
    fromText,
    LucidEvolution,
    mintingPolicyToId,
    RedeemerBuilder,
    toUnit,
    TransactionError,
    TxSignBuilder,
    UTxO,
} from "@lucid-evolution/lucid";
import { InitiateMultiSig, MultisigDatum } from "../core/contract.types.js";
import { Effect } from "effect";
import { MultiSigConfig } from "../core/types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { multiSigScript } from "../core/validators/constants.js";
import { generateUniqueAssetName } from "../core/utils/assets.js";

export const initiateMultiSigProgram = (
    lucid: LucidEvolution,
    config: MultiSigConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
    Effect.gen(function* (_) {
        const validators = getSignValidators(lucid, multiSigScript);
        const multisigPolicyId = mintingPolicyToId(validators.mintPolicy);

        const initiatorAddress: Address = yield* Effect.promise(() =>
            lucid.wallet().address()
        );

        const initiatorUTxOs = yield* Effect.promise(() =>
            lucid.utxosAt(initiatorAddress)
        );
        if (!initiatorUTxOs || !initiatorUTxOs.length) {
            console.error(
                "No UTxO found at user address: " + initiatorAddress,
            );
        }

        // Selecting a UTxO containing more than the total funds required
        // for the transaction and at least 2ADA to cover tx fees and min ADA
        const selectedUTxOs = initiatorUTxOs.filter((utxo: UTxO) =>
            utxo.assets.lovelace >= config.total_funds_qty
        );

        const initiateMultiSigRedeemer: RedeemerBuilder = {
            kind: "selected",
            makeRedeemer: (inputIndices: bigint[]) => {
                // Construct the redeemer using the input indices
                const multisigRedeemer: InitiateMultiSig = {
                    output_reference: {
                        txHash: selectedUTxOs[0].txHash,
                        outputIndex: BigInt(selectedUTxOs[0].outputIndex),
                    },
                    output_index: inputIndices[0],
                };

                const redeemerData = Data.to(
                    multisigRedeemer,
                    InitiateMultiSig,
                );

                return redeemerData;
            },
            // Specify the inputs relevant to the redeemer
            inputs: [selectedUTxOs[0]],
        };

        const sorted_signers = config.signers.map((s) => s.toLowerCase());
        sorted_signers.sort();

        const multisigDatum: MultisigDatum = {
            signers: sorted_signers, // list of pub key hashes
            threshold: config.threshold,
            fund_policy_id: config.fund_policy_id,
            fund_asset_name: config.fund_asset_name,
            spending_limit: config.spending_limit,
        };

        const outputDatum = Data.to<MultisigDatum>(
            multisigDatum,
            MultisigDatum,
        );
        const tokenName = generateUniqueAssetName(
            selectedUTxOs[0],
            fromText("multisig"),
        );
        const multisigNFT = toUnit(
            multisigPolicyId,
            tokenName,
        );

        const txBuilder = lucid
            .newTx()
            .collectFrom(selectedUTxOs)
            .mintAssets({ [multisigNFT]: 1n }, initiateMultiSigRedeemer)
            .pay.ToAddressWithData(validators.mintPolicyAddress, {
                kind: "inline",
                value: outputDatum,
            }, {
                [multisigNFT]: 1n,
                lovelace: config.total_funds_qty,
            })
            .attach.MintingPolicy(validators.mintPolicy);

        const txWithSigners = config.signers.reduce(
            (builder, signer) => builder.addSignerKey(signer),
            txBuilder,
        );
        const tx = yield* _(txWithSigners.completeProgram());

        // yield* tx.completeProgram()
        //     .addSignerKey(config.signers[0])
        //     .addSignerKey(config.signers[1])
        //     .addSignerKey(config.signers[2])
        //     .addSignerKey(config.signers[3])
        //     .completeProgram();

        return tx;
    });
