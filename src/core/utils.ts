import {
  Address,
  Data,
  Emulator,
  getAddressDetails,
  LucidEvolution,
} from "@lucid-evolution/lucid";
import { AddressD } from "./contract.types.js";
import { Either } from "./types.js";

export type LucidContext = {
  lucid: LucidEvolution;
  users: any;
  emulator: Emulator;
};

export function fromAddress(address: Address): AddressD {
  // We do not support pointer addresses!

  const { paymentCredential, stakeCredential } = getAddressDetails(address);

  if (!paymentCredential) throw new Error("Not a valid payment address.");

  return {
    paymentCredential: paymentCredential?.type === "Key"
      ? {
        PublicKeyCredential: [paymentCredential.hash],
      }
      : { ScriptCredential: [paymentCredential.hash] },
    stakeCredential: stakeCredential
      ? {
        Inline: [
          stakeCredential.type === "Key"
            ? {
              PublicKeyCredential: [stakeCredential.hash],
            }
            : { ScriptCredential: [stakeCredential.hash] },
        ],
      }
      : null,
  };
}
export const parseSafeDatum = <T>(
  datum: string | null | undefined,
  datumType: T,
): Either<string, T> => {
  if (datum) {
    try {
      const parsedDatum = Data.from(datum, datumType);
      return {
        type: "right",
        value: parsedDatum,
      };
    } catch (error) {
      return { type: "left", value: `invalid datum : ${error}` };
    }
  } else {
    return { type: "left", value: "missing datum" };
  }
};

export const getPublicKeyHash = (addr: Address) => {
  const pkh = getAddressDetails(addr).paymentCredential?.hash;
  if (pkh == undefined) {
    return new Error("payment credential missing");
  } else {
    return pkh;
  }
};
