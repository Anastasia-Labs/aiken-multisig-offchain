import { Data } from "@lucid-evolution/lucid";

export const OutputReferenceSchema = Data.Object({
  txHash: Data.Object({ hash: Data.Bytes({ minLength: 32, maxLength: 32 }) }),
  outputIndex: Data.Integer(),
});

export type OutputReference = Data.Static<typeof OutputReferenceSchema>;
export const OutputReference =
  OutputReferenceSchema as unknown as OutputReference;

export const CreateMintSchema = Data.Object({
  output_reference: OutputReferenceSchema,
  input_index: Data.Integer(),
});

export const AssetClassSchema = Data.Object({
  policyId: Data.Bytes(),
  assetName: Data.Bytes(),
});

export type AssetClass = Data.Static<typeof AssetClassSchema>;
export const AssetClass = AssetClassSchema as unknown as AssetClass;

export type InitiateMultiSig = Data.Static<typeof CreateMintSchema>;
export const InitiateMultiSig = CreateMintSchema as unknown as InitiateMultiSig;

export const MultisigDatumSchema = Data.Object({
  signers: Data.Array(Data.Bytes()), // list of pub key hashes
  threshold: Data.Integer(),
  funds: AssetClassSchema,
  spendingLimit: Data.Integer(),
  minimum_ada: Data.Integer(),
});

export type MultisigDatum = Data.Static<typeof MultisigDatumSchema>;
export const MultisigDatum = MultisigDatumSchema as unknown as MultisigDatum;

export const MultisigRedeemerSchema = Data.Enum([
  Data.Literal("Sign"),
  Data.Literal("Update"),
  Data.Literal("Remove"),
]);

export type MultisigRedeemer = Data.Static<typeof MultisigRedeemerSchema>;
export const MultisigRedeemer =
  MultisigRedeemerSchema as unknown as MultisigRedeemer;

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
    ]),
  ),
});
export type AddressD = Data.Static<typeof AddressSchema>;
export const AddressD = AddressSchema as unknown as AddressD;
