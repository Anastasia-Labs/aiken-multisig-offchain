import { Address, OutRef, Script } from "@lucid-evolution/lucid";
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
    scripts : {
      multisig: CborHex; // change to scripts
    }
  };