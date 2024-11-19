import {
    Emulator,
    generateEmulatorAccount,
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
    const SUBSCRIBER_WALLET_SEED = process.env.SUBSCRIBER_WALLET_SEED!;
    const MERCHANT_WALLET_SEED = process.env.MERCHANT_WALLET_SEED!;

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
            seedPhrase: SUBSCRIBER_WALLET_SEED,
        },
        signer1: {
            seedPhrase: MERCHANT_WALLET_SEED,
        },
        signer2: {
            seedPhrase: MERCHANT_WALLET_SEED,
        },
        signer3: {
            seedPhrase: MERCHANT_WALLET_SEED,
        },
        recipient: {
            seedPhrase: MERCHANT_WALLET_SEED,
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
    // const selectedNetwork = network ?? NETWORK; // Default to Preprod if not specified
    const selectedNetwork = "Custom"; // Default to Preprod if not specified

    console.log("Network Target: ", selectedNetwork);
    if (API_KEY && selectedNetwork !== "Custom") {
        // Use Maestro context
        return yield* $(makeMaestroContext(selectedNetwork));
    } else {
        // Use Emulator context
        return yield* $(makeEmulatorContext());
    }
});
function generateAccountSeedPhrase(
    arg0: { lovelace: bigint },
): PromiseLike<unknown> {
    throw new Error("Function not implemented.");
}
