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

export type AssetClass = Data.Static<typeof AssetClassSchema>;
export const AssetClass = AssetClassSchema as unknown as AssetClass;

//
//type PubKeyHash =
//  Hash<Blake2b_224, VerificationKey>
// this is not needed as pubkeyhash is just verification key and can be generated using wallet generation in lucid
/*export const PubKeyHashSchema = Data.Object({
    hash : Data.Bytes({ minLength: 28, maxLength: 28 }),
    verificationkey : Data.Bytes()
});

export type PubKey = Data.Static<typeof PubKeyHashSchema>;
export const PubKey = PubKeyHashSchema as unknown as PubKey;*/

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

export type MultisigDatum = Data.Static<typeof MultisigDatumSchema>;
export const MultisigDatum = MultisigDatumSchema as unknown as MultisigDatum;

export const MultisigRedeemerSchema = Data.Enum([
    Data.Literal("Sign"),
    Data.Literal("Update"),
  ]);

//pub type MultisigRedeemer {
//  Sign
//  Update
//}
export type MultisigRedeemer = Data.Static<typeof MultisigRedeemerSchema>;
export const MultisigRedeemer = MultisigRedeemerSchema as unknown as MultisigRedeemer;