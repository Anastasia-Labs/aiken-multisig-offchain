import {
    Blockfrost,
    Emulator,
    generateEmulatorAccount,
    Koios,
    Kupmios,
    Lucid,
    LucidEvolution,
    Maestro,
    PROTOCOL_PARAMETERS_DEFAULT,
} from "@lucid-evolution/lucid";
import { Effect } from "effect";
import dotenv from "dotenv";
dotenv.config();

export type LucidContext = {
    lucid: LucidEvolution;
    users: any;
    emulator?: Emulator;
};

export type Network = "Mainnet" | "Preprod" | "Preview" | "Custom";

export const NETWORK = process.env.NETWORK as Network || "Preprod";

export const makeEmulatorContext = () =>
    Effect.gen(function* ($) {
        const users = {
            dappProvider: yield* Effect.sync(() =>
                generateEmulatorAccount({ lovelace: BigInt(1_000_000_000) })
            ),
            initiator: yield* Effect.sync(() =>
                generateEmulatorAccount({ lovelace: BigInt(10_000_000_000) })
            ),
            signer1: yield* Effect.sync(() =>
                generateEmulatorAccount({ lovelace: BigInt(1_000_000_000) })
            ),
            signer2: yield* Effect.sync(() =>
                generateEmulatorAccount({ lovelace: BigInt(1_000_000_000) })
            ),
            signer3: yield* Effect.sync(() =>
                generateEmulatorAccount({ lovelace: BigInt(1_000_000_000) })
            ),
            recipient: yield* Effect.sync(() =>
                generateEmulatorAccount({ lovelace: BigInt(1_000_000_000) })
            ),
        };

        const emulator = new Emulator([
            users.dappProvider,
            users.initiator,
            users.signer1,
            users.signer2,
            users.signer3,
            users.recipient,
        ], {
            ...PROTOCOL_PARAMETERS_DEFAULT,
            maxTxSize: 21000,
        });

        const lucid = yield* Effect.promise(() => Lucid(emulator, "Custom"));

        return { lucid, users, emulator } as LucidContext;
    });

export const makeMaestroContext = (
    network: Network,
) => Effect.gen(function* ($) {
    const API_KEY = process.env.API_KEY!;
    const DAPP_PROVIDER_SEED = process.env.DAPP_PROVIDER_SEED!;
    const INITIATOR_SEED = process.env.INITIATOR_SEED!;
    const SIGNER_ONE_SEED = process.env.SIGNER_ONE_SEED!;
    const SIGNER_TWO_SEED = process.env.SIGNER_TWO_SEED!;
    const SIGNER_THREE_SEED = process.env.SIGNER_THREE_SEED!;
    const RECIPIENT_SEED = process.env.RECIPIENT_SEED!;

    if (!API_KEY) {
        throw new Error(
            "Missing required environment variables for Maestro context.",
        );
    }

    if (network === "Custom") {
        throw new Error("Cannot create Maestro context with 'Custom' network.");
    }

    //TODO: Use the correct seeds
    const users = {
        dappProvider: {
            seedPhrase: DAPP_PROVIDER_SEED,
        },
        initiator: {
            seedPhrase: INITIATOR_SEED,
        },
        signer1: {
            seedPhrase: SIGNER_ONE_SEED,
        },
        signer2: {
            seedPhrase: SIGNER_TWO_SEED,
        },
        signer3: {
            seedPhrase: SIGNER_THREE_SEED,
        },
        recipient: {
            seedPhrase: RECIPIENT_SEED,
        },
    };

    const maestro = new Maestro({
        network: network,
        apiKey: API_KEY,
        turboSubmit: false,
    });

    const lucid = yield* Effect.promise(() => Lucid(maestro, network));
    // const seed = yield* Effect.promise(() =>
    //     generateAccountSeedPhrase({ lovelace: BigInt(1_000_000_000) })
    // );
    // console.log("Seed: ", seed);

    return { lucid, users, emulator: undefined } as LucidContext;
});

export const makeLucidContext = (
    network?: Network,
) => Effect.gen(function* ($) {
    const API_KEY = process.env.API_KEY;
    const selectedNetwork = network ?? NETWORK; // Default to Preprod if not specified
    // const selectedNetwork = "Custom";

    // console.log("Network Target: ", selectedNetwork);
    if (API_KEY && selectedNetwork !== "Custom") {
        // Use Maestro context
        return yield* $(makeMaestroContext(selectedNetwork));
    } else {
        // Use Emulator context
        return yield* $(makeEmulatorContext());
    }
});
