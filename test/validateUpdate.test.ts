import {
    Emulator,
    generateEmulatorAccount,
    Lucid,
    LucidEvolution,
    SpendingValidator,
    validatorToAddress,
    SignConfig,
    ValidateSignConfig,
    UpdateValidateConfig,
    Config,
  } from "../src/index.js";
  import { Address,  getAddressDetails } from "@lucid-evolution/lucid";
  import { beforeEach, expect, test } from "vitest";
  import Script from "../src/validator/multisig_validator.json"
import { signEffect } from "../src/endpoints/sign.js";
import { Effect } from "effect";
import { sign } from "crypto";
import { validateSign } from "../src/endpoints/validatesign.js";
import { getValidatorUtxos } from "../src/endpoints/getValidatorUtxos.js";
import { getPublicKeyHash } from "../src/core/utils.js";
import { getUtxos } from "../src/endpoints/getUtxos.js";
import { validateUpdate, validateUpdateEffect } from "../src/endpoints/validateUpdate.js";

  type LucidContext = {
    lucid: LucidEvolution;
    users: any;
    emulator: Emulator;
  };
  
  // INITIALIZE EMULATOR + ACCOUNTS
  beforeEach<LucidContext>(async(context) => {
    context.users = {
      initiator: await generateEmulatorAccount({
            lovelace: BigInt(100_000_000_001)
      }),
      signer1: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_003)
      }),
      signer2: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_004)
      }),
      signer3: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_001)
      })
      
    };
  
    context.emulator = new Emulator([
      context.users.initiator,
      context.users.signer1,
      context.users.signer2,
      context.users.signer3
      
    ]);
  
    context.lucid = await Lucid(context.emulator, "Custom");
  });
  
