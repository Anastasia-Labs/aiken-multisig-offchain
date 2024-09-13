import {
  Data,
  TxSignBuilder,
  Address,
  LucidEvolution,
  selectUTxOs,
  fromText,
} from "@lucid-evolution/lucid";

import { Result, SignConfig } from "../core/types.js";

import { MultisigDatum } from "../core/contracttypes.js";
import { getSignValidators } from "../core/utils/misc.js";

// creates a transaction which transfers ADA to the script
export const sign = async (
  lucid: LucidEvolution,
  config: SignConfig // it doesnt need to be all the fields in datum may be outref 
): Promise<Result<TxSignBuilder>> => {
  const validators = getSignValidators(lucid, config.scripts);

  const multisigDatum: MultisigDatum = {

    signers: config.signers, // list of pub key hashes
    threshold: config.threshold.valueOf(),
    funds: config.funds,
    spendingLimit:config.spendingLimit.valueOf(),
    
  };

  const datum = Data.to<MultisigDatum>(multisigDatum, MultisigDatum);

  const walletUTxOs = await lucid.wallet().getUtxos();

  const feeUTxOs = selectUTxOs(walletUTxOs, { lovelace: BigInt(2_000_000) });

  try {
    const tx = await lucid
      .newTx()
      .collectFrom(feeUTxOs)
      .pay.ToContract(
        validators.multisigValAddress,
        { kind: "inline", value: datum },
        //config.offer
      )
      .complete();

    return { type: "ok", data: tx };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };
    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
    
  }
};


  //endpoints
  // 1. sign
  //       =>construct a config (SignConfig) 
        

  // 2. update threshold
// Function to create a multisig UTXO
// Function to spend from the multisig UTXO
// Function to update the multisig UTXO

//1. any wallet address  
//2. compiled validator in .json file 
//3. validator address

// no need to create wallets for SDK, it is either created and stored in file
//