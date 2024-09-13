import {
    Data,
    TxSignBuilder,
    Address,
    LucidEvolution,
    selectUTxOs,
    fromText,
    addressFromHexOrBech32,
    scriptFromCMLNative,
    paymentCredentialOf,
  } from "@lucid-evolution/lucid";
  
  import { Result, SignConfig, ValidateSignConfig } from "../core/types.js";
  
  import { MultisigDatum } from "../core/contracttypes.js";
  import { getSignValidators } from "../core/utils/misc.js";
import { resourceLimits } from "worker_threads";
import { parseSafeDatum } from "../core/utils.js";
  
// create a transaction that spends from the script address , respecting the spending limit
// so this should have datum and redeemer
// the config should have outref
  export const validateSign = async (
    lucid: LucidEvolution,
    config: ValidateSignConfig
  ): Promise<Result<TxSignBuilder>> => {
    const validators = getSignValidators(lucid, config.scripts);
   
    const signUTxO = (await lucid.utxosByOutRef([config.signOutRef]))[0];

    if (!signUTxO)
      return { type: "error", error: new Error("No UTxO with that TxOutRef") };
  
    if (!signUTxO.datum)
      return { type: "error", error: new Error("Missing Datum") };
  
    const datum = parseSafeDatum(signUTxO.datum, MultisigDatum);
    if (datum.type == "left")
      return { type: "error", error: new Error(datum.value) };
  
    const ownAddress = await lucid.wallet().address();
    const ownHash = paymentCredentialOf(ownAddress).hash;
  
    const correctUTxO = "PublicKeyCredential" in datum.value.creator.paymentCredential 
      && (datum.value.creator.paymentCredential.PublicKeyCredential[0] == ownHash)
    if (correctUTxO) 
      return { type: "error", error: new Error("Signer not authorized to spend UTxO.") };
  
    const toBuy = toAssets(datum.value.toBuy);
    // add min ADA deposit cost which is refunded later
    toBuy["lovelace"] = (toBuy["lovelace"] || 0n) + 2_000_000n;
    
    const walletUTxOs = await lucid.wallet().getUtxos();
  
    // initialize with clone of toBuy
    const requiredAssets: Assets = { ...toBuy } 
    // adding 4 ADA to cover minADA costs (for assets returned to buyer) and tx fees 
    // as we will do the coin selection. 
    // Using more than sufficient ADA to safeguard against large minADA costs
    requiredAssets["lovelace"] = (requiredAssets["lovelace"] || 0n) + 4_000_000n;
  
    const selectedUtxos = selectUtxos(walletUTxOs, requiredAssets);
    if(selectedUtxos.type == "error")
      return selectedUtxos
    const inputIndices = getInputUtxoIndices([offerUTxO], selectedUtxos.data);
  
    const offerOutputIndex = 0n;
    
    const PExecuteOfferRedeemer = Data.to(new Constr(0, []));
    const PGlobalRedeemer = Data.to(new Constr(0, [inputIndices, [offerOutputIndex]]));
  
    // balance the native assets from wallet inputs
    const walletAssets = sumUtxoAssets(selectedUtxos.data);
    delete walletAssets["lovelace"]; // we would want lucid to balance ADA for the tx
    const balanceAssets = remove(walletAssets, toBuy);
  
    try {
      const tx = await lucid.newTx()
        .collectFrom([offerUTxO], PExecuteOfferRedeemer)
        .collectFrom(selectedUtxos.data)                  // spend selected wallet utxos as inputs
        .pay.ToAddress(toAddress(datum.value.creator, network), toBuy)
        .pay.ToAddress(ownAddress, addAssets(offerUTxO.assets, balanceAssets))                 
        .withdraw(validators.rewardAddress, 0n, PGlobalRedeemer)
        .pay.ToAddress(
          credentialToAddress(
            network,
            keyHashToCredential(PROTOCOL_PAYMENT_KEY),
            keyHashToCredential(PROTOCOL_STAKE_KEY)
          ),
          { ["lovelace"]: 4_000_000n } // protocol fees of 4 ADA (creator and buyer pay 2 ADA each)
        )
        .attach.SpendingValidator(validators.directOfferVal)
        .attach.WithdrawalValidator(validators.stakingVal)
        .complete({coinSelection: false});
  
      return { type: "ok", data: tx };  
    } catch (error) {
      if (error instanceof Error) return { type: "error", error: error };
      return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
    }
  }

Sign                                                 validatesign
initiator ---------> Script address               -------------->  Spending from the script 
                                                                    checks spending resourceLimits, thres
                                                                    redeemer == sign
            ada   1. pay to the contract 
                        with datum
address