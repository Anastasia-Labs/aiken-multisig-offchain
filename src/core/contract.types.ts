import { Data } from "@lucid-evolution/lucid";
import { Sign } from "crypto";

// export const OutputReferenceSchema = Data.Object({
//   txHash: Data.Object({ hash: Data.Bytes({ minLength: 32, maxLength: 32 }) }),
//   outputIndex: Data.Integer(),
// });

export const OutputReferenceSchema = Data.Object({
  txHash: Data.Bytes({ minLength: 32, maxLength: 32 }),
  outputIndex: Data.Integer(),
});

export type OutputReference = Data.Static<typeof OutputReferenceSchema>;
export const OutputReference =
  OutputReferenceSchema as unknown as OutputReference;

export const CreateMintSchema = Data.Object({
  output_reference: OutputReferenceSchema,
  output_index: Data.Integer(),
});

export type InitiateMultiSig = Data.Static<typeof CreateMintSchema>;
export const InitiateMultiSig = CreateMintSchema as unknown as InitiateMultiSig;

export const SignRedeemerSchema = Data.Object({
  input_index: Data.Integer(),
  output_index: Data.Integer(),
});

export type SignMultiSig = Data.Static<typeof SignRedeemerSchema>;
export const SignMultiSig = SignRedeemerSchema as unknown as SignMultiSig;

export const MultisigDatumSchema = Data.Object({
  signers: Data.Array(Data.Bytes()), // list of pub key hashes
  threshold: Data.Integer(),
  fund_policy_id: Data.Bytes(),
  fund_asset_name: Data.Bytes(),
  spending_limit: Data.Integer(),
});

export type MultisigDatum = Data.Static<typeof MultisigDatumSchema>;
export const MultisigDatum = MultisigDatumSchema as unknown as MultisigDatum;

export const MultisigRedeemerSchema = Data.Enum([
  Data.Object({ Sign: Data.Tuple([SignRedeemerSchema]) }),
  Data.Object({ Update: Data.Tuple([SignRedeemerSchema]) }),
  Data.Object({ Remove: Data.Tuple([SignRedeemerSchema]) }),
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
