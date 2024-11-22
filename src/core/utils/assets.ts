import { Assets, UTxO } from "@lucid-evolution/lucid";
import { bytesToHex, concatBytes, hexToBytes } from "@noble/hashes/utils";
import { sha3_256 } from "@noble/hashes/sha3";

const generateUniqueAssetName = (utxo: UTxO, prefix: string): string => {
    // sha3_256 hash of the tx id
    const txIdHash = sha3_256(hexToBytes(utxo.txHash));

    // prefix the txid hash with the index
    const indexByte = new Uint8Array([utxo.outputIndex]);
    const prependIndex = concatBytes(indexByte, txIdHash);

    if (prefix != null) {
        // concat the prefix
        const prependPrefix = concatBytes(hexToBytes(prefix), prependIndex);
        return bytesToHex(prependPrefix.slice(0, 32));
    } else {
        return bytesToHex(prependIndex.slice(0, 32));
    }
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
