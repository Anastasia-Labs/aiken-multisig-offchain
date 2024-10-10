# Table of Contents

- [Aiken Upgradable Multisig Offchain](#aiken-upgradable-multisig-offchain)
  - [Introduction](#introduction)
  - [Documentation](#documentation)
    - [What is P2P trading?](#what-is-peer-to-peer-p2p-trading)
    - [How can this project facilitate P2P trading?](#how-can-this-project-facilitate-p2p-trading)
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

export const lucid = await Lucid.new(
  new Maestro({
    network: "Preprod",
    apiKey: "your maestro api key",
  }),
  "Preprod"
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

const signConfig: SignConfig = {
  signers: [pkhInitiator, pkhSigner1, pkhSigner2],
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
const makeOfferConfig: MakeOfferConfig = {
  offer: {
    ["lovelace"]: 10_000_000n,
  },
  toBuy: {
    [toUnit(
      "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72",
      "4d494e"
    )]: 10_000n,
  },
  scripts: offerScripts,
};

const signTxUnSigned = await sign(lucid, signConfig);

expect(signTxUnSigned.type).toBe("ok");
if (signTxUnSigned.type == "ok") {
  const signTxSigned = await signTxUnSigned.data.sign.withWallet().complete();
  const signTxHash = await signTxSigned.submit();
  console.log(`Signed Tx: ${signTxHash}`);
}
```

### Fetch Offer

```ts
import {
  FetchOfferConfig,
  getOfferUTxOs,
} from "@anastasia-labs/direct-offer-offchain";

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

![direct-offer-offchain](/assets/gifs/direct-offer-offchain.gif)
