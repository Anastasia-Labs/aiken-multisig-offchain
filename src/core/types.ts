import { Address, Script } from "@lucid-evolution/lucid";

export type CborHex = string;

export type Result<T> =
  | { type: "ok"; data: T }
  | { type: "error"; error: Error };

export type Either<L, R> =
  | { type: "left"; value: L }
  | { type: "right"; value: R };

export type MultiSigConfig = {
  signers_addr: string[];
  threshold: bigint;
  fund_policy_id: string;
  fund_asset_name: string;
  spending_limit: bigint;
  total_funds_qty: bigint;
};

export type EndSigConfig = {
  signers_addr: string[];
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
  signers_addr: string[];
};

export type UpdateValidateConfig = {
  new_signers_addr: string[];
  new_threshold: bigint; // new threshold
  fund_policy_id: string;
  fund_asset_name: string;
  new_spending_limit: bigint;
};

export type DeployRefScriptsConfig = {
  token_name: string;
  current_time: BigInt;
};
