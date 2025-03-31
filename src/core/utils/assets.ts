import { Assets, UTxO } from "@lucid-evolution/lucid";
import { bytesToHex, concatBytes, hexToBytes } from "@noble/hashes/utils";
import { sha3_256 } from "@noble/hashes/sha3";
import { Data } from "@lucid-evolution/lucid"
import { OutputReference } from "../contract.types.js";
import { blake2b } from "@noble/hashes/blake2b";
import { blake2b_256 } from "@harmoniclabs/crypto";

const generateUniqueAssetName = (utxo: UTxO): string => {
    const outRef : OutputReference = {txHash: utxo.txHash, outputIndex: BigInt(utxo.outputIndex)}
    const outRefCBOR = Data.to(outRef, OutputReference)
    const hash = blake2b_256(hexToBytes(outRefCBOR))
    return bytesToHex(hash);
};

const tokenNameFromUTxO = (
    utxoOrUtxos: UTxO | UTxO[],
    policyId: string,
): string => {
    const utxos = Array.isArray(utxoOrUtxos) ? utxoOrUtxos : [utxoOrUtxos];

    for (const utxo of utxos) {
        const assets: Assets = utxo.assets;

        for (const [assetId, amount] of Object.entries(assets)) {
            // NFTs typically have an amount of 1
            if (amount === 1n && assetId.startsWith(policyId)) {
                // Extract the token name (everything after the policy ID)
                const tokenName = assetId.slice(policyId.length);
                return tokenName;
            }
        }
    }

    // If no matching NFT is found, return null
    return "";
};

export { generateUniqueAssetName, tokenNameFromUTxO };
