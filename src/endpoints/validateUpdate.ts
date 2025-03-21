import {
  Constr,
  Data,
  LucidEvolution,
  mintingPolicyToId,
  RedeemerBuilder,
  toUnit,
  TransactionError,
  TxSignBuilder,
} from "@lucid-evolution/lucid";
import { UpdateValidateConfig } from "../core/types.js";
import { Effect } from "effect";
import { MultisigDatum } from "../core/contract.types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { tokenNameFromUTxO } from "../core/utils/assets.js";
import { multiSigScript } from "../core/validators/constants.js";

export const validateUpdateProgram = (
  lucid: LucidEvolution,
  config: UpdateValidateConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
  Effect.gen(function* () {
    const validators = getSignValidators(lucid, multiSigScript);

    const multisigPolicyId = mintingPolicyToId(validators.mintPolicy);
    const multisigAddress = validators.spendValAddress;

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

    const updateRedeemer: RedeemerBuilder = {
      kind: "selected",
      makeRedeemer: (inputIndices: bigint[]) => {
        // Construct the redeemer using the input indices

        return Data.to(
          new Constr(1, [BigInt(inputIndices[0]), 0n]),
        );
      },
      // Specify the inputs relevant to the redeemer
      inputs: [multisigUTxO],
    };

    // const parsedDatum = yield* Effect.promise(() =>
    //   getMultisigDatum([multisigUTxO])
    // );

    // const inputDatum: MultisigDatum = {
    //   signers: parsedDatum[0].signers, // list of pub key hashes
    //   threshold: parsedDatum[0].threshold,
    //   fund_policy_id: parsedDatum[0].fund_policy_id,
    //   fund_asset_name: parsedDatum[0].fund_asset_name,
    //   spending_limit: parsedDatum[0].spending_limit,
    // };

    const new_sorted_signers = config.new_signers.map((s) => s.toLowerCase());
    new_sorted_signers.sort();

    const outputDatum: MultisigDatum = {
      signers: new_sorted_signers, // list of pub key hashes
      threshold: config.new_threshold,
      fund_policy_id: config.fund_policy_id,
      fund_asset_name: config.fund_asset_name,
      spending_limit: config.new_spending_limit,
    };
    const outputDatumData = Data.to<MultisigDatum>(outputDatum, MultisigDatum);

    const totalInputLovelace = BigInt(multisigUTxO.assets.lovelace);

    const tx = yield* lucid
      .newTx()
      .collectFrom([multisigUTxO], updateRedeemer)
      .pay.ToContract(
        validators.spendValAddress,
        { kind: "inline", value: outputDatumData },
        {
          lovelace: totalInputLovelace,
          [multisigNFT]: 1n,
        },
      )
      .attach.SpendingValidator(validators.spendValidator)
      .addSignerKey(new_sorted_signers[0])
      .addSignerKey(new_sorted_signers[1])
      .addSignerKey(new_sorted_signers[2])
      .addSignerKey(new_sorted_signers[3])
      .completeProgram();

    return tx;
  });
