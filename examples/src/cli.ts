#!/usr/bin/env node
import { Command } from "commander";
import { run } from "./init_multi_sig.js";
import dotenv from "dotenv";
import { Lucid, Maestro } from "@anastasia-labs/aiken-multisig-offchain";

// Load environment variables
dotenv.config();

const program = new Command();

program
    .name("multisig-cli")
    .description("CLI for managing multisig operations")
    .version("1.0.0");

program
    .command("init")
    .description("Initialize a new multisig contract")
    .option(
        "-n, --network <network>",
        "Network to use (preprod/mainnet)",
        "preprod",
    )
    .option("-t, --threshold <number>", "Number of required signatures", "2")
    .option("-l, --limit <number>", "Spending limit in lovelace", "10000000")
    .option("-f, --funds <number>", "Total funds in lovelace", "90000000")
    .option("-m, --min-ada <number>", "Minimum ADA requirement", "2000000")
    .action(async (options) => {
        try {
            const API_KEY = process.env.API_KEY!;
            const INITIATOR_SEED = process.env.INITIATOR_SEED!;
            const SIGNER_ONE_SEED = process.env.SIGNER_ONE_SEED!;
            const SIGNER_TWO_SEED = process.env.SIGNER_TWO_SEED!;
            const SIGNER_THREE_SEED = process.env.SIGNER_THREE_SEED!;

            if (!API_KEY) {
                throw new Error("Missing required API_KEY.");
            }

            console.log("LOGGG ", API_KEY);
            // Create Lucid instance (remove top-level await)
            const lucid = await Lucid(
                new Maestro({
                    network: "Preprod",
                    apiKey: API_KEY,
                    turboSubmit: false,
                }),
                "Preprod",
            );

            await run(
                lucid,
                INITIATOR_SEED,
                SIGNER_ONE_SEED,
                SIGNER_TWO_SEED,
                SIGNER_THREE_SEED,
            );
            process.exit(0);
        } catch (error) {
            console.error("Error:", error);
            process.exit(1);
        }
    });

program.parse();
