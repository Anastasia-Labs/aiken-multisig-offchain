import { Address, Assets, OutRef, Script } from "@lucid-evolution/lucid";
import { AssetClass } from "./contract.types";

export type CborHex = string;

export type Result<T> =
  | { type: "ok"; data: T }
  | { type: "error"; error: Error };

export type Either<L, R> =
  | { type: "left"; value: L }
  | { type: "right"; value: R };

export type SignConfig = { 
  signers : string[];
  threshold : BigInt;
  funds : AssetClass;
  spendingLimit : BigInt,
    scripts : {
      multisig: CborHex;
    }
  }
export type MultiSigValidators = {
    multisigVal : Script;
    multisigValAddress : Address;
  }

  export type ValidateSignConfig = {
    signOutRef : OutRef;
    withdrawalAmount : bigint
    recipientAddress : Address
    signersList : string[]
    scripts : {
      multisig: CborHex;
    }
  };

  
  export type UpdateValidateConfig = {
    signOutRef : OutRef;
    new_signers : string[];
    new_threshold : bigint;
    funds : AssetClass;
    new_spendingLimit : bigint,
    scripts : {
      multisig: CborHex;
    },
  };

  export type Config = {
    scripts : {
      multisig: CborHex; 
    }
  };

  export type ReadableUTxO<T> = {
    outRef: OutRef;
    datum: T;
    assets: Assets;
  };
