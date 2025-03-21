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
import { ValidateSignConfig } from "../core/types.js";
import { Effect } from "effect";
import { MultisigDatum, SignMultiSig } from "../core/contract.types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { tokenNameFromUTxO } from "../core/utils/assets.js";
import { getMultisigDatum } from "../core/utils.js";
import {
  multiSigScript,
  multisigValidator,
} from "../core/validators/constants.js";

export const validateSignProgram = (
export const validateSignProgram = (
  lucid: LucidEvolution,
  config: ValidateSignConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
  Effect.gen(function* () {
    const validators = getSignValidators(lucid, multiSigScript);
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

    const signRedeemer: RedeemerBuilder = {
      kind: "selected",
      makeRedeemer: (inputIndices: bigint[]) => {
        const multisigRedeemer: SignMultiSig = {
          input_index: inputIndices[0],
          output_index: 0n,
        };

        return Data.to(
          multisigRedeemer,
          SignMultiSig,
        );
      },
      // Specify the inputs relevant to the redeemer
      inputs: [multisigUTxO],
    };

    const parsedDatum = yield* Effect.promise(() =>
      getMultisigDatum([multisigUTxO])
    );

    const multisigDatum: MultisigDatum = {
      signers: parsedDatum[0].signers, // list of pub key hashes
      threshold: parsedDatum[0].threshold,
      fund_policy_id: parsedDatum[0].fund_policy_id,
      fund_asset_name: parsedDatum[0].fund_asset_name,
      spending_limit: parsedDatum[0].spending_limit,
    };
    const outputDatum = Data.to<MultisigDatum>(multisigDatum, MultisigDatum);
    const multisigValue = multisigUTxO.assets.lovelace;
    const contractBalance = multisigValue - config.withdrawal_amount;
    const contractBalance = multisigValue - config.withdrawal_amount;

    const tx = yield* lucid
      .newTx()
      .collectFrom([multisigUTxO], signRedeemer)
      .pay.ToAddressWithData(
        validators.spendValAddress,
        { kind: "inline", value: outputDatum },
        {
          lovelace: contractBalance,
          [multisigNFT]: 1n,
        },
      )
      .pay.ToAddress(config.recipient_address, {
        lovelace: config.withdrawal_amount,
      .pay.ToAddress(config.recipient_address, {
        lovelace: config.withdrawal_amount,
      })
      .attach.SpendingValidator(validators.spendValidator)
      .addSignerKey(config.signers_list[0])
      .addSignerKey(config.signers_list[1])
      .addSignerKey(config.signers_list[2])
      .completeProgram();
    return tx;
  });
