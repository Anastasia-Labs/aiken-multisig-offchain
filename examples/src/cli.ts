// // src/cli.ts
// import { config } from "dotenv";
// config(); // Load environment variables from .env if you want

// import { run } from "./init_multi_sig.js";
// // ^ Adjust path as needed (if using NodeNext/ESM, remember the .js/.ts extension)

// async function main() {
//     // 1) Grab env variables
//     const apiKey = process.env.API_KEY; // Maestro API Key
//     const initiatorSeed = process.env.INITIATOR_SEED;
//     const signerOneSeed = process.env.SIGNER_ONE_SEED;
//     const signerTwoSeed = process.env.SIGNER_TWO_SEED;

//     // 2) Verify they exist
//     if (!apiKey || !initiatorSeed || !signerOneSeed || !signerTwoSeed) {
//         throw new Error(
//             "Missing environment variables. Check .env or your shell environment.",
//         );
//     }

//     // 3) Call the run function
//     const result = await run(
//         apiKey,
//         initiatorSeed,
//         signerOneSeed,
//         signerTwoSeed,
//     );

//     // 4) Check if it returned an error
//     if (result instanceof Error) {
//         console.error("Error in multisig flow:", result.message);
//         process.exit(1);
//     } else {
//         console.log("Multisig flow completed successfully!");
//     }
// }

// // 5) Execute main()
// main().catch((err) => {
//     console.error("Fatal error:", err);
//     process.exit(1);
// });