test<LucidContext>("Test 3 - Successful Update Validation Without Effect", async ({
    lucid ,
    users,
    emulator
  }) => {
    const initiatorAddress : Address = users.initiator.address;
    //const recipientAddress : Address = users.recipient.address;
    const signer1Address : Address = users.signer1.address;
    const signer2Address : Address = users.signer2.address;
    const signer3Address : Address = users.signer3.address;

    const pkhInitiator = getPublicKeyHash(initiatorAddress);
    const pkhSigner1 = getPublicKeyHash(signer1Address);
    const pkhSigner2 = getPublicKeyHash(signer2Address);
    const pkhSigner3 = getPublicKeyHash(signer3Address);

    const multiSigVal : SpendingValidator = {
      type: "PlutusV2",
      script: Script.validators[0].compiledCode
    }
    const valAddress = validatorToAddress("Custom",multiSigVal);

    const signConfig: SignConfig = {
        signers: [pkhInitiator.toString(),pkhSigner1.toString(),pkhSigner2.toString()],
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
      const firstTx = await Effect.runPromise(signEffect(lucid, signConfig));
      emulator.awaitBlock(50);
      const signTxSigned = await firstTx.sign.withWallet().complete();
      const signTxHash = await signTxSigned.submit();
      emulator.awaitBlock(50);
       
      
    const utxoConfig : Config = {
        scripts : {
            multisig: Script.validators[0].compiledCode// change to scripts
          }
    }

    const validatorUtxos = await getUtxos(lucid, utxoConfig);
    console.log("Validator Utxos", validatorUtxos);

      const updateValidatorConfig: UpdateValidateConfig = {
        signOutRef: validatorUtxos[0].outRef,
        new_signers: [pkhInitiator.toString(),pkhSigner1.toString(),pkhSigner3.toString()],
        new_threshold: 2n,
        funds: {
            policyId: "",
            assetName: "",
       },
        new_spendingLimit: 15_000_000n,
        scripts: {
            multisig: Script.validators[0].compiledCode
        },
    }   

      lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
      console.log("Validator Utxos before update",await lucid.utxosAt(valAddress));
      const signTxUnSigned = await validateUpdate(lucid, updateValidatorConfig);

      expect(signTxUnSigned.type).toBe("ok");
       if (signTxUnSigned.type == "ok") {
    
            const partialSignInitiator = await signTxUnSigned.data.partialSign.withWallet();
            lucid.selectWallet.fromSeed(users.signer1.seedPhrase);
            const partialSignSigner1 = await signTxUnSigned.data.partialSign.withWallet();
            lucid.selectWallet.fromSeed(users.signer2.seedPhrase);
            const partialSignSigner2 = await signTxUnSigned.data.partialSign.withWallet();
            const assembleTx = signTxUnSigned.data.assemble([partialSignInitiator, partialSignSigner1,partialSignSigner2]);
            const signTxHash = await assembleTx.complete();
            const txHash = await signTxHash.submit();
           
      emulator.awaitBlock(50);
       }
       console.log("Validator Utxos after update",await lucid.utxosAt(valAddress));     
   
  });

  test<LucidContext>("Test 3 - Successful Update Validation With Effect", async ({
    lucid ,
    users,
    emulator
  }) => {
    const initiatorAddress : Address = users.initiator.address;
    //const recipientAddress : Address = users.recipient.address;
    const signer1Address : Address = users.signer1.address;
    const signer2Address : Address = users.signer2.address;
    const signer3Address : Address = users.signer3.address;

    const pkhInitiator = getPublicKeyHash(initiatorAddress);
    const pkhSigner1 = getPublicKeyHash(signer1Address);
    const pkhSigner2 = getPublicKeyHash(signer2Address);
    const pkhSigner3 = getPublicKeyHash(signer3Address);

    const multiSigVal : SpendingValidator = {
      type: "PlutusV2",
      script: Script.validators[0].compiledCode
    }
    const valAddress = validatorToAddress("Custom",multiSigVal);

    const signConfig: SignConfig = {
        signers: [pkhInitiator.toString(),pkhSigner1.toString(),pkhSigner2.toString()],
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
      const firstTx = await Effect.runPromise(signEffect(lucid, signConfig));
      emulator.awaitBlock(50);
      const signTxSigned = await firstTx.sign.withWallet().complete();
      const signTxHash = await signTxSigned.submit();
      emulator.awaitBlock(50);
       
      
    const utxoConfig : Config = {
        scripts : {
            multisig: Script.validators[0].compiledCode// change to scripts
          }
    }

    const validatorUtxos = await getUtxos(lucid, utxoConfig);
    console.log("Validator Utxos", validatorUtxos);

      const updateValidatorConfig: UpdateValidateConfig = {
        signOutRef: validatorUtxos[0].outRef,
        new_signers: [pkhInitiator.toString(),pkhSigner1.toString(),pkhSigner3.toString()],
        new_threshold: 2n,
        funds: {
            policyId: "",
            assetName: "",
       },
        new_spendingLimit: 15_000_000n,
        scripts: {
            multisig: Script.validators[0].compiledCode
        },
    }   

      lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
      console.log("Validator Utxos before update",await lucid.utxosAt(valAddress));
      const signTxUnSigned = await Effect.runPromise(validateUpdateEffect(lucid, updateValidatorConfig));
      const partialSignInitiator = await signTxUnSigned.partialSign.withWallet();
      lucid.selectWallet.fromSeed(users.signer1.seedPhrase);
      const partialSignSigner1 = await signTxUnSigned.partialSign.withWallet();
      lucid.selectWallet.fromSeed(users.signer2.seedPhrase);
      const partialSignSigner2 = await signTxUnSigned.partialSign.withWallet();
      const assembleTx = signTxUnSigned.assemble([partialSignInitiator, partialSignSigner1,partialSignSigner2]);
      const completeSign = await assembleTx.complete();
      const txHash = await completeSign.submit();
           
      emulator.awaitBlock(50);

      console.log("Validator Utxos after update",await lucid.utxosAt(valAddress));     
   
  });