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
  spending_limit: bigint;
  total_funds_qty: bigint;
  minimum_ada: bigint;
};

export type SignConfig = {
  signers: string[];
  threshold: bigint;
  funds: AssetClass;
  spending_limit: bigint;
  minimum_ada: bigint;
  recipient_address: Address;
};

export type MultiSigValidators = {
  spendValidator: Script;
  spendValAddress: Address;
  mintPolicy: Script;
  mintPolicyAddress: Address;
};

export type ValidateSignConfig = {
  withdrawal_amount: bigint;
  recipient_address: Address;
  signers_list: string[];
};

export type UpdateValidateConfig = {
  new_signers: string[];
  new_threshold: bigint; // new threshold
  funds: AssetClass;
  new_spending_limit: bigint;
  minimum_ada: bigint;
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
