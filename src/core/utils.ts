import {
  Address,
  Assets,
  Data,
  Emulator,
  generateSeedPhrase,
  getAddressDetails,
  Lucid,
  LucidEvolution,
  UTxO,
} from "@lucid-evolution/lucid";
import { AddressD, MultisigDatum } from "./contract.types.js";
import { Either } from "./types.js";

//TODO: Add utility function to fetch utxo with pub key hash.

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

export const getSortedPublicKeyHashes = (addresses: Address[]): string[] => {
  // Convert addresses to public key hashes
  const publicKeyHashes = addresses.map((address) => {
    const result = getPublicKeyHash(address);
    if (result instanceof Error) {
      console.error(`Failed to get PKH for address ${address}: ${result.message}`);
      return null;
    }
    return result;
  });

  // Filter out null values (failed conversions)
  const validPublicKeyHashes = publicKeyHashes.filter(pkh => pkh !== null);

  // Convert to lowercase and sort
  const sortedHashes = validPublicKeyHashes.map(pkh => pkh.toLowerCase());
  sortedHashes.sort();
  
  return sortedHashes;
};

export const generateAccountSeedPhrase = async (assets: Assets) => {
  const seedPhrase = generateSeedPhrase();
  const lucid = await Lucid(new Emulator([]), "Custom");
  lucid.selectWallet.fromSeed(seedPhrase);
  const address = lucid.wallet().address;
  return {
    seedPhrase,
    address,
    assets,
  };
};

export async function getUserAddressAndPKH(
  lucid: LucidEvolution,
  seedPhrase: string,
): Promise<{ address: Address; pkh: string }> {
  // Select the wallet from the seed phrase
  lucid.selectWallet.fromSeed(seedPhrase);

  // Get the address
  const address = await lucid.wallet().address();

  // Get the payment credential hash (public key hash)
  const addressDetails = getAddressDetails(address);
  const pkh = addressDetails.paymentCredential?.hash;

  if (!pkh) {
    throw new Error("Failed to retrieve public key hash from address");
  }

  return { address, pkh };
}

export const getMultisigDatum = async (
  utxos: UTxO[],
): Promise<MultisigDatum[]> => {
  return utxos.flatMap((utxo, index) => {
    if (!utxo.datum) {
      console.error(`UTxO ${index} has no datum.`);
      return [];
    }

    try {
      const result = parseSafeDatum<MultisigDatum>(
        utxo.datum,
        MultisigDatum,
      );

      if (result.type == "right") {
        return [result.value]; // Return as array to match flatMap expectations
      } else {
        console.error(
          `Failed to parse datum for UTxO ${index}:`,
          result.type,
        );
        return [];
      }
    } catch (error) {
      console.error(
        `Exception while parsing datum for UTxO ${index}:`,
        error,
      );
      return [];
    }
  });
};
