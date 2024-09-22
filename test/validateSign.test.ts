import {
    Emulator,
    generateEmulatorAccount,
    Lucid,
    LucidEvolution,
    SpendingValidator,
    validatorToAddress,
    SignConfig,
    ValidateSignConfig,
  } from "../src/index.js";
  import { Address,  getAddressDetails } from "@lucid-evolution/lucid";
  import { beforeEach, expect, test } from "vitest";
  import Script from "../src/validator/multisig_validator.json"
import { signEffect } from "../src/endpoints/sign.js";
import { Effect } from "effect";
import { validateSign, validateSignEffect } from "../src/endpoints/validatesign.js";
import { getValidatorUtxos } from "../src/endpoints/getValidatorUtxos.js";
import { getPublicKeyHash } from "../src/core/utils.js";

  type LucidContext = {
    lucid: LucidEvolution;
    users: any;
    emulator: Emulator;
  };
  
  // INITIALIZE EMULATOR + ACCOUNTS
  beforeEach<LucidContext>(async(context) => {
    context.users = {
      initiator: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_002)
      }),
      signer1: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_003)
      }),
      signer2: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_004)
      }),
      recipient: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_001)
      }),
    };
  
    context.emulator = new Emulator([
      context.users.recipient,
      context.users.initiator,
      context.users.signer1,
      context.users.signer2,
    ]);
  
    context.lucid = await Lucid(context.emulator, "Custom");
  });
  
  test<LucidContext>("Test 2 - Successful Sign Validation With Effect", async ({
    lucid ,
    users,
    emulator
  }) => {
    const initiatorAddress : Address = users.initiator.address;
    const signer1Address : Address = users.signer1.address;
    const signer2Address : Address = users.signer2.address;
    const recipientAddress : Address = users.recipient.address;
    
    // remove exclamatory
    const pkhInitiator = getAddressDetails(initiatorAddress).paymentCredential?.hash!;
    const pkhSigner1 = getAddressDetails(signer1Address).paymentCredential?.hash!;
    const pkhSigner2 = getAddressDetails(signer2Address).paymentCredential?.hash!;
    const pkhUsingFn = getPublicKeyHash(initiatorAddress);
    
    //console.log("Pub key hash using fucntion", pkhUsingFn);

    const multiSigVal : SpendingValidator = {
      type: "PlutusV2",
      script: Script.validators[0].compiledCode
    }
    const valAddress = validatorToAddress("Custom",multiSigVal);

      const signConfig: SignConfig = {
        signers: [pkhInitiator,pkhSigner1,pkhSigner2],
        threshold: 2n,
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
    
       const validatorUtxos = await getValidatorUtxos(lucid, signConfig);
      
      const validateSignConfig: ValidateSignConfig = {
        signOutRef : validatorUtxos[0].outRef,
        withdrawalAmount : 1_000_000_000n,
        recipientAddress : recipientAddress,
        signersList : [initiatorAddress,signer1Address,signer2Address],
        scripts: {
            multisig: Script.validators[0].compiledCode
      }
      };

      lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

      const validatesignTxUnSigned = await Effect.runPromise(validateSignEffect(lucid, validateSignConfig));
      emulator.awaitBlock(50);
        lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
            const partialSignInitiator = await validatesignTxUnSigned.partialSign.withWallet();
            lucid.selectWallet.fromSeed(users.signer1.seedPhrase);
            const partialSignSigner1 = await validatesignTxUnSigned.partialSign.withWallet();
            lucid.selectWallet.fromSeed(users.signer2.seedPhrase);
            const partialSignSigner2 = await validatesignTxUnSigned.partialSign.withWallet();
            const assembleTx = validatesignTxUnSigned.assemble([partialSignInitiator, partialSignSigner1,partialSignSigner2]);
            const completeSign = await assembleTx.complete();
            const txHash = await completeSign.submit();
            emulator.awaitBlock(100);
      console.log("utxos at receipient address", await lucid.utxosAt(recipientAddress));
      console.log("utxos at validator address", await lucid.utxosAt(valAddress));
   
  });
test<LucidContext>("Test 2 - Successful Sign Validation Without Effect", async ({
    lucid ,
    users,
    emulator
  }) => {
    const initiatorAddress : Address = users.initiator.address;
    const signer1Address : Address = users.signer1.address;
    const signer2Address : Address = users.signer2.address;
    const recipientAddress : Address = users.recipient.address;
    
    // remove exclamatory
    const pkhInitiator = getAddressDetails(initiatorAddress).paymentCredential?.hash!;
    const pkhSigner1 = getAddressDetails(signer1Address).paymentCredential?.hash!;
    const pkhSigner2 = getAddressDetails(signer2Address).paymentCredential?.hash!;
    const pkhUsingFn = getPublicKeyHash(initiatorAddress);
    
    //console.log("Pub key hash using fucntion", pkhUsingFn);

    const multiSigVal : SpendingValidator = {
      type: "PlutusV2",
      script: Script.validators[0].compiledCode
    }
    const valAddress = validatorToAddress("Custom",multiSigVal);

      const signConfig: SignConfig = {
        signers: [pkhInitiator,pkhSigner1,pkhSigner2],
        threshold: 2n,
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
    
       const validatorUtxos = await getValidatorUtxos(lucid, signConfig);
      
      const validateSignConfig: ValidateSignConfig = {
        signOutRef : validatorUtxos[0].outRef,
        withdrawalAmount : 1_000_000_000n,
        recipientAddress : recipientAddress,
        signersList : [initiatorAddress,signer1Address,signer2Address],
        scripts: {
            multisig: Script.validators[0].compiledCode
      }
      };

      lucid.selectWallet.fromSeed(users.initiator.seedPhrase);

      const validatesignTxUnSigned = await validateSign(lucid, validateSignConfig);
      emulator.awaitBlock(50);
  
      expect(validatesignTxUnSigned.type).toBe("ok");
       if (validatesignTxUnSigned.type == "ok") {
        lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
            const partialSignInitiator = await validatesignTxUnSigned.data.partialSign.withWallet();
            lucid.selectWallet.fromSeed(users.signer1.seedPhrase);
            const partialSignSigner1 = await validatesignTxUnSigned.data.partialSign.withWallet();
            lucid.selectWallet.fromSeed(users.signer2.seedPhrase);
            const partialSignSigner2 = await validatesignTxUnSigned.data.partialSign.withWallet();
            const assembleTx = validatesignTxUnSigned.data.assemble([partialSignInitiator, partialSignSigner1,partialSignSigner2]);
            const signTxHash = await assembleTx.complete();
            const txHash = await signTxHash.submit();
            emulator.awaitBlock(100);
      console.log("utxos at receipient address", await lucid.utxosAt(recipientAddress));
      console.log("utxos at validator address", await lucid.utxosAt(valAddress));
      }
   
  });