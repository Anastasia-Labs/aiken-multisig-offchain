import {
    Emulator,
    generateEmulatorAccount,
    Lucid,
    toUnit,
    WithdrawalValidator,
    LucidEvolution,
    validatorToRewardAddress,
    SpendingValidator,
    MultisigDatum,
    validatorToAddress,
    SignConfig,
  } from "../src/index.js";
  import { Address, Constr, Data, addressFromHexOrBech32, getAddressDetails } from "@lucid-evolution/lucid";
  import { beforeEach, expect, test } from "vitest";
  import Script from "../src/validator/multisig_validator.json"
import { sign, signEffect } from "../src/endpoints/sign.js";
import { fromAddress } from "../src/core/utils.js";
import { Effect } from "effect";
import { MultisigRedeemer } from "../src/index.js";

  type LucidContext = {
    lucid: LucidEvolution;
    users: any;
    emulator: Emulator;
  };
  
  // INITIALIZE EMULATOR + ACCOUNTS
  beforeEach<LucidContext>(async(context) => {
    context.users = {
      initiator: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000)
      }),
      signer1: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000),
      }),
      signer2: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000),
      }),
    };
  
    context.emulator = new Emulator([
      context.users.initiator,
      context.users.signer1,
      context.users.signer2,
    ]);
  
    context.lucid = await Lucid(context.emulator, "Custom");
  });
  
  
   async function multiSigValidatorAddress(lucid: LucidEvolution): Promise<void> {
     const multiSigVal : SpendingValidator = {
       type: "PlutusV2",
       script: Script.validators[0].compiledCode
     }
     const valAddress = validatorToAddress("Custom",multiSigVal);
   }
  
  // test<LucidContext>("Test 1 - Successful Sign", async ({
  //   lucid ,
  //   users,
  //   emulator
  // }) => {

  //   const initiatorAddress : Address = users.initiator.address;
  //   const signer1Address : Address = users.signer1.address;
  //   const signer2Address : Address = users.signer2.address;
    
  //   const pkhInitiator = getAddressDetails(initiatorAddress).paymentCredential?.hash!;
  //   const pkhSigner1 = getAddressDetails(signer1Address).paymentCredential?.hash!;
  //   const pkhSigner2 = getAddressDetails(signer2Address).paymentCredential?.hash!;

  //   const multiSigVal : SpendingValidator = {
  //     type: "PlutusV2",
  //     script: Script.validators[0].compiledCode
  //   }
  //   const valAddress = validatorToAddress("Custom",multiSigVal);

  //     const signConfig: SignConfig = {
  //       signers: [pkhInitiator,pkhSigner1,pkhSigner2],
  //       threshold: 3n,
  //       funds:  {
  //                policyId: "",
  //                assetName: "",
  //           },
  //       spendingLimit: 10_000_000n,
  //         scripts: {
  //             multisig: Script.validators[0].compiledCode
  //       }
  //     };
  //     lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

  //     const signTxUnSigned = await sign(lucid, signConfig);
  //     emulator.awaitBlock(50);
  //     expect(signTxUnSigned.type).toBe("ok");
  //     if (signTxUnSigned.type == "ok") {
  //       const signTxSigned = await signTxUnSigned.data.sign.withWallet().complete();
  //       const signTxHash = await signTxSigned.submit();
  //     }
    
  //     emulator.awaitBlock(100);
  //     console.log("utxos at initiator address", await lucid.utxosAt(initiatorAddress));
  //     console.log("utxos at validator address", await lucid.utxosAt(valAddress));
  //   //console.log("utxos at initiator address", lucid.utxosAt(valAddress));
  //   // console.log("Sign tx unsigned", signTxUnSigned);
  //   // const offerScripts = {
  //   //   spending: Script.validators[1].compiledCode,
  //   //   //staking: stakingValidator.cborHex
  //   // };
  //   //lucid.selectWallet.fromSeed(users.creator1.seedPhrase);
    
  //   // Make Offer
  //   // const signConfig: SignConfig = {
        
  //   //     signers: "",
  //   //     threshold: 3n,
  //   //     funds: {
  //   //         policyId: "",
  //   //         assetName: "",
  //   //     },
  //   //     spendingLimit: 10_000_000n,
  //   //     scripts : {
  //   //         multisig: offerScripts.spending 
  //   //       }
  //   // };
  
  //   // lucid.selectWallet.fromSeed(users.creator1.seedPhrase);
  
  //   // const multisigUnSigned = await sign(lucid, signConfig);
  
  //   // expect(multisigUnSigned.type).toBe("ok");
  //   // if (multisigUnSigned.type == "ok") {
  //   //   const multisigSigned = await multisigUnSigned.data.sign.withWallet().complete();
  //   //   const multisigHash = await multisigSigned.submit();
  //   // }
  
  //   // emulator.awaitBlock(100);
  // });
  test<LucidContext>("Test 1 - Successful Sign With Effect", async ({
    lucid ,
    users,
    emulator
  }) => {

    const initiatorAddress : Address = users.initiator.address;
    const signer1Address : Address = users.signer1.address;
    const signer2Address : Address = users.signer2.address;
    
    const pkhInitiator = getAddressDetails(initiatorAddress).paymentCredential?.hash!;
    const pkhSigner1 = getAddressDetails(signer1Address).paymentCredential?.hash!;
    const pkhSigner2 = getAddressDetails(signer2Address).paymentCredential?.hash!;

    const multiSigVal : SpendingValidator = {
      type: "PlutusV2",
      script: Script.validators[0].compiledCode
    }
    const valAddress = validatorToAddress("Custom",multiSigVal);

      const signConfig: SignConfig = {
        signers: [pkhInitiator,pkhSigner1,pkhSigner2],
        threshold: 3n,
        funds:  {
                 policyId: "",
                 assetName: "",
            },
        spendingLimit: 10_000_000n,
          scripts: {
              multisig: Script.validators[0].compiledCode
        }
      };
      lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

      const signTxUnSigned = await Effect.runPromise(signEffect(lucid, signConfig));
      emulator.awaitBlock(50);
      const signTxSigned = await signTxUnSigned.sign.withWallet().complete();
      const signTxHash = await signTxSigned.submit();

      
      emulator.awaitBlock(100);
      console.log("utxos at initiator address", await lucid.utxosAt(initiatorAddress));
      console.log("utxos at validator address", await lucid.utxosAt(valAddress));
     
    });
  
    // wrap the test function with Effect and use Effect.runpromise(function)
