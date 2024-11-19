import { Address, Assets, OutRef, Script } from "@lucid-evolution/lucid";
import { AssetClass } from "./contract.types.js";

export type CborHex = string;

export type Result<T> =
  | { type: "ok"; data: T }
  | { type: "error"; error: Error };

export type Either<L, R> =
  | { type: "left"; value: L }
  | { type: "right"; value: R };

export type MultiSigConfig = {
  signers: string[]; // what should come here for list of public key hashes
  threshold: bigint;
  funds: AssetClass;
  spendingLimit: bigint;
  totalFundsQty: bigint;
  scripts: {
    spending: CborHex; // change to scripts
    minting: CborHex; // change to scripts
  };
};

export type SignConfig = {
  signers: string[]; // what should come here for list of public key hashes
  threshold: bigint;
  funds: AssetClass;
  spendingLimit: bigint;
  scripts: {
    spending: CborHex; // change to scripts
    minting: CborHex; // change to scripts
  };
};

export type MultiSigValidators = {
  spendValidator: Script;
  spendValAddress: Address;
  mintPolicy: Script;
  mintPolicyAddress: Address;
};

export type ValidateSignConfig = {
  signOutRef: OutRef;
  withdrawalAmount: bigint;
  recipientAddress: Address;
  signersList: string[];
  scripts: {
    spending: CborHex; // change to scripts
    minting: CborHex; // change to scripts
  };
};

export type UpdateValidateConfig = {
  signOutRef: OutRef;
  new_signers: string[];
  new_threshold: bigint; // new threshold
  funds: AssetClass;
  new_spendingLimit: bigint;
  //funds : AssetClass;
  //spendingLimit : BigInt,
  scripts: {
    spending: CborHex; // change to scripts
    minting: CborHex; // change to scripts
  };
};

export type Config = {
  scripts: {
    spending: CborHex; // change to scripts
    minting: CborHex; // change to scripts
  };
};

export type ReadableUTxO<T> = {
  outRef: OutRef;
  datum: T;
  assets: Assets;
};
