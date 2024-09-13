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

export const CredentialSchema = Data.Enum([
  Data.Object({
    PublicKeyCredential: Data.Tuple([
      Data.Bytes({ minLength: 28, maxLength: 28 }),
    ]),
  }),
  Data.Object({
    ScriptCredential: Data.Tuple([
      Data.Bytes({ minLength: 28, maxLength: 28 }),
    ]),
  }),
]);
export type CredentialD = Data.Static<typeof CredentialSchema>;
export const CredentialD = CredentialSchema as unknown as CredentialD;

export const AddressSchema = Data.Object({
  paymentCredential: CredentialSchema,
  stakeCredential: Data.Nullable(
    Data.Enum([
      Data.Object({ Inline: Data.Tuple([CredentialSchema]) }),
      Data.Object({
        Pointer: Data.Tuple([
          Data.Object({
            slotNumber: Data.Integer(),
            transactionIndex: Data.Integer(),
            certificateIndex: Data.Integer(),
          }),
        ]),
      }),
    ])
  ),
});
export type AddressD = Data.Static<typeof AddressSchema>;
export const AddressD = AddressSchema as unknown as AddressD;