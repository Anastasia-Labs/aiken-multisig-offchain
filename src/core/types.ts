import { Address, Assets, OutRef, Script } from "@lucid-evolution/lucid";

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
  fund_policy_id: string;
  fund_asset_name: string;
  spending_limit: bigint;
  total_funds_qty: bigint;
};

export type SignConfig = {
  signers: string[];
  threshold: bigint;
  fund_policy_id: string;
  fund_asset_name: string;
  spending_limit: bigint;
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
  fund_policy_id: string;
  fund_asset_name: string;
  new_spending_limit: bigint;
};

export type ReadableUTxO<T> = {
  outRef: OutRef;
  datum: T;
  assets: Assets;
};
