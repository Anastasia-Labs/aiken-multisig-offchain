# Table of Contents

- [Aiken Upgradable Multisig Offchain](#aiken-upgradable-multisig-offchain)
  - [Introduction](#introduction)
  - [Usage Example](#usage-example)
    - [Setup](#setup-lucid--offer-scripts)
    - [Make Offer](#make-offer)
    - [Fetch Offer](#fetch-offer)
    - [Accept Offer](#accept-offer)
  - [Local Build](#local-build)
  - [Test Framework](#test-framework)
  - [Running Tests](#running-tests)

# Aiken Upgradable Multisig Offchain

## Introduction

This multi-signature contract is designed for secure transactions on blockchain platforms, requiring multiple signatures to authorize a transaction. It enables you to:

- Set up a multi-signature wallet with a list of authorized signatories.
- Define a threshold for the number of signatures required to approve transactions.
- Update the list of signatories and threshold as needed.
- Enforce spending limits for transactions.

This project is funded by the Cardano Treasury in [Catalyst Fund 11](https://projectcatalyst.io/funds/11/cardano-use-cases-product/anastasia-labs-x-maestro-plug-n-play-20)

## Documentation

## Usage Example

### Install package

```sh
npm install @anastasia-labs/aiken-multisig-offchain
```

or

```sh
pnpm install @anastasia-labs/aiken-multisig-offchain
```

### Setup Lucid & Offer Scripts

```ts
// You can get the compiled scripts here: https://github.com/Anastasia-Labs/direct-offer/tree/master/compiled
import Script from "../src/validator/multisig_validator.json" assert { type: "json" };

const lucid = await Lucid(
  new Maestro({
    network: "Preprod", // For MAINNET: "Mainnet"
    apiKey: "<Your-API-Key>", // Get yours by visiting https://docs.gomaestro.org/docs/Getting-started/Sign-up-login
    turboSubmit: false, // Read about paid turbo transaction submission feature at https://docs.gomaestro.org/docs/Dapp%20Platform/Turbo%20Transaction
  }),
  "Preprod" // For MAINNET: "Mainnet"
);

lucid.selectWallet.fromPrivateKey("your secret key here e.g. ed25519_...");

const multiSigVal: SpendingValidator = {
  type: "PlutusV2",
  script: Script.validators[0].compiledCode,
};
```

### Sign

```ts
import { SignConfig, sign } from "@anastasia-labs/aiken-multisig-offchain";

const initiatorAddress: Address = users.initiator.address;
const signer1Address: Address = users.signer1.address;
const signer2Address: Address = users.signer2.address;

const pkhInitiator =
  getAddressDetails(initiatorAddress).paymentCredential?.hash!;
const pkhSigner1 = getAddressDetails(signer1Address).paymentCredential?.hash!;
const pkhSigner2 = getAddressDetails(signer2Address).paymentCredential?.hash!;

const signConfig: SignConfig = {
  signers: [pkhInitiator, pkhSigner1, pkhSigner2], // what to give here
  threshold: 3n,
  funds: {
    policyId: "",
    assetName: "",
  },
  spendingLimit: 10_000_000n,
  scripts: {
    multisig: multiSigVal.script,
  },
};

const signTxUnSigned = await sign(lucid, signConfig);

expect(signTxUnSigned.type).toBe("ok");
if (signTxUnSigned.type == "ok") {
  const signTxSigned = await signTxUnSigned.data.sign.withWallet().complete();
  const signTxHash = await signTxSigned.submit();
  console.log(`Signed Tx: ${signTxHash}`);
}
```

// to be modified

### Fetch Offer

```ts
import {
  ValidateSignConfig,
  validateSign,
} from "@anastasia-labs/aiken-multisig-offchain";

const offerConfig: FetchOfferConfig = {
  scripts: offerScripts,
};

const offers = await getOfferUTxOs(lucid, offerConfig);
console.log("Available Offers", offers);
```

### Accept Offer

```ts
import {
  AcceptOfferConfig,
  acceptOffer,
} from "@anastasia-labs/direct-offer-offchain";

const acceptOfferConfig: AcceptOfferConfig = {
  offerOutRef: offers[0].outRef,
  scripts: offerScripts,
};

const acceptOfferUnsigned = await acceptOffer(lucid, acceptOfferConfig);

if (acceptOfferUnsigned.type == "ok") {
  const acceptOfferSigned = await acceptOfferUnsigned.data.sign().complete();
  const acceptOfferSignedHash = await acceptOfferSigned.submit();
  await lucid.awaitTx(acceptOfferSignedHash);
  console.log(`Accepted offer: ${acceptOfferSignedHash}`);
}
```

## Local Build

In the main directory

```
pnpm run build
```

## Test framework

https://github.com/vitest-dev/vitest

## Running Tests

```sh
pnpm test
```

![aiken-multisig-offchain](/assets/gifs/aiken-multisig-offchain.gif)
