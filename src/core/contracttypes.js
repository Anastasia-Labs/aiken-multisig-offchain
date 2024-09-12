import { Data } from "@lucid-evolution/lucid";
// Define the datum and redeemer structures
//pub type AssetClass {
//  policy_id: ByteArray,
//  asset_name: ByteArray,
//}
export const AssetClassSchema = Data.Object({
    policyId: Data.Bytes(),
    assetName: Data.Bytes(),
});
export const AssetClass = AssetClassSchema;
//type PubKeyHash =
//  Hash<Blake2b_224, VerificationKey>
export const PubKeyHashSchema = Data.Object({
    hash: Data.Bytes({ minLength: 28, maxLength: 28 }),
    verificationkey: Data.Bytes()
});
export const PubKey = PubKeyHashSchema;
//pub type MultisigDatum {
//  signers: List<PubKeyHash>,
//  threshold: Int,
//  funds: AssetClass,
//  spending_limit: Int,
// }
export const MultisigDatumSchema = Data.Object({
    signers: Data.Array(Data.Bytes()), // list of pub key hashes
    threshold: Data.Integer(),
    funds: AssetClassSchema,
    spendingLimit: Data.Integer(),
});
export const MultisigDatum = MultisigDatumSchema;
export const MultisigRedeemerSchema = Data.Enum([
    Data.Literal("Sign"),
    Data.Literal("Update"),
]);
export const MultisigRedeemer = MultisigRedeemerSchema;
