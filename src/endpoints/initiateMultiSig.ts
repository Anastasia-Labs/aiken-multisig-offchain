import {
    Address,
    Data,
    LucidEvolution,
    mintingPolicyToId,
    RedeemerBuilder,
    selectUTxOs,
    toUnit,
    TransactionError,
    TxSignBuilder,
} from "@lucid-evolution/lucid";
import { InitiateMultiSig, MultisigDatum } from "../core/contract.types.js";
import { Effect } from "effect";
import { MultiSigConfig } from "../core/types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { generateUniqueAssetName } from "../core/utils/assets.js";

export const initiateMultiSig = (
    lucid: LucidEvolution,
    config: MultiSigConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
    Effect.gen(function* () {
        const initiatorAddress: Address = yield* Effect.promise(() =>
            lucid.wallet().address()
        );

        const validators = getSignValidators(lucid, config.scripts);
        const multisigPolicyId = mintingPolicyToId(validators.mintPolicy);

        const initiatorUTxOs = yield* Effect.promise(() =>
            lucid.utxosAt(initiatorAddress)
        );
        if (!initiatorUTxOs || !initiatorUTxOs.length) {
            console.error(
                "No UTxO found at user address: " + initiatorAddress,
            );
        }

        // Selecting a utxo containing atleast 2 ADA to cover tx fees and min ADA
        // Note: To avoid tx balancing errors, the utxo should only contain lovelaces
        // Can make into optional function
        const selectedUTxOs = selectUTxOs(initiatorUTxOs, {
            ["lovelace"]: 2000000n,
        });

        const tokenName = generateUniqueAssetName(selectedUTxOs[0], "");

        const initiateMultiSigRedeemer: RedeemerBuilder = {
            kind: "selected",
            makeRedeemer: (inputIndices: bigint[]) => {
                // Construct the redeemer using the input indices
                const initiatorIndex = inputIndices[0];

                const multisigRedeemer: InitiateMultiSig = {
                    output_reference: {
                        txHash: {
                            hash: initiatorUTxOs[0].txHash,
                        },
                        outputIndex: BigInt(initiatorUTxOs[0].outputIndex),
                    },
                    input_index: initiatorIndex,
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

        const multisigDatum: MultisigDatum = {
            signers: config.signers, // list of pub key hashes
            threshold: config.threshold,
            funds: config.funds,
            spendingLimit: config.spendingLimit,
        };

        const outputDatum = Data.to<MultisigDatum>(
            multisigDatum,
            MultisigDatum,
        );

        const multisigNFT = toUnit(
            multisigPolicyId,
            tokenName,
        );

        const tx = yield* lucid
            .newTx()
            .collectFrom(initiatorUTxOs)
            .mintAssets({ [multisigNFT]: 1n }, initiateMultiSigRedeemer)
            .pay.ToAddressWithData(validators.spendValAddress, {
                kind: "inline",
                value: outputDatum,
            }, {
                lovelace: config.totalFundsQty,
                [multisigNFT]: 1n,
            })
            .attach.MintingPolicy(validators.mintPolicy)
            .completeProgram();

        return tx;
    });
