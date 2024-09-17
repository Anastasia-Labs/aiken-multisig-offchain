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
import { sign } from "crypto";
import { validateSign } from "../src/endpoints/validatesign.js";
import { getValidatorUtxos } from "../src/endpoints/getValidatorUtxos.js";

  type LucidContext = {
    lucid: LucidEvolution;
    users: any;
    emulator: Emulator;
  };
  
  // INITIALIZE EMULATOR + ACCOUNTS
  beforeEach<LucidContext>(async(context) => {
    context.users = {
      recipient: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_000)
      }),
      initiator: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_000)
      }),
      signer1: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_000)
      }),
      signer2: await generateEmulatorAccount({
        lovelace: BigInt(100_000_000_000)
      })
    };
  
    context.emulator = new Emulator([
      context.users.recipient,
      context.users.initiator,
      context.users.signer1,
      context.users.signer2,
    ]);
  
    context.lucid = await Lucid(context.emulator, "Custom");
  });
  
test<LucidContext>("Test 2 - Successful Sign Validation Without Effect", async ({
    lucid ,
    users,
    emulator
  }) => {
    const initiatorAddress : Address = users.initiator.address;
    const recipientAddress : Address = users.recipient.address;
    const signer1Address : Address = users.signer1.address;
    const signer2Address : Address = users.signer2.address;
    
    // remove exclamatory
    const pkhInitiator = getAddressDetails(initiatorAddress).paymentCredential?.hash!;
    const pkhSigner1 = getAddressDetails(signer1Address).paymentCredential?.hash!;
    const pkhSigner2 = getAddressDetails(signer2Address).paymentCredential?.hash!;

    console.log("Initiator pkh", pkhInitiator);
    console.log("signer1 pkh", pkhSigner1);
    console.log("signer2 pkh", pkhSigner2);
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
      console.log("tx unsigned",validatesignTxUnSigned);
      expect(validatesignTxUnSigned.type).toBe("ok");
       if (validatesignTxUnSigned.type == "ok") {
        lucid.selectWallet.fromSeed(users.initiator.seedPhrase);
            const partialSignInitiator = await validatesignTxUnSigned.data.partialSign.withWallet();
            lucid.selectWallet.fromSeed(users.signer1.seedPhrase);
            const partialSignSigner1 = await validatesignTxUnSigned.data.partialSign.withWallet();
            lucid.selectWallet.fromSeed(users.signer2.seedPhrase);
            const partialSignSigner2 = await validatesignTxUnSigned.data.partialSign.withWallet();
            //const signTxHash = await signTxSigned.submit();
            const assembleTx = validatesignTxUnSigned.data.assemble([partialSignInitiator, partialSignSigner1,partialSignSigner2]);
            return assembleTx;
            const signTxHash = await assembleTx.completeProgram;
      
}
      emulator.awaitBlock(100);
      console.log("utxos at receipient address", await lucid.utxosAt(recipientAddress));
      console.log("utxos at validator address", await lucid.utxosAt(valAddress));
     
    });