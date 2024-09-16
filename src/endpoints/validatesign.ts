import {
    Data,
    TxSignBuilder,
    LucidEvolution,

  } from "@lucid-evolution/lucid";
  
  import { Result,ValidateSignConfig } from "../core/types.js";
  
  import { MultisigRedeemer } from "../core/contracttypes.js";
  import { getSignValidators } from "../core/utils/misc.js";

  
// create a transaction that spends from the script address , respecting the spending limit
// so this should have datum and redeemer
// the config should have outref
  export const validateSign = async (
    lucid: LucidEvolution,
    config: ValidateSignConfig
  ): Promise<Result<TxSignBuilder>> => {

    const validators = getSignValidators(lucid, config.scripts);
    //const trailutxos = await lucid.utxosAt(validators.multisigValAddress)
    const scriptUtxo = (await lucid.utxosByOutRef([config.signOutRef]))[0];

    if (!scriptUtxo)
      return { type: "error", error: new Error("No UTxO with that TxOutRef") };
  
    if (!scriptUtxo.datum)
      return { type: "error", error: new Error("Missing Datum") };

    const multisigRedeemer = Data.to<MultisigRedeemer>("Sign",MultisigRedeemer);
    const withdrawalAmount = config.withdrawalAmount;
    console.log("Redeemer",multisigRedeemer);
    console.log("Script Utxo",scriptUtxo);
    const recipientAddress = config.recipientAddress;
    console.log("Initiator pkh", config.signersList[0]);
    console.log("signer1 pkh", config.signersList[1]);
    console.log("signer2 pkh", config.signersList[2]); 
    try {
      const tx = await lucid
              .newTx()
              .collectFrom([scriptUtxo], multisigRedeemer)
              .pay.ToAddress(recipientAddress, { lovelace: withdrawalAmount })
              .pay.ToContract(
              validators.multisigValAddress,
              { kind: "inline", value: scriptUtxo.datum })//,{lovelace: scriptUtxo.assets.lovelace - withdrawalAmount}
        //config.offer
              .attach.SpendingValidator(validators.multisigVal)
              //.addSigner(config.signersList[0])
              //.addSigner(config.signersList[1])
              //.addSigner(config.signersList[2])
              .addSignerKey(config.signersList[0])
              .addSignerKey(config.signersList[1])
              .addSignerKey(config.signersList[2])
              .complete();
      // const tx = await lucid
      //         .newTx()
      //         .collectFrom([scriptUtxo])
      //         .pay.ToAddress(recipientAddress, { lovelace: withdrawalAmount })
      //         .pay.ToContract(
      //         validators.multisigValAddress,
      //         { kind: "inline", value: scriptUtxo.datum })//,{lovelace: scriptUtxo.assets.lovelace - withdrawalAmount}
      //   //config.offer
      //         .attach.SpendingValidator(validators.multisigVal)
      //         .complete();
              
  
      return { type: "ok", data: tx };  
    } catch (error) {
      if (error instanceof Error) return { type: "error", error: error };
      return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
    }
    
  }
    

//     const correctUTxO = "PublicKeyCredential" in datum.value.creator.paymentCredential 
//       && (datum.value.creator.paymentCredential.PublicKeyCredential[0] == ownHash)
//     if (correctUTxO) 
//       return { type: "error", error: new Error("Signer not authorized to spend UTxO.") };
  
//     const toBuy = toAssets(datum.value.toBuy);
//     // add min ADA deposit cost which is refunded later
//     toBuy["lovelace"] = (toBuy["lovelace"] || 0n) + 2_000_000n;
    
//     const walletUTxOs = await lucid.wallet().getUtxos();
  
//     // initialize with clone of toBuy
//     const requiredAssets: Assets = { ...toBuy } 
//     // adding 4 ADA to cover minADA costs (for assets returned to buyer) and tx fees 
//     // as we will do the coin selection. 
//     // Using more than sufficient ADA to safeguard against large minADA costs
//     requiredAssets["lovelace"] = (requiredAssets["lovelace"] || 0n) + 4_000_000n;
  
//     const selectedUtxos = selectUtxos(walletUTxOs, requiredAssets);
//     if(selectedUtxos.type == "error")
//       return selectedUtxos
//     const inputIndices = getInputUtxoIndices([offerUTxO], selectedUtxos.data);
  
//     const offerOutputIndex = 0n;
    
    
    
  
//     // balance the native assets from wallet inputs
//     const walletAssets = sumUtxoAssets(selectedUtxos.data);
//     delete walletAssets["lovelace"]; // we would want lucid to balance ADA for the tx
//     const balanceAssets = remove(walletAssets, toBuy);
  
//     try {
//       const tx = await lucid.newTx()
//         .collectFrom([offerUTxO], PExecuteOfferRedeemer)
//         .collectFrom(selectedUtxos.data)                  // spend selected wallet utxos as inputs
//         .pay.ToAddress(toAddress(datum.value.creator, network), toBuy)
//         .pay.ToAddress(ownAddress, addAssets(offerUTxO.assets, balanceAssets))                 
//         .withdraw(validators.rewardAddress, 0n, PGlobalRedeemer)
//         .pay.ToAddress(
//           credentialToAddress(
//             network,
//             keyHashToCredential(PROTOCOL_PAYMENT_KEY),
//             keyHashToCredential(PROTOCOL_STAKE_KEY)
//           ),
//           { ["lovelace"]: 4_000_000n } // protocol fees of 4 ADA (creator and buyer pay 2 ADA each)
//         )
//         .attach.SpendingValidator(validators.directOfferVal)
//         .attach.WithdrawalValidator(validators.stakingVal)
//         .complete({coinSelection: false});
  
//       return { type: "ok", data: tx };  
//     } catch (error) {
//       if (error instanceof Error) return { type: "error", error: error };
//       return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
//     }
//   }

// Sign                                                 validatesign
// initiator ---------> Script address               -------------->  Spending from the script 
//                                                                     checks spending resourceLimits, thres
//                                                                     redeemer == sign
//             ada   1. pay to the contract 
//                         with datum
// address