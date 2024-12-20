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
import { MultisigDatum } from "../core/contract.types.js";
import { getSignValidators } from "../core/utils/misc.js";
import { tokenNameFromUTxO } from "../core/utils/assets.js";
import { getMultisigDatum } from "../core/utils.js";

export const validateSign = (
  lucid: LucidEvolution,
  config: ValidateSignConfig,
): Effect.Effect<TxSignBuilder, TransactionError, never> =>
  Effect.gen(function* () {
    const validators = getSignValidators(lucid, config.scripts);
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
        // Construct the redeemer using the input indices
        const multisigIndex = inputIndices[0];
        const multisigOutIndex = 0n;

        return Data.to(
          new Constr(1, [
            new Constr(0, [
              BigInt(multisigIndex),
              BigInt(multisigOutIndex),
            ]),
          ]),
        );
      },
      // Specify the inputs relevant to the redeemer
      inputs: [multisigUTxO, multisigUTxOs[0]],
    };

    const parsedDatum = yield* Effect.promise(() =>
      getMultisigDatum([multisigUTxO])
    );

    const multisigDatum: MultisigDatum = {
      signers: parsedDatum[0].signers, // list of pub key hashes
      threshold: parsedDatum[0].threshold,
      funds: parsedDatum[0].funds,
      spendingLimit: parsedDatum[0].spendingLimit,
      minimum_ada: parsedDatum[0].minimum_ada,
    };
    const outputDatum = Data.to<MultisigDatum>(multisigDatum, MultisigDatum);
    const multisigValue = multisigUTxO.assets.lovelace;
    const contractBalance = multisigValue - config.withdrawalAmount;

    const tx = yield* lucid
      .newTx()
      .collectFrom([multisigUTxO], signRedeemer)
      .pay.ToContract(
        validators.spendValAddress,
        { kind: "inline", value: outputDatum },
        {
          lovelace: contractBalance,
          [multisigNFT]: 1n,
        },
      )
      .pay.ToAddress(config.recipientAddress, {
        lovelace: config.withdrawalAmount,
      })
      .attach.SpendingValidator(validators.spendValidator)
      .addSignerKey(config.signersList[0])
      .addSignerKey(config.signersList[1])
      .addSignerKey(config.signersList[2])
      .completeProgram({ localUPLCEval: false });
    return tx;
  });
