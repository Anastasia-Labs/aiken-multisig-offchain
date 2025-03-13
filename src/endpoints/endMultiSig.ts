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
import { MultisigDatum } from "../core/contract.types.js";
import { Effect } from "effect";
import { EndSigConfig } from "../core/types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { tokenNameFromUTxO } from "../core/utils/assets.js";
import { multiSigScript } from "../core/validators/constants.js";

export const endMultiSig = (
    lucid: LucidEvolution,
    config: EndSigConfig,
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

        const multisigDatum: MultisigDatum = {
            signers: config.signers, // list of pub key hashes
            threshold: config.threshold,
            fund_policy_id: config.fund_policy_id,
            fund_asset_name: config.fund_asset_name,
            spending_limit: config.spending_limit,
        };
        // console.log("signers: ", multisigDatum.signers);

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
            .completeProgram();

        return tx;
    });
