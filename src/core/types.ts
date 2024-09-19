import { Address, Assets, OutRef, Script } from "@lucid-evolution/lucid";
import { AssetClass } from "./contracttypes";

export type CborHex = string;

export type Result<T> =
  | { type: "ok"; data: T }
  | { type: "error"; error: Error };

export type Either<L, R> =
  | { type: "left"; value: L }
  | { type: "right"; value: R };

export type SignConfig = { 
  signers : string[];// what should come here for list of public key hashes
  threshold : BigInt;
  funds : AssetClass;
  spendingLimit : BigInt,
    scripts : {
      multisig: CborHex; // change to scripts
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
      multisig: CborHex; // change to scripts
    }
  };

  
  export type UpdateValidateConfig = {
    signOutRef : OutRef;
    new_signers : string[];
    new_threshold : bigint; // new threshold
    funds : AssetClass;
    new_spendingLimit : bigint,
    //funds : AssetClass;
    //spendingLimit : BigInt,
    scripts : {
      multisig: CborHex; // change to scripts
    },
    old_signers : string[],
    old_threshold : bigint,
    old_spendingLimit : bigint
  };

  export type Config = {
    scripts : {
      multisig: CborHex; // change to scripts
    }
  };

  export type ReadableUTxO<T> = {
    outRef: OutRef;
    datum: T;
    assets: Assets;
  };
