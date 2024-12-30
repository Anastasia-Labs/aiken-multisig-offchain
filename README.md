# Table of Contents

- [Aiken Upgradable Multisig Offchain](#aiken-upgradable-multisig-offchain)
  - [Introduction](#introduction)
  - [Documentation](#documentation)
  - [Usage Example](#usage-example)
    - [Setup](#setup-lucid--multisig-scripts)
    - [Initiate Multisig Contract](#initiate-multisig-contract)
    - [Sign](#sign)
    - [Update Multisig Contract](#update-multisig-contract)
    - [Adjust Signer Threshold](#adjust-signer-threshold)
  - [Local Build](#local-build)
  - [Test Framework](#test-framework)
  - [Running Tests](#running-tests)

<!-- TODO: Link to lucid-evolution -->
<!-- TODO: Clean up the examples with actual code -->
# Aiken Upgradable Multisig Offchain

## Introduction

The Aiken Multisig Offchain is a typescript based SDK built to conveniently interact with an Aiken based secure and flexible multi-signature smart contract designed specifically for the Cardano Blockchain.  It provides developers with an easy-to-use interface to manage multisig wallets, enabling secure and flexible transactions that require multiple authorized signatures.

**Key features:**

- **Secure Spending of Assets:** Ensure that asset transactions can only be executed by authorized members.
- **Seamless Adjustment of Signer Thresholds:** Adjust the required number of signatures needed to approve transactions without compromising security.
- **Addition or Removal of Signers:** Update the list of signatories and threshold as needed.
- **Spending Limits Enforcement:** Define and enforce spending limits for transactions to enhance security.
- **Asset Support:** Manage both ADA and other Cardano native tokens.

This project is funded by the Cardano Treasury in [Catalyst Fund 11](https://projectcatalyst.io/funds/11/cardano-use-cases-product/anastasia-labs-x-maestro-plug-n-play-20)

## Documentation

### What is a Multisignature (Multisig) Contract?

A multisignature (multisig) contract is a smart contract that requires multiple parties to authorize a transaction before it can be executed. This adds an extra layer of security by distributing the approval authority among multiple trusted signatories. Multisig contracts are commonly used in scenarios where assets need to be managed collectively, such as joint accounts, corporate treasury management, or any situation where shared control over funds is desired.

### How Does This Project Facilitate Multisig Transactions?

This project provides an off-chain SDK to interact along with our [Aiken Upgradable Multisig](https://github.com/Anastasia-Labs/aiken-upgradable-multisig). The contract allows authorized members to execute asset transactions within predefined thresholds. 
It fullfills the requirements of an upgradable multisig by enabling:

- **Transaction Approval:** Ensure transactions execute only with the required number of signatures.
- **Signer Management:** Add or remove signers to reflect organizational changes.
- **Threshold Adjustment:** Seamlessly adjust the signature threshold as needed.
- **Spending Limits:** Define and enforce maximum withdrawal amounts per transaction.


### Design Documentation

For a comprehensive understanding of the contract's architecture, design
decisions, and implementation details, please refer to the
[Design Documentation](https://github.com/Anastasia-Labs/aiken-upgradable-multisig/blob/main/docs/design-specs/upgradable-multi-sig.pdf). This
documentation provides in-depth insights into the contract's design, including
its components, and detailed explanations of its functionality.

## Usage Example

### Install package

```sh
npm install @anastasia-labs/aiken-multisig-offchain
```

or

```sh
pnpm install @anastasia-labs/aiken-multisig-offchain
```

### Setup Lucid & Multisig Scripts

```ts
// You can get the compiled scripts here: https://github.com/Anastasia-Labs/direct-offer/tree/master/compiled
import Script from "../src/validator/multisig_validator.json" assert { type: "json" };

const lucid = await Lucid(
  new Maestro({
    network: "Preprod",
    apiKey: "<Your-API-Key>", // Get yours by visiting https://docs.gomaestro.org/docs/Getting-started/Sign-up-login
    turboSubmit: false, // Read about paid turbo transaction submission feature at https://docs.gomaestro.org/docs/Dapp%20Platform/Turbo%20Transaction
  }),
  "Preprod" 
);

lucid.selectWallet.fromPrivateKey("your secret key here e.g. ed25519_...");

```

### Initiate Multisig Contract

```ts
import { initiateMultisig, MultiSigConfig } from "@anastasia-labs/aiken-multisig-offchain";

// Define signatories' public key hashes
const initiatorPkh = getAddressDetails(initiatorAddress).paymentCredential?.hash!;
const signer1Pkh = getAddressDetails(signer1Address).paymentCredential?.hash!;
const signer2Pkh = getAddressDetails(signer2Address).paymentCredential?.hash!;

// Configure the multisig parameters
const initConfig: MultiSigConfig = {
  signers: [initiatorPkh, signer1Pkh, signer2Pkh],
  threshold: 2n, // Require two out of three signatures
  funds: {
    policyId: "", // For ADA, leave empty
    assetName: "", // For ADA, leave empty
  },
  spending_limit: 10_000_000n, // 10 ADA in lovelace
  total_funds_qty: 100_000_000n, // Total ADA in lovelace to be locked in the contract
  minimum_ada: 2_000_000n, // Minimum ADA required in lovelace
};

// Initiate the multisig contract
const initTxUnsigned = await initiateMultisig(lucid, initConfig);

if (initTxUnsigned.type === "ok") {
  // Sign the transaction with the initiator's wallet
  const initTxSigned = await initTxUnsigned.data.sign().complete();
  const initTxHash = await initTxSigned.submit();
  console.log(`Multisig Contract Initiated: ${initTxHash}`);
} else {
  console.error("Failed to initiate multisig contract:", initTxUnsigned.error);
}

```

### Sign

```ts
import { validateSign, ValidateSignConfig } from "@anastasia-labs/aiken-multisig-offchain";

// Configure the sign transaction
const validateSignConfig: ValidateSignConfig = {
  withdrawal_amount: 5_000_000n, // Amount to withdraw in lovelace
  recipient_address: recipient_address, // Address to receive the funds
  signers_list: [initiatorPkh, signer1Pkh], // Signatories participating
};

// Validate and prepare the transaction
const signTxUnsigned = await validateSign(lucid, validateSignConfig);

if (signTxUnsigned.type === "ok") {
  const partialSignatures: string[] = [];

  // Collect partial signatures from each signatory
  for (const signerSeed of [users.initiator.seedPhrase, users.signer1.seedPhrase]) {
    lucid.selectWalletFromSeed(signerSeed);
    const partialSign = await signTxUnsigned.data.partialSign.withWallet();
    partialSignatures.push(partialSign);
  }

  // Assemble and complete the transaction
  const assembledTx = signTxUnsigned.data.assemble(partialSignatures);
  const completeTx = await assembledTx.complete();
  const signTxHash = await completeTx.submit();
  console.log(`Transaction Signed and Submitted: ${signTxHash}`);
} else {
  console.error("Failed to sign transaction:", signTxUnsigned.error);
}

```

### Update Multisig Contract

#### Adjust Signer Threshold

```ts
import { validateUpdate, UpdateValidateConfig } from "@anastasia-labs/aiken-multisig-offchain";

// Adjust the threshold to require all three signatures
const updateConfig: UpdateValidateConfig = {
  new_signers: [initiatorPkh, signer1Pkh, signer2Pkh],
  new_threshold: 3n,
  funds: {
    policyId: "",
    assetName: "",
  },
  new_spending_limit: 15_000_000n,
  minimum_ada: 2_000_000n,
};

// Validate and prepare the update transaction
const updateTxUnsigned = await validateUpdate(lucid, updateConfig);

if (updateTxUnsigned.type === "ok") {
  const partialSignatures: string[] = [];

  // Collect partial signatures from each signatory
  for (const signerSeed of [users.initiator.seedPhrase, users.signer1.seedPhrase, users.signer2.seedPhrase]) {
    lucid.selectWalletFromSeed(signerSeed);
    const partialSign = await updateTxUnsigned.data.partialSign.withWallet();
    partialSignatures.push(partialSign);
  }

  // Assemble and complete the transaction
  const assembledTx = updateTxUnsigned.data.assemble(partialSignatures);
  const completeTx = await assembledTx.complete();
  const updateTxHash = await completeTx.submit();
  console.log(`Multisig Contract Updated: ${updateTxHash}`);
} else {
  console.error("Failed to update multisig contract:", updateTxUnsigned.error);
}

```

#### Add or Remove Signers
#### Adding a New Signer:

```ts
// Add a new signer
const signer3Pkh = getAddressDetails(signer3Address).paymentCredential?.hash!;

// Update the signers list and threshold
const addSignerConfig: UpdateValidateConfig = {
  new_signers: [initiatorPkh, signer1Pkh, signer2Pkh, signer3Pkh],
  new_threshold: 3n,
  funds: {
    policyId: "",
    assetName: "",
  },
  new_spending_limit: 20_000_000n,
  minimum_ada: 2_000_000n,
};

// Proceed with validation and signing as shown in the update example

```

#### Removing a Signer:

```ts
// Remove a signer (e.g., signer2)
const updatedSigners = [initiatorPkh, signer1Pkh];

// Update the signers list and threshold
const removeSignerConfig: UpdateValidateConfig = {
  new_signers: updatedSigners,
  new_threshold: 2n,
  funds: {
    policyId: "",
    assetName: "",
  },
  new_spending_limit: 10_000_000n,
  minimum_ada: 2_000_000n,
};

// Proceed with validation and signing as shown in the update example

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

Test Results:

![aiken-multisig-tests](/assets/images/multisif-tests.png)


