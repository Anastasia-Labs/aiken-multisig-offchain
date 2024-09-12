import { Address, Script } from "@lucid-evolution/lucid";
import { AssetClass } from "./contracttypes";

export type CborHex = string;

export type Result<T> =
  | { type: "ok"; data: T }
  | { type: "error"; error: Error };

export type SignConfig = {
    signers : String;// what should come here for list of public key hashes
    threshold : BigInt;
    funds : AssetClass;
    spendingLimit : BigInt
    scripts : {
      multisig: CborHex;
    }
  }

export type MultiSigValidators = {
    multisigVal : Script;
    multisigValAddress : Address;

  }