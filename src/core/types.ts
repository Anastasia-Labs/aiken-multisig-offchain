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
  signers: string[];
  threshold: bigint;
  funds: AssetClass;
  spendingLimit: bigint;
  totalFundsQty: bigint;
  minimum_ada: bigint;
  scripts: {
    spending: CborHex;
    minting: CborHex;
  };
};

export type SignConfig = {
  signers: string[];
  threshold: bigint;
  funds: AssetClass;
  spendingLimit: bigint;
  minimum_ada: bigint;
  recipientAddress: Address;
  scripts: {
    spending: CborHex;
    minting: CborHex;
  };
};

export type MultiSigValidators = {
  spendValidator: Script;
  spendValAddress: Address;
  mintPolicy: Script;
  mintPolicyAddress: Address;
};

export type ValidateSignConfig = {
  withdrawalAmount: bigint;
  recipientAddress: Address;
  signersList: string[];
  scripts: {
    spending: CborHex;
    minting: CborHex;
  };
};

export type UpdateValidateConfig = {
  new_signers: string[];
  new_threshold: bigint; // new threshold
  funds: AssetClass;
  new_spendingLimit: bigint;
  minimum_ada: bigint;
  scripts: {
    spending: CborHex;
    minting: CborHex;
  };
};

export type Config = {
  scripts: {
    spending: CborHex;
    minting: CborHex;
  };
};

export type ReadableUTxO<T> = {
  outRef: OutRef;
  datum: T;
  assets: Assets;
};
